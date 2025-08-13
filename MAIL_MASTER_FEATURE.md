# Mail Master & Early Month Attendance Feature

## Overview

This document describes the new Mail Master and Early Month Attendance features integrated into the RW HR Portal. These features provide comprehensive email management and automated attendance notification capabilities.

## Features

### 1. Mail Master

The Mail Master component allows HR users to manage employee contact information with dual email support.

#### Key Features:
- **Dual Email Support**: Each employee can have both company (@rishabworld.com) and personal (@gmail.com) email addresses
- **WhatsApp Integration**: Phone numbers are linked to WhatsApp for easy communication
- **Employee Management**: Add, edit, and manage employee contact information
- **Search & Filter**: Search by name, ID, or email, filter by department
- **Status Management**: Active/Inactive employee status tracking

#### Database Structure:
```sql
CREATE TABLE mail_master (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255), -- @rishabworld.com domain
    personal_email VARCHAR(255), -- @gmail.com or other personal domains
    phone_number VARCHAR(20), -- For WhatsApp linking
    department VARCHAR(100),
    position VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Usage:
1. Navigate to **Mail Master** in the sidebar
2. Click **Add Employee** to create new employee contacts
3. Fill in employee details including both email addresses
4. Use search and filters to find specific employees
5. Click edit icon to modify employee information
6. Click email/phone icons to open communication apps

### 2. Early Month Attendance

The Early Month Attendance component processes attendance files for the 1st-10th of each month and sends automated email notifications.

#### Key Features:
- **File Processing**: Upload Excel attendance files covering 1st-10th of month
- **KPI Extraction**: Automatically extracts attendance KPIs (ABS, No Punch In, No Punch Out, etc.)
- **Smart Filtering**: Only sends emails to employees with non-Present KPIs
- **Email Automation**: Sends personalized emails to both company and personal addresses
- **Template Management**: Customizable email templates with attendance details

#### Supported KPIs:
- **P**: Present (no email sent)
- **ABS**: Absent
- **No Punch In**: Missing punch-in time
- **No Punch Out**: Missing punch-out time
- **Custom Leave Types**: Any other leave types found in the file

#### Email Template:
```
Dear [Employee Name],

This email is to bring to your attention the attendance irregularities identified during our early month review (1st to 10th of the month).

Please review the details below and take necessary action to regularize your attendance.

Employee Details:
- Employee Name: [Name]
- Employee ID: [ID]

Attendance Summary:
- [KPI]: [Count] occurrence(s) on [Dates]

If you do not take any action, this will be considered as Leave Without Pay.

Best regards,
HR Team
```

#### Usage:
1. Navigate to **Early Month Attendance** in the sidebar
2. Upload Excel attendance file (must cover 1st-10th of month)
3. Click **Process File** to analyze attendance data
4. Review processing results and employee KPIs
5. Configure email settings (sender email, subject, body)
6. Click **Send Emails** to send notifications to employees with issues

## Technical Implementation

### Database Migrations

Run the following migration to create the required tables:

```sql
-- Run this in your Supabase SQL Editor
-- File: supabase/migrations/create_mail_master_table.sql
```

### Component Structure

```
src/
├── components/
│   ├── MailMaster.tsx              # Mail Master component
│   └── EarlyMonthAttendance.tsx    # Early Month Attendance component
├── lib/
│   └── emailService.ts             # Email service utility
└── pages/
    └── Index.tsx                   # Updated with new routing
```

### Email Service Integration

The email service is designed to be easily integrated with various email providers:

- **SendGrid**: For high-volume email sending
- **AWS SES**: For cost-effective email delivery
- **Nodemailer**: For SMTP-based email sending
- **Custom APIs**: For company-specific email services

#### Configuration Required:
1. Set up email service credentials
2. Update `emailService.ts` with your provider's API
3. Test email functionality
4. Configure rate limiting and delivery settings

## Setup Instructions

### 1. Database Setup

1. **Run Migration**: Execute the SQL migration in your Supabase project
2. **Verify Tables**: Check that `mail_master` table is created successfully
3. **Test Permissions**: Ensure RLS policies are working correctly

### 2. Component Integration

1. **Import Components**: Components are already imported in the main Index.tsx
2. **Sidebar Navigation**: New menu items are added to the sidebar
3. **Routing**: New routes are configured for the components

### 3. Email Service Configuration

1. **Choose Provider**: Select your preferred email service
2. **API Keys**: Add your email service API keys
3. **Test Connection**: Verify email service is working
4. **Rate Limits**: Configure appropriate sending limits

## Usage Workflow

### Daily Operations

1. **HR User Login**: Access the portal with HR credentials
2. **Mail Master Management**: Add/update employee contact information
3. **Attendance Processing**: Upload and process attendance files
4. **Email Notifications**: Send automated attendance alerts

### Monthly Process (1st-10th)

1. **File Upload**: HR uploads attendance Excel file at 10 AM
2. **Data Processing**: System processes file and extracts KPIs
3. **Issue Identification**: System identifies employees with attendance issues
4. **Email Generation**: Personalized emails are prepared for each employee
5. **Bulk Sending**: Emails are sent to both company and personal addresses
6. **Delivery Tracking**: Monitor email delivery status

## Security & Privacy

### Data Protection
- **RLS Policies**: Row-level security ensures data isolation
- **Email Validation**: Email addresses are validated before sending
- **Audit Trail**: All email activities are logged for compliance

### Access Control
- **HR Only**: Only authenticated HR users can access these features
- **Employee Privacy**: Personal email addresses are protected
- **Department Isolation**: Users can only see their department's data

## Troubleshooting

### Common Issues

1. **File Processing Errors**
   - Ensure Excel file has correct format
   - Check that data starts from row 4
   - Verify sheet names contain "attendance" or "report"

2. **Email Sending Failures**
   - Check email service configuration
   - Verify sender email is valid
   - Check rate limiting settings

3. **Database Connection Issues**
   - Verify Supabase connection
   - Check RLS policies
   - Ensure proper authentication

### Support

For technical support or feature requests:
1. Check the console logs for error details
2. Verify database table structure
3. Test email service configuration
4. Review component integration

## Future Enhancements

### Planned Features
- **Email Templates**: More customizable email templates
- **Delivery Tracking**: Real-time email delivery status
- **Bulk Import**: Import employee contacts from Excel
- **WhatsApp Integration**: Direct WhatsApp message sending
- **SMS Notifications**: Text message notifications
- **Advanced Analytics**: Attendance trend analysis

### Integration Opportunities
- **HRIS Systems**: Connect with existing HR systems
- **Time Tracking**: Integrate with time tracking software
- **Leave Management**: Connect with leave management system
- **Payroll Systems**: Link attendance data to payroll

## Conclusion

The Mail Master and Early Month Attendance features provide a comprehensive solution for employee communication and attendance management. The system automates the tedious process of identifying and notifying employees about attendance issues, while maintaining flexibility for HR users to customize the process according to their needs.

The dual email support ensures that important notifications reach employees through their preferred communication channels, and the WhatsApp integration provides additional communication options for urgent matters.
