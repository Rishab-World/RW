# Leave Management System - Quick Setup Guide

## 🚀 Quick Start

Follow these steps to set up the Leave Management system in your HR Portal:

### Step 1: Run Database Migration

Execute the SQL migration file in your Supabase database:

```sql
-- Copy and paste the contents of:
-- supabase/migrations/create_leave_management_tables.sql
```

**Or use Supabase CLI:**
```bash
supabase db push
```

### Step 2: Initialize Leave Balances for Existing Employees

Run the initialization script to create leave balance records for all existing employees:

```bash
npm run init-leave
```

This script will:
- ✅ Create leave balance records for current year (remaining months)
- ✅ Create leave balance records for next year (all months)
- ✅ Set default entitlements (PL: 25 days, CL: 12 days)
- ✅ Handle any existing employees in your system

### Step 3: Access the Leave Management System

1. **Navigate to the Leave tab** in your HR Portal
2. **Select year and month** to view leave balances
3. **Use the "Sync from Attendance" button** to import leave data from monthly attendance
4. **Edit individual balances** using the Edit button if needed

## 🔧 What Gets Created

### Database Tables
- `leave_entitlements` - Default leave entitlements per year
- `employee_leave_balances` - Monthly leave balances for each employee
- `leave_records` - Individual leave applications

### Automatic Features
- **Triggers** that calculate closing balances automatically
- **Functions** that handle year-end rollovers
- **Integration** with your existing monthly attendance system

## 📊 Default Settings

- **PL (Privilege Leave)**: 25 days per year
- **CL (Casual Leave)**: 12 days per year
- **Year-end Rollover**: December closing balance becomes January opening balance
- **New Employees**: Automatic leave balance creation

## 🎯 Key Features

### Leave Balance Tracking
- Opening Balance → Leave Taken → Closing Balance
- Manual override capability for HR adjustments
- Real-time calculations

### Attendance Integration
- Automatic sync from monthly attendance data
- Recognizes CL, PL, SL, ML leave types
- Updates leave taken automatically

### Export & Reporting
- CSV export of leave balances
- Monthly and yearly views
- Employee-specific summaries

## 🚨 Troubleshooting

### Common Issues

**1. "No leave balances found"**
- Run the initialization script: `npm run init-leave`
- Check if employees exist and are marked as 'active'

**2. "Sync not working"**
- Ensure monthly attendance data exists
- Verify attendance data contains CL/PL entries
- Check employee ID matching between systems

**3. "Database errors"**
- Verify migration was successful
- Check Supabase connection
- Review database logs

### Debug Commands

```bash
# Check if tables exist
npm run init-leave

# Verify database connection
# Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

## 📅 Monthly Workflow

### 1. Upload Attendance Data
- Go to Monthly Attendance section
- Upload your attendance Excel file
- System processes CL/PL entries

### 2. Sync Leave Data
- Navigate to Leave Management
- Click "Sync from Attendance"
- Review updated leave balances

### 3. Adjust if Needed
- Edit individual employee balances
- Document any manual changes
- Export data for reporting

## 🔄 Year-end Process

At the end of each year, the system automatically:
- Takes December closing balance
- Sets it as January opening balance for new year
- Creates leave balance records for all months

**Manual trigger (if needed):**
```typescript
import { handleYearEndRollover } from '@/lib/leaveUtils';
await handleYearEndRollover(2024, 2025);
```

## 📞 Support

- **Documentation**: See `LEAVE_MANAGEMENT_SYSTEM.md` for detailed information
- **Code**: Check `src/components/LeaveManagement.tsx` for component logic
- **Utilities**: Review `src/lib/leaveUtils.ts` for helper functions

## ✨ You're All Set!

After completing these steps, you'll have a fully functional Leave Management system that:
- Tracks employee leave balances automatically
- Integrates with your attendance system
- Provides comprehensive reporting
- Handles year-end rollovers seamlessly

The system is designed to work with your existing HR Portal infrastructure and follows the same design patterns and styling conventions.
