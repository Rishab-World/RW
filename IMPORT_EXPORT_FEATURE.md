# Employee Import/Export Feature

## Overview

The Employee Management section now includes a comprehensive import/export feature that allows users to:

1. **Export Template**: Download a standardized Excel template for employee data
2. **Export Data**: Export current employee data to Excel
3. **Import Data**: Upload Excel files to bulk import employees with validation

## Features

### 1. Export Template
- **Button**: Green "Template" button with download icon
- **Function**: Downloads an Excel file with sample data and correct column headers
- **Use Case**: Users can fill this template with their employee data

### 2. Export Current Data
- **Button**: Amber "Export" button with download icon
- **Function**: Exports all filtered employee data to Excel
- **Use Case**: Backup current employee data or share with stakeholders

### 3. Import Data
- **Button**: Blue "Import" button with upload icon
- **Function**: Upload Excel files to bulk import employees
- **Features**:
  - Real-time validation
  - Error reporting
  - Data preview
  - Import summary

## Required Excel Columns

The import template must include these columns (case-sensitive):

| Column Name | Required | Type | Description |
|-------------|----------|------|-------------|
| `name` | **Yes** | Text | Employee full name |
| `email` | No | Email | Valid email address (if provided) |
| `phone` | No | Text | Phone number |
| `department` | No | Text | Department name |
| `position` | No | Text | Job title/position |
| `join_date` | No | Date | Join date (YYYY-MM-DD format) |
| `status` | No | Text | Employee status (default: 'active') |
| `reporting_manager` | No | Text | Manager's name |
| `employee_id` | No | Text | Employee ID |
| `salary` | No | Number | Annual salary |
| `cost_to_hire` | No | Number | Recruitment cost |
| `probation_status` | No | Text | 'ongoing' or 'completed' |
| `source` | No | Text | Recruitment source |

## Validation Rules

### Required Fields
- **Name**: Must not be empty (only required field)

### Optional Fields
- **Email**: If provided, must be valid email format and unique
- **Department**: Optional
- **Position**: Optional

### Email Validation (Only if provided)
- Must be valid email format (user@domain.com)
- Must be unique (not already in database)
- Must be unique within the import file
- Case-insensitive comparison

### Date Validation
- Join date can be in YYYY-MM-DD format OR Excel date serial numbers
- Excel date serial numbers (like 45300) are automatically converted to proper dates
- Invalid dates will be rejected
- Future dates are not allowed

### Number Validation
- Salary must be a valid number
- Cost to hire must be a valid number

### Duplicate Prevention
- Email addresses must be unique
- System checks against existing database records
- System checks for duplicates within the import file

## How to Use

### Step 1: Download Template
1. Click the green "Template" button
2. Save the downloaded Excel file
3. Open the file in Excel or Google Sheets

### Step 2: Fill Template
1. Replace the sample data with actual employee information
2. Ensure all required fields are filled
3. Follow the validation rules above
4. Save the file

### Step 3: Import Data
1. Click the blue "Import" button
2. Click "Upload Excel File" and select your file
3. Review the validation results
4. If there are errors, fix them in your Excel file and re-upload
5. If no errors, click "Import Employees"

## Error Handling

### Common Validation Errors

1. **"Name is required"**
   - Solution: Fill in the name field

2. **"Invalid email format"**
   - Solution: Use proper email format (user@domain.com)

3. **"Email already exists in database"**
   - Solution: Use a different email or update existing employee

4. **"Duplicate email within import file"**
   - Solution: Remove duplicate email addresses

5. **"Invalid join date format"**
   - Solution: Use YYYY-MM-DD format (e.g., 2024-01-15) or Excel date serial numbers

6. **"Salary must be a valid number"**
   - Solution: Enter only numbers (no currency symbols or commas)

### Import Process

1. **File Upload**: System reads the Excel file
2. **Validation**: Each row is validated against rules
3. **Error Reporting**: All errors are displayed with row numbers
4. **Preview**: First 5 rows are shown for verification
5. **Summary**: Shows total records, valid records, and error count
6. **Import**: Only valid records are imported to database

## Best Practices

### Data Preparation
- Use the provided template
- Double-check email addresses for typos
- Ensure dates are in correct format
- Remove any currency symbols from salary fields
- Use consistent department and position names

### File Management
- Keep file size reasonable (< 10MB)
- Use .xlsx format for best compatibility
- Backup your data before importing
- Test with a small sample first

### Error Resolution
- Fix all errors before importing
- Pay attention to row numbers in error messages
- Check for duplicate email addresses
- Verify date formats

## Technical Details

### Supported File Formats
- Excel (.xlsx) - Recommended
- Excel (.xls) - Legacy format

### File Size Limits
- Maximum file size: 10MB
- Recommended: < 1MB for optimal performance

### Database Operations
- Bulk insert for valid records
- Transaction-based import
- Automatic refresh of employee list
- Real-time validation against existing data

### Security Features
- File type validation
- Data sanitization
- SQL injection prevention
- Error message sanitization

## Troubleshooting

### Import Fails
1. Check file format (.xlsx or .xls)
2. Verify file size (< 10MB)
3. Ensure all required fields are filled
4. Check for duplicate email addresses
5. Verify date formats

### Validation Errors
1. Review error messages carefully
2. Note the row numbers for each error
3. Fix errors in Excel file
4. Re-upload the corrected file

### Performance Issues
1. Reduce file size
2. Split large imports into smaller files
3. Close other applications
4. Check internet connection

## Support

If you encounter issues:
1. Check this documentation first
2. Verify your Excel file format
3. Review validation error messages
4. Contact system administrator if problems persist

## Updates and Changes

This feature is actively maintained and may receive updates for:
- Additional validation rules
- New import fields
- Performance improvements
- Enhanced error reporting 