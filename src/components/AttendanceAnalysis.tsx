import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, BarChart3, TrendingDown, Clock, UserX, Eye, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import FileUpload from './FileUpload';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from '@/lib/supabaseClient';

interface AttendanceData {
  id?: string;
  month: string;
  department: string;
  present: number;
  absent: number;
  late: number;
  early_leaving: number;
  total_employees: number;
  attendance_percentage: number;
  timestamp: string;
  employee_details: EmployeeAttendance[];
  leave_types: string[];
}

interface EmployeeAttendance {
  employeeId: string;
  employeeName: string;
  attendance: {
    [key: string]: number;
  };
  date_wise_details: {
    [key: string]: string[]; // attendance type -> array of dates
  };
  month: string;
}

const AttendanceAnalysis: React.FC = () => {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDateWiseDetails, setShowDateWiseDetails] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeAttendance | null>(null);
  const [selectedAttendanceType, setSelectedAttendanceType] = useState<string>('');

  const handleFileUpload = (file: File | null) => {
    setUploadedFile(file);
  };

  const processAttendanceFile = async () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please upload an Excel file to process attendance data.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets['MonthlyAttenReportNew'];
      if (!sheet) throw new Error('Sheet MonthlyAttenReportNew not found');
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
      
      // Data starts from row 4 (index 3)
      let i = 3;
      const employees: EmployeeAttendance[] = [];
      let allLeaveTypes = new Set<string>();

      while (i < rows.length) {
        const rowArr = rows[i] as any[];
        if (!rowArr || rowArr.every(cell => !cell)) { i++; continue; }
        const empHeader = rowArr;
        let empId = empHeader[0];
        let empName = empHeader[1];
        // If empId contains ' - ', split into ID and Name
        if (typeof empId === 'string' && empId.includes(' - ')) {
          const [id, name] = empId.split(' - ');
          empId = id.trim();
          empName = name ? name.trim() : '';
        }
        if (empId === 'Date' || empName === 'Day') { i++; continue; }
        let empRows: any[][] = [];
        i++;
        while (i < rows.length && Array.isArray(rows[i]) && (rows[i] as any[]).some(cell => cell)) {
          empRows.push(rows[i] as any[]);
          i++;
        }
        // Find the first valid date in column A
        let firstDate = '';
        for (const row of empRows) {
          const dateVal = row[0];
          if (dateVal && !isNaN(Date.parse(dateVal))) {
            const d = new Date(dateVal);
            const monthStr = d.toLocaleString('default', { month: 'short' });
            const yearStr = d.getFullYear().toString().slice(-2);
            firstDate = `${monthStr}-${yearStr}`;
            break;
          }
        }
        const attendance: { [key: string]: number } = {};
        const dateWiseDetails: { [key: string]: string[] } = {};
        let totalDays = 0;
        for (const row of empRows) {
          const dateVal = row[0];
          if (!dateVal || isNaN(Date.parse(dateVal))) continue; // Only count rows with a valid date
          const F = row[5] || '';
          const G = row[6] || '';
          const M = row[12] || '';
          let status = '';
          if (F === '' && G === '' && M === 'ABS') {
            status = 'ABS';
          } else if (F === '' && G === '' && M !== '') {
            status = M;
            allLeaveTypes.add(M);
          } else {
            status = 'P';
          }
          attendance[status] = (attendance[status] || 0) + 1;
          
          // Store date-wise details
          if (!dateWiseDetails[status]) {
            dateWiseDetails[status] = [];
          }
          dateWiseDetails[status].push(new Date(dateVal).toLocaleDateString());
          
          if (status !== '') totalDays++;
        }
        attendance['P'] = attendance['P'] || 0;
        attendance['ABS'] = attendance['ABS'] || 0;
        employees.push({
          employeeId: empId,
          employeeName: empName,
          attendance,
          date_wise_details: dateWiseDetails,
          month: firstDate || 'Unknown'
        });
      }
      // Only use real employees for calculations (filter out any with empId 'Date' or empName 'Day')
      const realEmployees = employees.filter(e => e.employeeId !== 'Date' && e.employeeName !== 'Day');
      const leaveTypes = Array.from(allLeaveTypes);
      // Use the most common month among employees, or 'Unknown' if not found
      let month = 'Unknown';
      if (realEmployees.length > 0) {
        const monthCounts: { [key: string]: number } = {};
        for (const e of realEmployees) {
          if (e.month) monthCounts[e.month] = (monthCounts[e.month] || 0) + 1;
        }
        month = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
      }
      const fileName = uploadedFile.name.replace(/\.[^/.]+$/, "");
      let department = fileName.split('_')[0] || 'Unknown';
      // Calculate department attendance percentage as the average of employee percentages
      let employeePercentages: number[] = [];
      for (const emp of realEmployees) {
        // Build helper array as in Excel
        const empRows = [];
        // Find the employee's rows again
        let found = false;
        for (let j = 3; j < rows.length; j++) {
          const rowArr = rows[j] as any[];
          if (!rowArr || rowArr.every(cell => !cell)) continue;
          let headerId = rowArr[0];
          if (typeof headerId === 'string' && headerId.includes(' - ')) {
            const [id] = headerId.split(' - ');
            if (id.trim() === emp.employeeId) {
              found = true;
              continue;
            }
          }
          if (found) {
            // Stop if next employee starts
            if (typeof rowArr[0] === 'string' && rowArr[0].includes(' - ') && rowArr[0] !== emp.employeeId) break;
            // Only process rows with a valid date
            const dateVal = rowArr[0];
            if (!dateVal || isNaN(Date.parse(dateVal))) continue;
            const F = rowArr[5] || '';
            const G = rowArr[6] || '';
            const M = rowArr[12] || '';
            if (F === '' && G === '' && M === 'ABS') {
              empRows.push('ABS');
            } else {
              empRows.push('P');
            }
          }
        }
        const P = empRows.filter(x => x === 'P').length;
        const ABS = empRows.filter(x => x === 'ABS').length;
        const denom = P + ABS;
        if (denom > 0) {
          employeePercentages.push((P / denom) * 100);
        }
      }
      const departmentAttendancePercentage =
        employeePercentages.length > 0
          ? employeePercentages.reduce((a, b) => a + b, 0) / employeePercentages.length
          : 0;
      const newAttendanceData = {
        month,
        department,
        present: realEmployees.reduce((sum, e) => sum + (e.attendance['P'] || 0), 0),
        absent: realEmployees.reduce((sum, e) => sum + (e.attendance['ABS'] || 0), 0),
        late: 0,
        early_leaving: 0,
        total_employees: realEmployees.length,
        attendance_percentage: Number(departmentAttendancePercentage.toFixed(2)),
        timestamp: new Date().toISOString(),
        employee_details: realEmployees,
        leave_types: leaveTypes
      };

      // Save to Supabase
      const { data: savedData, error } = await supabase
        .from('attendance_records')
        .insert([newAttendanceData])
        .select()
        .single();

      if (error) throw error;

      setAttendanceData(prev => [...prev, {
        ...savedData,
        early_leaving: savedData.early_leaving,
        total_employees: savedData.total_employees,
        attendance_percentage: savedData.attendance_percentage,
        employee_details: savedData.employee_details,
        leave_types: newAttendanceData.leave_types
      }]);
      setUploadedFile(null);
      setIsProcessing(false);
      toast({
        title: "File Processed Successfully",
        description: "Attendance data has been analyzed and saved.",
      });
    } catch (err: any) {
      setIsProcessing(false);
      toast({
        title: "Error Processing File",
        description: err.message || String(err),
        variant: "destructive",
      });
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setAttendanceData(data || []);
    } catch (err: any) {
      toast({
        title: "Error Fetching Data",
        description: err.message || String(err),
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    fetchAttendanceData();
  }, []);

  // Download Excel for modal details
  const handleDownloadExcel = () => {
    if (!selectedRecord || !selectedRecord.employee_details) return;
    const headers = ['Employee ID', 'Employee Name', ...['P', ...(selectedRecord.leave_types || []), 'ABS']];
    const data = selectedRecord.employee_details.map(emp => [
      emp.employeeId,
      emp.employeeName,
      ...['P', ...(selectedRecord.leave_types || []), 'ABS'].map(type => emp.attendance[type] || 0)
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `${selectedRecord.department}_${selectedRecord.month}_attendance.xlsx`);
  };

  // Handle clicking on attendance count
  const handleAttendanceCountClick = (employee: EmployeeAttendance, attendanceType: string) => {
    setSelectedEmployee(employee);
    setSelectedAttendanceType(attendanceType);
    setShowDateWiseDetails(true);
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <CardContent>
          <div className="flex items-center space-x-3 mb-2">
            <FileUpload onFileSelect={handleFileUpload} selectedFile={uploadedFile} />
            <Button 
              onClick={processAttendanceFile}
              disabled={!uploadedFile || isProcessing}
              className="bg-amber-800 hover:bg-amber-900 text-white"
            >
              {isProcessing ? "Processing..." : "Process File"}
            </Button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded shadow p-2 border border-slate-200 dark:border-slate-700">
            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {attendanceData && attendanceData.length > 0 ? (
                <Table className="w-full text-sm border-l border-r border-b border-slate-200 dark:border-slate-700">
                  <TableHeader className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 shadow-sm dark:shadow-slate-900/50 border-t border-slate-200 dark:border-slate-600">
                    <TableRow className="border-b border-slate-200 dark:border-slate-700">
                      <TableHead className="border-r border-slate-200 dark:border-slate-700">Department</TableHead>
                      <TableHead className="border-r border-slate-200 dark:border-slate-700">Month</TableHead>
                      <TableHead className="border-r border-slate-200 dark:border-slate-700">Attendance %</TableHead>
                      <TableHead className="border-r border-slate-200 dark:border-slate-700">Total Employees</TableHead>
                      <TableHead className="border-r border-slate-200 dark:border-slate-700">Timestamp</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white dark:bg-slate-800">
                    {attendanceData.map((record) => (
                      <TableRow key={record.id} className="border-b border-slate-200 dark:border-slate-700">
                        <TableCell className="border-r border-slate-200 dark:border-slate-700">{record.department}</TableCell>
                        <TableCell className="border-r border-slate-200 dark:border-slate-700">{record.month}</TableCell>
                        <TableCell className="border-r border-slate-200 dark:border-slate-700">{record.attendance_percentage}%</TableCell>
                        <TableCell className="border-r border-slate-200 dark:border-slate-700">{record.total_employees}</TableCell>
                        <TableCell className="border-r border-slate-200 dark:border-slate-700">{new Date(record.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-slate-500 dark:text-slate-400">No attendance data available.</div>
              )}
            </div>
          </div>

          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="max-w-4xl max-h-[80vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <DialogHeader>
                <div className="flex items-center justify-between mt-2">
                  <DialogTitle className="text-slate-800 dark:text-white">
                    {selectedRecord?.department} - {selectedRecord?.month} Attendance Details
                  </DialogTitle>
                  <button
                    onClick={handleDownloadExcel}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm shadow ml-4"
                  >
                    Download Excel
                  </button>
                </div>
              </DialogHeader>
              <div className="mt-4 bg-white dark:bg-slate-800 rounded shadow p-2 border border-slate-200 dark:border-slate-700">
                {selectedRecord && Array.isArray(selectedRecord.employee_details) && selectedRecord.employee_details.length > 0 ? (
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <Table className="w-full border border-slate-200 dark:border-slate-700">
                      <TableHeader className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 shadow-sm dark:shadow-slate-900/50 border-t border-slate-200 dark:border-slate-600">
                        <TableRow className="border-b border-slate-200 dark:border-slate-700">
                          <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-700 z-20">Employee ID</TableHead>
                          <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-32 bg-slate-100 dark:bg-slate-700 z-20">Employee Name</TableHead>
                          {['P', ...((selectedRecord.leave_types || [])), 'ABS'].map((type, idx, arr) => (
                            <TableHead key={type} className={idx < arr.length - 1 ? "border-r border-slate-200 dark:border-slate-700" : ""}>{type}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-white dark:bg-slate-800">
                        {selectedRecord.employee_details.map((employee) => (
                          <TableRow key={employee.employeeId} className="border-b border-slate-200 dark:border-slate-700">
                            <TableCell className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-700 z-10 text-slate-900 dark:text-white">{employee.employeeId}</TableCell>
                            <TableCell className="border-r border-slate-200 dark:border-slate-700 sticky left-32 bg-slate-100 dark:bg-slate-700 z-10 text-slate-900 dark:text-white">{employee.employeeName}</TableCell>
                            {['P', ...((selectedRecord.leave_types || [])), 'ABS'].map((type, idx, arr) => (
                              <TableCell 
                                key={type} 
                                className={`${idx < arr.length - 1 ? "border-r border-slate-200 dark:border-slate-700" : ""} cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors`}
                                onClick={() => handleAttendanceCountClick(employee, type)}
                                title={`Click to view date-wise details for ${type}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{employee.attendance[type] || 0}</span>
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 dark:text-slate-400">No employee details available.</div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Date-wise Details Dialog */}
          <Dialog open={showDateWiseDetails} onOpenChange={setShowDateWiseDetails}>
            <DialogContent className="max-w-2xl max-h-[80vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-slate-800 dark:text-white">
                  Date-wise Details - {selectedEmployee?.employeeName} ({selectedAttendanceType})
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 bg-white dark:bg-slate-800 rounded shadow p-2 border border-slate-200 dark:border-slate-700">
                {selectedEmployee && selectedAttendanceType ? (
                  <div>
                    <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <strong>Employee ID:</strong> {selectedEmployee.employeeId}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <strong>Employee Name:</strong> {selectedEmployee.employeeName}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <strong>Attendance Type:</strong> {selectedAttendanceType}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <strong>Total Count:</strong> {selectedEmployee.attendance[selectedAttendanceType] || 0}
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {selectedEmployee.date_wise_details && selectedEmployee.date_wise_details[selectedAttendanceType] ? (
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Dates:</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedEmployee.date_wise_details[selectedAttendanceType].map((date, index) => (
                              <div 
                                key={index} 
                                className="p-2 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-sm"
                              >
                                {date}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-500 dark:text-slate-400">
                          No date-wise details available for {selectedAttendanceType}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 dark:text-slate-400">No details available.</div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceAnalysis;