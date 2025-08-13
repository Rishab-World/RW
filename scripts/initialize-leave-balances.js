#!/usr/bin/env node

/**
 * Initialize Leave Balances for Existing Employees
 * 
 * This script creates leave balance records for all existing employees
 * in the database. It should be run once after setting up the leave
 * management tables.
 * 
 * Usage:
 * node scripts/initialize-leave-balances.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeLeaveBalances() {
  try {
    console.log('🚀 Starting leave balance initialization...');
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    console.log(`📅 Current year: ${currentYear}, Current month: ${currentMonth}`);
    
    // Get all active employees
    console.log('👥 Fetching active employees...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, email, department, position, employee_id')
      .eq('status', 'active');
    
    if (empError) {
      throw new Error(`Failed to fetch employees: ${empError.message}`);
    }
    
    if (!employees || employees.length === 0) {
      console.log('ℹ️  No active employees found');
      return;
    }
    
    console.log(`✅ Found ${employees.length} active employees`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Create leave balance records for each employee
    for (const employee of employees) {
      try {
        console.log(`\n👤 Processing employee: ${employee.name} (${employee.employee_id || 'No ID'})`);
        
        // Create records for current year from current month onwards
        for (let month = currentMonth; month <= 12; month++) {
          const { error: insertError } = await supabase
            .from('employee_leave_balances')
            .upsert({
              employee_id: employee.id,
              year: currentYear,
              month: month,
              pl_opening_balance: 25,
              cl_opening_balance: 12,
              pl_taken: 0,
              cl_taken: 0,
              pl_closing_balance: 25,
              cl_closing_balance: 12,
              is_manually_updated: false,
            }, {
              onConflict: 'employee_id,year,month'
            });
          
          if (insertError) {
            console.error(`  ❌ Error creating record for ${currentYear}-${month}: ${insertError.message}`);
            errorCount++;
          } else {
            console.log(`  ✅ Created record for ${currentYear}-${month}`);
          }
        }
        
        // Create records for next year
        for (let month = 1; month <= 12; month++) {
          const { error: insertError } = await supabase
            .from('employee_leave_balances')
            .upsert({
              employee_id: employee.id,
              year: currentYear + 1,
              month: month,
              pl_opening_balance: 25,
              cl_opening_balance: 12,
              pl_taken: 0,
              cl_taken: 0,
              pl_closing_balance: 25,
              cl_closing_balance: 12,
              is_manually_updated: false,
            }, {
              onConflict: 'employee_id,year,month'
            });
          
          if (insertError) {
            console.error(`  ❌ Error creating record for ${currentYear + 1}-${month}: ${insertError.message}`);
            errorCount++;
          } else {
            console.log(`  ✅ Created record for ${currentYear + 1}-${month}`);
          }
        }
        
        successCount++;
        
      } catch (employeeError) {
        console.error(`  ❌ Error processing employee ${employee.name}: ${employeeError.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Initialization Summary:');
    console.log(`✅ Successfully processed: ${successCount} employees`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log(`📅 Created records for: ${currentYear} (months ${currentMonth}-12) and ${currentYear + 1} (all months)`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Leave balance initialization completed successfully!');
    } else {
      console.log('\n⚠️  Initialization completed with some errors. Please review the logs above.');
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error during initialization:', error.message);
    process.exit(1);
  }
}

async function verifySetup() {
  try {
    console.log('\n🔍 Verifying setup...');
    
    // Check if tables exist
    const { data: balances, error: balanceError } = await supabase
      .from('employee_leave_balances')
      .select('count')
      .limit(1);
    
    if (balanceError) {
      console.error('❌ employee_leave_balances table not accessible:', balanceError.message);
      return false;
    }
    
    // Check if any records exist
    const { count, error: countError } = await supabase
      .from('employee_leave_balances')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting records:', countError.message);
      return false;
    }
    
    console.log(`✅ Found ${count} leave balance records`);
    return true;
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🏢 HR Portal - Leave Balance Initialization Script');
  console.log('================================================\n');
  
  // Verify setup first
  const isSetupValid = await verifySetup();
  if (!isSetupValid) {
    console.error('\n❌ Setup verification failed. Please ensure:');
    console.error('   1. Database migration has been run');
    console.error('   2. Supabase connection is working');
    console.error('   3. Environment variables are set correctly');
    process.exit(1);
  }
  
  // Run initialization
  await initializeLeaveBalances();
  
  console.log('\n✨ Script execution completed!');
}

// Run the script
main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
