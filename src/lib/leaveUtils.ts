import { supabase } from './supabaseClient';

export interface LeaveBalance {
  id: string;
  employee_id: string;
  year: number;
  month: number;
  pl_opening_balance: number;
  cl_opening_balance: number;
  pl_taken: number;
  cl_closing_balance: number;
  cl_taken: number;
  pl_closing_balance: number;
  is_manually_updated: boolean;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  employee_id?: string;
}

/**
 * Create leave balance records for existing employees
 * This function should be called once to initialize leave balances for all existing employees
 */
export const initializeLeaveBalancesForExistingEmployees = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Get all active employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, email, department, position, employee_id')
      .eq('status', 'active');

    if (empError) throw empError;

    if (!employees || employees.length === 0) {
      console.log('No employees found to initialize leave balances for');
      return;
    }

    // Create leave balance records for each employee
    for (const employee of employees) {
      // Create records for current year from current month onwards
      for (let month = currentMonth; month <= 12; month++) {
        await supabase
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
      }

      // Create records for next year
      for (let month = 1; month <= 12; month++) {
        await supabase
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
      }
    }

    console.log(`Successfully initialized leave balances for ${employees.length} employees`);
    return { success: true, employeeCount: employees.length };
  } catch (error) {
    console.error('Error initializing leave balances:', error);
    throw error;
  }
};

/**
 * Handle year-end rollover for leave balances
 * This function should be called at the end of each year
 */
export const handleYearEndRollover = async (fromYear: number, toYear: number) => {
  try {
    // Get all employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, email, department, position, employee_id')
      .eq('status', 'active');

    if (empError) throw empError;

    if (!employees || employees.length === 0) {
      console.log('No employees found for year-end rollover');
      return;
    }

    for (const employee of employees) {
      // Get December closing balance from previous year
      const { data: decemberBalance, error: balanceError } = await supabase
        .from('employee_leave_balances')
        .select('pl_closing_balance, cl_closing_balance')
        .eq('employee_id', employee.id)
        .eq('year', fromYear)
        .eq('month', 12)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error(`Error fetching December balance for employee ${employee.id}:`, balanceError);
        continue;
      }

      // Use December closing balance as January opening balance, or default values
      const plOpeningBalance = decemberBalance?.pl_closing_balance || 25;
      const clOpeningBalance = decemberBalance?.cl_closing_balance || 12;

      // Create January record for new year
      await supabase
        .from('employee_leave_balances')
        .upsert({
          employee_id: employee.id,
          year: toYear,
          month: 1,
          pl_opening_balance: plOpeningBalance,
          cl_opening_balance: clOpeningBalance,
          pl_taken: 0,
          cl_taken: 0,
          pl_closing_balance: plOpeningBalance,
          cl_closing_balance: clOpeningBalance,
          is_manually_updated: false,
        }, {
          onConflict: 'employee_id,year,month'
        });

      // Create remaining months for new year
      for (let month = 2; month <= 12; month++) {
        await supabase
          .from('employee_leave_balances')
          .upsert({
            employee_id: employee.id,
            year: toYear,
            month: month,
            pl_opening_balance: plOpeningBalance,
            cl_opening_balance: clOpeningBalance,
            pl_taken: 0,
            cl_taken: 0,
            pl_closing_balance: plOpeningBalance,
            cl_closing_balance: clOpeningBalance,
            is_manually_updated: false,
          }, {
            onConflict: 'employee_id,year,month'
          });
      }
    }

    console.log(`Successfully completed year-end rollover from ${fromYear} to ${toYear}`);
    return { success: true, employeeCount: employees.length };
  } catch (error) {
    console.error('Error handling year-end rollover:', error);
    throw error;
  }
};

/**
 * Get leave balance summary for an employee
 */
export const getEmployeeLeaveSummary = async (employeeId: string, year: number) => {
  try {
    const { data, error } = await supabase
      .from('employee_leave_balances')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('year', year)
      .order('month');

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching employee leave summary:', error);
    throw error;
  }
};

/**
 * Calculate total leave taken for an employee in a year
 */
export const calculateTotalLeaveTaken = (leaveBalances: LeaveBalance[]) => {
  return leaveBalances.reduce((total, balance) => ({
    pl: total.pl + (balance.pl_taken || 0),
    cl: total.cl + (balance.cl_taken || 0),
  }), { pl: 0, cl: 0 });
};

/**
 * Get available leave balance for an employee
 */
export const getAvailableLeaveBalance = async (employeeId: string, year: number, month: number) => {
  try {
    const { data, error } = await supabase
      .from('employee_leave_balances')
      .select('pl_closing_balance, cl_closing_balance')
      .eq('employee_id', employeeId)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (error) throw error;

    return {
      pl: data?.pl_closing_balance || 0,
      cl: data?.cl_closing_balance || 0,
    };
  } catch (error) {
    console.error('Error fetching available leave balance:', error);
    return { pl: 0, cl: 0 };
  }
};
