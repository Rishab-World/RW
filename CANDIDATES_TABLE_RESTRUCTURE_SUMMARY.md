# Candidates Table Restructure Summary

## Overview
The candidates table has been restructured according to the new requirements with the following headers:
- name (required)
- email (optional)
- phone (optional)
- position (optional)
- department (optional)
- source (optional)
- experience (optional)
- cu_monthly_yearly (optional)
- current_salary (optional)
- ex_monthly_yearly (optional)
- expected_salary (optional)
- remark (optional)
- notice_period (optional)
- interview_status (optional)
- applied_date (optional)

## Key Changes Made

### 1. Database Migration
- **File**: `supabase/migrations/restructure_candidates_table.sql`
- **Changes**:
  - Dropped existing candidates table
  - Created new table with updated structure
  - Only `name` field is NOT NULL
  - All other fields are optional
  - Added separate fields for current and expected salary types (`cu_monthly_yearly`, `ex_monthly_yearly`)
  - Added proper indexes and RLS policies

### 2. Frontend Interface Updates
- **File**: `src/components/CandidateManagement.tsx`
- **Changes**:
  - Updated Candidate interface to match new structure
  - Added legacy field support for backward compatibility
  - Updated table headers to match new structure
  - Updated table body to display new fields
  - Updated form validation (only name is required)
  - Updated import/export functionality
  - Added salary formatting in K/Lac format

### 3. Salary Formatting
- **File**: `src/lib/utils.ts`
- **Changes**:
  - Added `formatSalary()` function
  - Converts amounts to K format (e.g., 23K for 23000)
  - Converts amounts to Lac format (e.g., 2.3 Lac for 230000)

### 4. Data Processing Updates
- **File**: `src/pages/Index.tsx`
- **Changes**:
  - Updated candidate fetching and mapping
  - Updated candidate creation and update functions
  - Added support for new field names

### 5. Form Updates
- **Changes**:
  - Removed required validation from all fields except name
  - Updated form labels to remove asterisks (*)
  - Updated form submission logic to handle optional fields

### 6. Import/Export Updates
- **Changes**:
  - Updated import template to match new structure
  - Updated import validation for new fields
  - Updated export functionality
  - Added support for new field names in CSV/Excel processing

## New Table Structure

### Headers (in order):
1. **Name** - Required field
2. **Email** - Optional
3. **Phone** - Optional
4. **Position** - Optional
5. **Department** - Optional
6. **Source** - Optional
7. **Experience** - Optional
8. **CU Monthly/Yearly** - Optional (current salary type)
9. **Current Salary** - Optional (formatted as K/Lac)
10. **EX Monthly/Yearly** - Optional (expected salary type)
11. **Expected Salary** - Optional (formatted as K/Lac)
12. **Remark** - Optional
13. **Notice Period** - Optional
14. **Interview Status** - Optional
15. **Applied Date** - Optional
16. **Actions** - System field

## Salary Formatting
- **Amounts >= 100,000**: Displayed as "X.X Lac" (e.g., 230000 → "2.3 Lac")
- **Amounts >= 1,000**: Displayed as "XK" (e.g., 23000 → "23K")
- **Amounts < 1,000**: Displayed as is

## Migration Instructions

1. **Run the Database Migration**:
   ```sql
   -- Execute the migration file in Supabase SQL Editor
   -- File: supabase/migrations/restructure_candidates_table.sql
   ```

2. **Deploy Frontend Changes**:
   - All frontend changes are ready
   - The application will work with the new structure
   - Legacy field support ensures backward compatibility

3. **Test the Changes**:
   - Add new candidates with only name (other fields optional)
   - Import candidates using the new template
   - Verify salary formatting works correctly
   - Check that all table headers display correctly

## Backward Compatibility
- Legacy field names are supported for existing data
- The system will automatically map old field names to new ones
- Existing functionality should continue to work

## Notes
- The table width has been increased to accommodate the new columns
- All validation has been updated to reflect the new optional field structure
- Import/export templates have been updated to match the new structure
- Salary formatting provides a more user-friendly display of amounts
