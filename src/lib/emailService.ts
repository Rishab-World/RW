// Email Service Utility
// This is a placeholder for email functionality that can be integrated with:
// - SendGrid
// - AWS SES
// - Nodemailer
// - Or any other email service

export interface EmailData {
  to: string | string[];
  from: string;
  subject: string;
  body: string;
  employeeName?: string;
  employeeId?: string;
  attendanceDetails?: any;
}

export interface EmailResult {
  success: boolean;
  message: string;
  emailId?: string;
  error?: string;
}

export class EmailService {
  private static instance: EmailService;
  private isConfigured: boolean = false;

  private constructor() {
    // Initialize email service configuration
    this.isConfigured = this.checkConfiguration();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private checkConfiguration(): boolean {
    // Check if email service is properly configured
    // This would check for API keys, SMTP settings, etc.
    return false; // Placeholder - return true when properly configured
  }

  public async sendEmail(emailData: EmailData): Promise<EmailResult> {
    try {
      if (!this.isConfigured) {
        return {
          success: false,
          message: 'Email service not configured',
          error: 'Please configure email service with proper credentials'
        };
      }

      // This is where you would integrate with your actual email service
      // For now, we'll simulate the email sending process
      
      console.log('Sending email:', {
        to: emailData.to,
        from: emailData.from,
        subject: emailData.subject,
        body: emailData.body
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate success
      return {
        success: true,
        message: 'Email sent successfully',
        emailId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  public async sendBulkEmails(emails: EmailData[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
      
      // Add small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  }

  public generateAttendanceEmailBody(employeeName: string, employeeId: string, attendanceDetails: any): string {
    let body = `Dear ${employeeName},\n\n`;
    
    body += `This email is to bring to your attention the attendance irregularities identified during our early month review (1st to 10th of the month).\n\n`;
    
    body += `Please review the details below and take necessary action to regularize your attendance.\n\n`;
    
    body += `Employee Details:\n`;
    body += `- Employee Name: ${employeeName}\n`;
    body += `- Employee ID: ${employeeId}\n\n`;
    
    body += `Attendance Summary:\n`;
    Object.entries(attendanceDetails).forEach(([kpi, data]: [string, any]) => {
      if (kpi !== 'P') { // Only show non-Present KPIs
        body += `- ${kpi}: ${data.count} occurrence(s) on ${data.dates.join(', ')}\n`;
      }
    });
    
    body += `\nIf you do not take any action, this will be considered as Leave Without Pay.\n\n`;
    body += `Best regards,\nHR Team`;
    
    return body;
  }

  public validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public getConfigurationStatus(): boolean {
    return this.isConfigured;
  }

  public async testConnection(): Promise<boolean> {
    try {
      // Test email service connection
      // This would test API keys, SMTP connection, etc.
      return this.isConfigured;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();

// Helper function to send attendance notification emails
export const sendAttendanceNotification = async (
  employeeData: any,
  attendanceDetails: any,
  senderEmail: string
): Promise<EmailResult[]> => {
  const emails: EmailData[] = [];
  
  // Add company email if available
  if (employeeData.company_email) {
    emails.push({
      to: employeeData.company_email,
      from: senderEmail,
      subject: 'Attendance Alert - Early Month Review',
      body: emailService.generateAttendanceEmailBody(
        employeeData.employee_name,
        employeeData.employee_id,
        attendanceDetails
      ),
      employeeName: employeeData.employee_name,
      employeeId: employeeData.employee_id,
      attendanceDetails
    });
  }
  
  // Add personal email if available
  if (employeeData.personal_email) {
    emails.push({
      to: employeeData.personal_email,
      from: senderEmail,
      subject: 'Attendance Alert - Early Month Review',
      body: emailService.generateAttendanceEmailBody(
        employeeData.employee_name,
        employeeData.employee_id,
        attendanceDetails
      ),
      employeeName: employeeData.employee_name,
      employeeId: employeeData.employee_id,
      attendanceDetails
    });
  }
  
  if (emails.length === 0) {
    return [{
      success: false,
      message: 'No email addresses found for employee',
      error: 'Employee has no valid email addresses'
    }];
  }
  
  return await emailService.sendBulkEmails(emails);
};
