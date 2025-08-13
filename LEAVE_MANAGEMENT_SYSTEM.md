# Leave Management System

## Overview

The Leave Management System is a comprehensive solution for tracking employee leave balances, managing leave entitlements, and automating leave calculations based on attendance data. The system integrates with the existing Monthly Attendance system to automatically sync leave taken by employees.

## Features

### 1. Leave Balance Tracking
- **Opening Balance**: Manually set or automatically calculated from previous month/year
- **Leave Taken**: Automatically synced from Monthly Attendance data
- **Closing Balance**: Automatically calculated (Opening Balance - Leave Taken)
- **Manual Override**: HR can manually adjust opening balances when needed

### 2. Leave Types
- **PL (Privilege Leave)**: Default entitlement of 25 days per year
- **CL (Casual Leave)**: Default entitlement of 12 days per year
- **Other Leave Types**: Support for SL (Sick Leave), ML (Maternity Leave), etc.

### 3. Automated Features
- **Year-end Rollover**: December closing balance becomes January opening balance
- **New Employee Setup**: Automatic creation of leave balance records
- **Attendance Integration**: Automatic sync of leave taken from monthly attendance

### 4. User Interface
- **Leave Balances Tab**: View and edit monthly leave balances
- **Leave Records Tab**: View individual leave applications
- **Export Functionality**: Download leave data as CSV
- **Sync Button**: Manually trigger attendance data sync

## Database Structure

### Tables

#### 1. `leave_entitlements`
Stores default leave entitlements for each year
```sql
- id: UUID (Primary Key)
- year: INTEGER (Year)
- pl_days: INTEGER (Default PL entitlement)
- cl_days: INTEGER (Default CL entitlement)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. `employee_leave_balances`
Tracks monthly leave balances for each employee
```sql
- id: UUID (Primary Key)
- employee_id: UUID (References employees.id)
- year: INTEGER (Year)
- month: INTEGER (Month 1-12)
- pl_opening_balance: DECIMAL(5,2)
- cl_opening_balance: DECIMAL(5,2)
- pl_taken: DECIMAL(5,2)
- cl_taken: DECIMAL(5,2)
- pl_closing_balance: DECIMAL(5,2)
- cl_closing_balance: DECIMAL(5,2)
- is_manually_updated: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 3. `leave_records`
Stores individual leave applications
```sql
- id: UUID (Primary Key)
- employee_id: UUID (References employees.id)
- leave_type: VARCHAR(20) (CL, PL, SL, ML, OTHER)
- start_date: DATE
- end_date: DATE
- days_taken: DECIMAL(5,2)
- reason: TEXT
- status: VARCHAR(20) (pending, approved, rejected)
- approved_by: UUID (References employees.id)
- approved_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Triggers and Functions

#### 1. `calculate_leave_closing_balance()`
Automatically calculates closing balance when opening balance or leave taken is updated
- Ensures closing balance never goes below 0
- Updates timestamp automatically

#### 2. `create_employee_leave_balance()`
Automatically creates leave balance records for new employees
- Creates records for current year (remaining months)
- Creates records for next year (all months)
- Sets default entitlements (PL: 25, CL: 12)

## Usage Guide

### 1. Initial Setup

#### Run Database Migration
```bash
# Execute the SQL migration file
supabase/migrations/create_leave_management_tables.sql
```

#### Initialize Leave Balances for Existing Employees
```typescript
import { initializeLeaveBalancesForExistingEmployees } from '@/lib/leaveUtils';

// Call this function once to set up leave balances for all existing employees
await initializeLeaveBalancesForExistingEmployees();
```

### 2. Daily Operations

#### View Leave Balances
1. Navigate to the **Leave** tab in the HR Portal
2. Select the desired year and month
3. View leave balances in the **Leave Balances** tab
4. See opening balances, leave taken, and closing balances

#### Sync Leave Taken from Attendance
1. Upload monthly attendance data in the **Monthly Attendance** section
2. Return to the **Leave** tab
3. Click **"Sync from Attendance"** button
4. System automatically updates leave taken based on CL/PL entries in attendance

#### Edit Leave Balances
1. Click the **Edit** button next to any employee's leave balance
2. Modify PL or CL opening balance
3. Click **"Update Balance"**
4. System automatically recalculates closing balance

#### Export Leave Data
1. Click **"Export"** button
2. Download CSV file with leave balance data
3. File includes all employee leave information for selected month/year

### 3. Year-end Operations

#### Handle Year-end Rollover
```typescript
import { handleYearEndRollover } from '@/lib/leaveUtils';

// Call this function at the end of each year
await handleYearEndRollover(2024, 2025);
```

This function:
- Takes December closing balance from previous year
- Sets it as January opening balance for new year
- Creates leave balance records for all months of new year

## Integration with Monthly Attendance

### How Leave Sync Works

1. **Data Source**: Monthly attendance data stored in `monthly_attendance_records` table
2. **Leave Detection**: System looks for 'CL' and 'PL' entries in attendance data
3. **Automatic Update**: Updates `pl_taken` and `cl_taken` fields in leave balances
4. **Real-time Calculation**: Closing balances automatically recalculated

### Attendance Data Format

The system expects attendance data with these leave types:
- **CL**: Casual Leave
- **PL**: Privilege Leave
- **SL**: Sick Leave
- **ML**: Maternity Leave
- **OTHER**: Other leave types

## Configuration

### Default Leave Entitlements

The system uses these default values:
- **PL (Privilege Leave)**: 25 days per year
- **CL (Casual Leave)**: 12 days per year

### Customizing Entitlements

To modify default entitlements:
1. Update the `leave_entitlements` table
2. Modify the `initializeLeaveBalancesForExistingEmployees` function
3. Update the `create_employee_leave_balance` trigger function

## Best Practices

### 1. Data Consistency
- Always sync attendance data before reviewing leave balances
- Verify leave taken matches attendance records
- Use manual override sparingly and document reasons

### 2. Regular Maintenance
- Run year-end rollover process annually
- Review and clean up old leave records
- Monitor for data inconsistencies

### 3. User Training
- Train HR staff on manual balance adjustments
- Explain the sync process to avoid confusion
- Document any custom leave policies

## Troubleshooting

### Common Issues

#### 1. Leave Balances Not Showing
- Check if employee exists in `employees` table
- Verify employee status is 'active'
- Ensure leave balance records exist for selected year/month

#### 2. Sync Not Working
- Verify monthly attendance data exists
- Check if attendance data contains CL/PL entries
- Ensure employee IDs match between attendance and leave systems

#### 3. Incorrect Calculations
- Check if manual overrides were applied
- Verify attendance data accuracy
- Review trigger functions for errors

### Debug Queries

#### Check Employee Leave Balances
```sql
SELECT * FROM employee_leave_balances 
WHERE employee_id = 'employee-uuid' 
ORDER BY year, month;
```

#### Verify Attendance Data
```sql
SELECT * FROM monthly_attendance_records 
WHERE month = 'Dec-24' 
AND employee_details @> '[{"employeeId": "employee-uuid"}]';
```

#### Check Leave Records
```sql
SELECT * FROM leave_records 
WHERE employee_id = 'employee-uuid' 
AND start_date >= '2024-12-01' 
AND end_date <= '2024-12-31';
```

## Future Enhancements

### Planned Features
1. **Leave Application Workflow**: Employee leave requests and approvals
2. **Leave Calendar**: Visual calendar view of leave patterns
3. **Leave Reports**: Advanced reporting and analytics
4. **Email Notifications**: Automated leave balance alerts
5. **Mobile App**: Leave management on mobile devices

### Integration Opportunities
1. **Payroll System**: Automatic leave encashment calculations
2. **HRIS**: Integration with external HR systems
3. **Biometric Systems**: Direct attendance data import
4. **Calendar Systems**: Sync with Google Calendar, Outlook

## Support

For technical support or questions about the Leave Management System:
1. Check this documentation
2. Review database logs for errors
3. Contact the development team
4. Submit issues through the project repository
