import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Upload, 
  Mail, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  UserX, 
  Eye,
  Send,
  FileText,
  Calendar,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { sendAttendanceNotification } from '@/lib/emailService';
import * as XLSX from 'xlsx';

interface AttendanceKPI {
  employeeId: string;
  employeeName: string;
  kpis: {
    [key: string]: {
      count: number;
      dates: string[];
    };
  };
  hasNonPresentKPI: boolean;
}

interface EmailTemplate {
  senderEmail: string;
  subject: string;
  body: string;
}

const EarlyMonthAttendance: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [processedData, setProcessedData] = useState<AttendanceKPI[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<AttendanceKPI | null>(null);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({
    senderEmail: 'hrrworldpl@gmail.com',
    subject: 'Attendance Alert - Early Month Review',
    body: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    // Set default email body
    setEmailTemplate(prev => ({
      ...prev,
      body: `Dear Employee,

This email is to bring to your attention the attendance irregularities identified during our early month review (1st to 10th of the month).

Please review the details below and take necessary action to regularize your attendance.

If you do not take any action, this will be considered as Leave Without Pay.

Best regards,
HR Team`
    }));
  }, []);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setProcessedData([]);
  };

  const processAttendanceFile = async () => {
    if (!uploadedFile) return;

    try {
      setIsProcessing(true);
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Try to find the attendance sheet
      const sheetNames = workbook.SheetNames;
      const attendanceSheet = sheetNames.find(name => 
        name.toLowerCase().includes('attendance') || 
        name.toLowerCase().includes('report')
      );

      if (!attendanceSheet) {
        throw new Error('No attendance sheet found. Please ensure your Excel file contains an attendance sheet.');
      }

      const sheet = workbook.Sheets[attendanceSheet];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

      if (rows.length < 4) {
        throw new Error('Invalid file format. File should contain attendance data starting from row 4.');
      }

      const processedEmployees: AttendanceKPI[] = [];
      const allLeaveTypes = new Set<string>();

      // Process data starting from row 4 (index 3)
      let i = 3;
      while (i < rows.length) {
        const row = rows[i];
        if (!row || row.length === 0) {
          i++;
          continue;
        }

        const empId = row[1];
        const empName = row[2];

        // Skip if no employee ID or name
        if (!empId || !empName || empId === 'Date' || empName === 'Day') {
          i++;
          continue;
        }

        // Collect all rows for this employee
        const empRows: any[] = [];
        while (i < rows.length && (rows[i][1] === empId || !rows[i][1])) {
          empRows.push(rows[i]);
          i++;
        }

        // Process attendance for this employee
        const attendance: { [key: string]: { count: number; dates: string[] } } = {};
        
        for (const empRow of empRows) {
          const dateVal = empRow[0];
          if (!dateVal || isNaN(Date.parse(dateVal))) continue;

          const punchIn = empRow[5] || '';
          const punchOut = empRow[6] || '';
          const status = empRow[12] || '';

          let kpi = '';
          
          // Determine KPI based on punch data and status
          if (punchIn === '' && punchOut !== '') {
            kpi = 'No Punch In';
          } else if (punchIn !== '' && punchOut === '') {
            kpi = 'No Punch Out';
          } else if (punchIn === '' && punchOut === '' && status === 'ABS') {
            kpi = 'ABS';
          } else if (punchIn === '' && punchOut === '' && status !== '') {
            kpi = status;
            allLeaveTypes.add(status);
          } else {
            kpi = 'P'; // Present
          }

          // Initialize KPI tracking if not exists
          if (!attendance[kpi]) {
            attendance[kpi] = { count: 0, dates: [] };
          }

          attendance[kpi].count++;
          attendance[kpi].dates.push(formatDate(dateVal));
        }

        // Check if employee has any non-Present KPIs
        const hasNonPresentKPI = Object.keys(attendance).some(kpi => kpi !== 'P' && attendance[kpi].count > 0);

        processedEmployees.push({
          employeeId: empId,
          employeeName: empName,
          kpis: attendance,
          hasNonPresentKPI
        });
      }

      setProcessedData(processedEmployees);
      toast({
        title: "File Processed Successfully",
        description: `Processed ${processedEmployees.length} employees. Found ${processedEmployees.filter(emp => emp.hasNonPresentKPI).length} with attendance issues.`,
      });

    } catch (error: any) {
      toast({
        title: "Error Processing File",
        description: error.message || String(error),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const getKPIStatusColor = (kpi: string) => {
    switch (kpi) {
      case 'P': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ABS': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'No Punch In': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'No Punch Out': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getKPIStatusIcon = (kpi: string) => {
    switch (kpi) {
      case 'P': return <CheckCircle className="w-4 h-4" />;
      case 'ABS': return <UserX className="w-4 h-4" />;
      case 'No Punch In': return <Clock className="w-4 h-4" />;
      case 'No Punch Out': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const sendEmails = async () => {
    try {
      setIsSendingEmails(true);
      
      // Get employees with non-Present KPIs
      const employeesToEmail = processedData.filter(emp => emp.hasNonPresentKPI);
      
      if (employeesToEmail.length === 0) {
        toast({
          title: "No Emails to Send",
          description: "All employees have only Present (P) KPIs.",
        });
        return;
      }

      // Fetch email addresses from mail_master
      const employeeIds = employeesToEmail.map(emp => emp.employeeId);
      const { data: mailMasterData, error: mailError } = await supabase
        .from('mail_master')
        .select('employee_id, employee_name, company_email, personal_email')
        .in('employee_id', employeeIds);

      if (mailError) throw mailError;

      // Send emails using the email service
      const emailResults = [];
      for (const employee of employeesToEmail) {
        const mailMasterRecord = mailMasterData?.find(record => record.employee_id === employee.employeeId);
        
        if (!mailMasterRecord) {
          emailResults.push({
            employee: employee.employeeName,
            status: 'No email found',
            emails: []
          });
          continue;
        }

        try {
          // Send attendance notification emails
          const results = await sendAttendanceNotification(
            mailMasterRecord,
            employee.kpis,
            emailTemplate.senderEmail
          );
          
          emailResults.push({
            employee: employee.employeeName,
            status: 'Email sent',
            emails: results,
            results: results
          });
        } catch (error: any) {
          emailResults.push({
            employee: employee.employeeName,
            status: 'Error sending email',
            emails: [],
            error: error.message
          });
        }
      }

      // Show results summary
      const successfulEmails = emailResults.filter(r => r.status === 'Email sent').length;
      const failedEmails = emailResults.filter(r => r.status === 'Error sending email').length;
      const noEmailFound = emailResults.filter(r => r.status === 'No email found').length;

      let description = `Successfully sent ${successfulEmails} emails.`;
      if (failedEmails > 0) description += ` ${failedEmails} failed.`;
      if (noEmailFound > 0) description += ` ${noEmailFound} employees have no email addresses.`;

      toast({
        title: "Email Sending Complete",
        description: description,
        variant: successfulEmails > 0 ? "default" : "destructive"
      });

      // Log detailed results for debugging
      console.log('Email sending results:', emailResults);

    } catch (error: any) {
      toast({
        title: "Error Sending Emails",
        description: error.message || String(error),
        variant: "destructive",
      });
    } finally {
      setIsSendingEmails(false);
    }
  };

  const generateEmailBody = (employee: AttendanceKPI) => {
    let body = emailTemplate.body.replace('Dear Employee,', `Dear ${employee.employeeName},`);
    
    // Add attendance details table
    body += '\n\nAttendance Details:\n';
    body += 'Employee Name: ' + employee.employeeName + '\n';
    body += 'Employee ID: ' + employee.employeeId + '\n\n';
    
    body += 'KPI Summary:\n';
    Object.entries(employee.kpis).forEach(([kpi, data]) => {
      if (kpi !== 'P') { // Only show non-Present KPIs
        body += `- ${kpi}: ${data.count} occurrence(s) on ${data.dates.join(', ')}\n`;
      }
    });
    
    body += '\nIf you do not take any action, this will be considered as Leave Without Pay.';
    
    return body;
  };

  const employeesWithIssues = processedData.filter(emp => emp.hasNonPresentKPI);

  return (
    <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Early Month Attendance</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Process attendance files for 1st-10th of month and send email notifications
          </p>
        </div>

        {/* File Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Attendance File (1st-10th)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="attendance-file">Select Excel File</Label>
                <Input
                  id="attendance-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                  className="mt-1"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Upload attendance Excel file covering dates from 1st to 10th of the month
                </p>
              </div>
              
              {uploadedFile && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">{uploadedFile.name}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={processAttendanceFile}
                  disabled={!uploadedFile || isProcessing}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Process File
                    </>
                  )}
                </Button>
                
                {processedData.length > 0 && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Results
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {processedData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Processing Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">
                    {processedData.length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Employees</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {processedData.filter(emp => !emp.hasNonPresentKPI).length}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">No Issues</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                    {employeesWithIssues.length}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">With Issues</div>
                </div>
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                    {emailTemplate.senderEmail}
                  </div>
                  <div className="text-sm text-amber-600 dark:text-amber-400">Sender Email</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Configuration */}
        {employeesWithIssues.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sender-email">Sender Email</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    value={emailTemplate.senderEmail}
                    onChange={(e) => setEmailTemplate(prev => ({ ...prev, senderEmail: e.target.value }))}
                    placeholder="hrrworldpl@gmail.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email-subject">Email Subject</Label>
                  <Input
                    id="email-subject"
                    value={emailTemplate.subject}
                    onChange={(e) => setEmailTemplate(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Attendance Alert - Early Month Review"
                  />
                </div>

                <div>
                  <Label htmlFor="email-body">Email Body Template</Label>
                  <textarea
                    id="email-body"
                    value={emailTemplate.body}
                    onChange={(e) => setEmailTemplate(prev => ({ ...prev, body: e.target.value }))}
                    rows={8}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Enter email body template..."
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Use {'{EmployeeName}'} to include the employee's name dynamically
                  </p>
                </div>

                <Button 
                  onClick={sendEmails}
                  disabled={isSendingEmails}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSendingEmails ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Emails...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Emails ({employeesWithIssues.length})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Attendance Processing Results</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>KPIs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedData.map((employee) => (
                      <TableRow key={employee.employeeId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee.employeeName}</div>
                            <div className="text-sm text-slate-500">ID: {employee.employeeId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {Object.entries(employee.kpis).map(([kpi, data]) => (
                              <div key={kpi} className="flex items-center gap-2">
                                <Badge className={getKPIStatusColor(kpi)}>
                                  {getKPIStatusIcon(kpi)}
                                  {kpi}: {data.count}
                                </Badge>
                                {data.dates.length > 0 && (
                                  <span className="text-xs text-slate-500">
                                    ({data.dates.slice(0, 3).join(', ')}{data.dates.length > 3 ? '...' : ''})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {employee.hasNonPresentKPI ? (
                            <Badge variant="destructive">Needs Attention</Badge>
                          ) : (
                            <Badge variant="default">No Issues</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEmployee(employee)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Employee Details Dialog */}
        <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Employee Attendance Details</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedEmployee.employeeName}</h3>
                  <p className="text-slate-600">ID: {selectedEmployee.employeeId}</p>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(selectedEmployee.kpis).map(([kpi, data]) => (
                    <div key={kpi} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getKPIStatusColor(kpi)}>
                          {getKPIStatusIcon(kpi)}
                          {kpi}
                        </Badge>
                        <span className="text-sm text-slate-600">
                          Count: {data.count}
                        </span>
                      </div>
                      {data.dates.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dates:</p>
                          <div className="flex flex-wrap gap-1">
                            {data.dates.map((date, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {date}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EarlyMonthAttendance;
