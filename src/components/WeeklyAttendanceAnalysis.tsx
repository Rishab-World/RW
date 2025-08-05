import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Calendar } from 'lucide-react';
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

interface WeeklyAttendanceData {
  id?: string;
  week_range: string;
  department: string;
  present: number;
  absent: number;
  late: number;
  early_leaving: number;
  total_employees: number;
  attendance_percentage: number;
  timestamp: string;
  employee_details: WeeklyEmployeeAttendance[];
  leave_types: string[];
}

interface WeeklyEmployeeAttendance {
  employeeId: string;
  employeeName: string;
  attendance: {
    [key: string]: number;
  };
  date_wise_details: {
    [key: string]: string[]; // attendance type -> array of dates
  };
  week_range: string;
}

const WeeklyAttendanceAnalysis: React.FC = () => {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [attendanceData, setAttendanceData] = useState<WeeklyAttendanceData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WeeklyAttendanceData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showDateWiseDetails, setShowDateWiseDetails] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<WeeklyEmployeeAttendance | null>(null);
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
      const sheet = workbook.Sheets['WeeklyAttenReportNew'] || workbook.Sheets['MonthlyAttenReportNew'];
      if (!sheet) throw new Error('Sheet WeeklyAttenReportNew or MonthlyAttenReportNew not found');
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
      let i = 3;
      const employees: WeeklyEmployeeAttendance[] = [];
      let allLeaveTypes = new Set<string>();
      let allDates: Date[] = [];
      while (i < rows.length) {
        const rowArr = rows[i] as any[];
        if (!rowArr || rowArr.every(cell => !cell)) { i++; continue; }
        const empHeader = rowArr;
        let empId = empHeader[0];
        let empName = empHeader[1];
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
        // Find week range (min/max date)
        let minDate: Date | null = null;
        let maxDate: Date | null = null;
        for (const row of empRows) {
          const dateVal = row[0];
          if (dateVal && !isNaN(Date.parse(dateVal))) {
            const d = new Date(dateVal);
            allDates.push(d);
            if (!minDate || d < minDate) minDate = d;
            if (!maxDate || d > maxDate) maxDate = d;
          }
        }
        const attendance: { [key: string]: number } = {};
        const dateWiseDetails: { [key: string]: string[] } = {};
        // Helper logic for each row
        let helper: string[] = [];
        for (const row of empRows) {
          const dateVal = row[0];
          if (!dateVal || isNaN(Date.parse(dateVal))) continue;
          const F = row[5] || '';
          const G = row[6] || '';
          const M = row[12] || '';
          // No Punch In/Out logic
          if (F === '' && G !== '') {
            helper.push('No Punch In');
            attendance['No Punch In'] = (attendance['No Punch In'] || 0) + 1;
            if (!dateWiseDetails['No Punch In']) {
              dateWiseDetails['No Punch In'] = [];
            }
            dateWiseDetails['No Punch In'].push(new Date(dateVal).toLocaleDateString());
          } else if (F !== '' && G === '') {
            helper.push('No Punch Out');
            attendance['No Punch Out'] = (attendance['No Punch Out'] || 0) + 1;
            if (!dateWiseDetails['No Punch Out']) {
              dateWiseDetails['No Punch Out'] = [];
            }
            dateWiseDetails['No Punch Out'].push(new Date(dateVal).toLocaleDateString());
          } else if (F === '' && G === '' && M === 'ABS') {
            helper.push('ABS');
            attendance['ABS'] = (attendance['ABS'] || 0) + 1;
            if (!dateWiseDetails['ABS']) {
              dateWiseDetails['ABS'] = [];
            }
            dateWiseDetails['ABS'].push(new Date(dateVal).toLocaleDateString());
          } else if (F === '' && G === '' && M !== '') {
            helper.push(M);
            attendance[M] = (attendance[M] || 0) + 1;
            allLeaveTypes.add(M);
            if (!dateWiseDetails[M]) {
              dateWiseDetails[M] = [];
            }
            dateWiseDetails[M].push(new Date(dateVal).toLocaleDateString());
          } else {
            helper.push('P');
            attendance['P'] = (attendance['P'] || 0) + 1;
            if (!dateWiseDetails['P']) {
              dateWiseDetails['P'] = [];
            }
            dateWiseDetails['P'].push(new Date(dateVal).toLocaleDateString());
          }
        }
        // Ensure all types are present
        attendance['P'] = attendance['P'] || 0;
        attendance['ABS'] = attendance['ABS'] || 0;
        attendance['No Punch In'] = attendance['No Punch In'] || 0;
        attendance['No Punch Out'] = attendance['No Punch Out'] || 0;
        employees.push({
          employeeId: empId,
          employeeName: empName,
          attendance,
          date_wise_details: dateWiseDetails,
          week_range: minDate && maxDate ? `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}` : 'Unknown',
        });
      }
      // Department/week range
      const realEmployees = employees.filter(e => e.employeeId !== 'Date' && e.employeeName !== 'Day');
      const leaveTypes = Array.from(allLeaveTypes);
      let week_range = 'Unknown';
      if (allDates.length > 0) {
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
        week_range = `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
      }
      const fileName = uploadedFile.name.replace(/\.[^/.]+$/, "");
      let department = fileName.split('_')[0] || 'Unknown';
      // Attendance %: average of employee percentages (P/(P+ABS))
      let employeePercentages: number[] = [];
      for (const emp of realEmployees) {
        // Build helper array as in AttendanceAnalysis
        const empRows = [];
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
        week_range,
        department,
        present: realEmployees.reduce((sum, e) => sum + (e.attendance['P'] || 0), 0),
        absent: realEmployees.reduce((sum, e) => sum + (e.attendance['ABS'] || 0), 0),
        late: 0,
        early_leaving: 0,
        total_employees: realEmployees.length,
        attendance_percentage: Number(departmentAttendancePercentage.toFixed(2)),
        timestamp: new Date().toISOString(),
        employee_details: realEmployees,
        leave_types: leaveTypes,
      };
      // Save to Supabase
      const { data: savedData, error } = await supabase
        .from('weekly_attendance_records')
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
        description: "Weekly attendance data has been analyzed and saved.",
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
        .from('weekly_attendance_records')
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

  // Multi-select options for modal
  const getAllTypes = () => {
    if (!selectedRecord) return [];
    return ['P', ...selectedRecord.leave_types, 'ABS', 'No Punch In', 'No Punch Out'];
  };

  // Handler for checkbox change
  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Download Excel for modal details (filtered)
  const handleDownloadExcel = () => {
    if (!selectedRecord || !selectedRecord.employee_details) return;
    const headers = ['Employee ID', 'Employee Name', ...selectedTypes];
    const data = selectedRecord.employee_details.map(emp => [
      emp.employeeId,
      emp.employeeName,
      ...selectedTypes.map(type => emp.attendance[type] || 0)
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly Attendance');
    XLSX.writeFile(wb, `${selectedRecord.department}_${selectedRecord.week_range}_weekly_attendance.xlsx`);
  };

  // Handle clicking on attendance count
  const handleAttendanceCountClick = (employee: WeeklyEmployeeAttendance, attendanceType: string) => {
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
                      <TableHead className="border-r border-slate-200 dark:border-slate-700">Week Range</TableHead>
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
                        <TableCell className="border-r border-slate-200 dark:border-slate-700">{record.week_range}</TableCell>
                        <TableCell className="border-r border-slate-200 dark:border-slate-700">{record.attendance_percentage}%</TableCell>
                        <TableCell className="border-r border-slate-200 dark:border-slate-700">{record.total_employees}</TableCell>
                        <TableCell className="border-r border-slate-200 dark:border-slate-700">{new Date(record.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedRecord(record);
                              setSelectedTypes(getAllTypes());
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
                <div className="text-center text-slate-500 dark:text-slate-400">No weekly attendance data available.</div>
              )}
            </div>
          </div>
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <DialogHeader>
                <div className="flex items-center justify-between mt-2">
                  <DialogTitle className="text-slate-800 dark:text-white">
                    {selectedRecord?.department} - {selectedRecord?.week_range} Weekly Attendance Details
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-1 mb-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-inner border border-amber-100 dark:border-slate-700 overflow-x-auto w-full">
                    <button
                      type="button"
                      className="px-3 py-1 rounded bg-amber-700 text-white text-xs font-semibold shadow hover:bg-amber-800 transition-all mr-2"
                      onClick={() => setSelectedTypes(selectedTypes.length === getAllTypes().length ? [] : getAllTypes())}
                    >
                      {selectedTypes.length === getAllTypes().length ? 'Deselect All' : 'Select All'}
                    </button>
                    {getAllTypes().map(type => (
                      <label key={type} className="inline-flex items-center mr-2 px-2 py-1 bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded shadow-sm hover:bg-amber-50 dark:hover:bg-slate-800 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={() => handleTypeToggle(type)}
                          className="form-checkbox accent-amber-700 mr-1"
                        />
                        <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">{type}</span>
                      </label>
                    ))}
                    <button
                      type="button"
                      className="px-3 py-1 rounded bg-amber-600 text-white text-xs font-semibold shadow hover:bg-amber-700 transition-all mr-2"
                      onClick={handleDownloadExcel}
                    >
                      Download Excel
                    </button>
                  </div>
                </div>
              </DialogHeader>
              <div className="mt-2 bg-white dark:bg-slate-800 rounded-xl shadow p-3 border border-slate-200 dark:border-slate-700">
                {selectedRecord && Array.isArray(selectedRecord.employee_details) && selectedRecord.employee_details.length > 0 ? (
                  <div style={{ maxHeight: '55vh', minHeight: '250px', overflowY: 'auto', minWidth: '900px' }} className="rounded-xl border border-slate-200 dark:border-slate-700 w-full">
                    <Table className="w-full border border-slate-200 dark:border-slate-700 text-sm font-sans">
                      <TableHeader className="sticky top-0 z-50 bg-slate-100 dark:bg-slate-700 shadow border-t border-slate-200 dark:border-slate-600">
                        <TableRow className="border-b border-slate-200 dark:border-slate-700">
                          <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-700 z-50 font-bold text-slate-800 dark:text-slate-200">Employee ID</TableHead>
                          <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-32 bg-slate-100 dark:bg-slate-700 z-50 font-bold text-slate-800 dark:text-slate-200">Employee Name</TableHead>
                          {selectedTypes.map((type, idx, arr) => (
                            <TableHead key={type} className={idx < arr.length - 1 ? "border-r border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200" : "font-bold text-slate-800 dark:text-slate-200"}>{type}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-white dark:bg-slate-800">
                        {selectedRecord.employee_details.map((employee) => (
                          <TableRow key={employee.employeeId} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <TableCell className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-700 z-40 font-medium text-slate-800 dark:text-white">{employee.employeeId}</TableCell>
                            <TableCell className="border-r border-slate-200 dark:border-slate-700 sticky left-32 bg-slate-100 dark:bg-slate-700 z-40 font-medium text-slate-800 dark:text-white">{employee.employeeName}</TableCell>
                            {selectedTypes.map((type, idx, arr) => (
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

export default WeeklyAttendanceAnalysis; 