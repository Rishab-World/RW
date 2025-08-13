import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Edit, RefreshCw, Download, Upload, Plus, Eye, TrendingUp, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  employee_id?: string;
}

interface LeaveBalance {
  id: string;
  employee_id: string;
  year: number;
  month: number;
  pl_opening_balance: number;
  cl_opening_balance: number;
  pl_taken: number;
  cl_taken: number;
  pl_closing_balance: number;
  cl_closing_balance: number;
  is_manually_updated: boolean;
  employee_name?: string;
}

interface LeaveRecord {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_taken: number;
  reason?: string;
  status: string;
  employee_name?: string;
}

interface MonthlyAttendanceData {
  month: string;
  employee_details: Array<{
    employeeId: string;
    employeeName: string;
    attendance: { [key: string]: number };
  }>;
}

const LeaveManagement: React.FC = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyAttendanceData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBalance, setEditingBalance] = useState<LeaveBalance | null>(null);
  const [editForm, setEditForm] = useState({
    pl_opening_balance: 0,
    cl_opening_balance: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    fetchEmployees();
    fetchLeaveBalances();
    fetchLeaveRecords();
    fetchMonthlyAttendance();
  }, [selectedYear, selectedMonth]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email, department, position, employee_id')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employees',
        variant: 'destructive',
      });
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      setIsLoading(true);
      console.log(`Fetching leave balances for ${selectedYear}-${selectedMonth}`);
      
      // First, get leave balances for the selected month
      const { data: balanceData, error: balanceError } = await supabase
        .from('employee_leave_balances')
        .select('*')
        .eq('year', selectedYear)
        .eq('month', selectedMonth);

      if (balanceError) {
        console.error('Balance fetch error:', balanceError);
        throw balanceError;
      }

      console.log(`Found ${balanceData?.length || 0} leave balance records`);

      if (!balanceData || balanceData.length === 0) {
        console.log('No leave balances found, setting empty array');
        setLeaveBalances([]);
        return;
      }

      // Get employee names for the leave balances
      const employeeIds = [...new Set(balanceData.map(balance => balance.employee_id))];
      console.log(`Fetching names for ${employeeIds.length} employees`);
      
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('id, name')
        .in('id', employeeIds);

      if (empError) {
        console.error('Employee fetch error:', empError);
        throw empError;
      }

      // Create a map of employee ID to name
      const employeeMap = new Map(employeeData?.map(emp => [emp.id, emp.name]) || []);

      // Combine the data and sort by employee name
      const balancesWithNames = balanceData
        .map(balance => ({
          ...balance,
          employee_name: employeeMap.get(balance.employee_id) || 'Unknown',
        }))
        .sort((a, b) => a.employee_name.localeCompare(b.employee_name));

      console.log(`Setting ${balancesWithNames.length} leave balances with names`);
      setLeaveBalances(balancesWithNames);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave balances',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaveRecords = async () => {
    try {
      console.log(`Fetching leave records for ${selectedYear}-${selectedMonth}`);
      
      // First, get leave records for the selected month
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_records')
        .select('*')
        .gte('start_date', `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`)
        .lte('end_date', `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-31`)
        .order('start_date', { ascending: false });

      if (leaveError) {
        console.error('Leave records fetch error:', leaveError);
        throw leaveError;
      }

      console.log(`Found ${leaveData?.length || 0} leave records`);

      if (!leaveData || leaveData.length === 0) {
        console.log('No leave records found, setting empty array');
        setLeaveRecords([]);
        return;
      }

      // Get employee names for the leave records
      const employeeIds = [...new Set(leaveData.map(record => record.employee_id))];
      console.log(`Fetching names for ${employeeIds.length} employees with leave records`);
      
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('id, name')
        .in('id', employeeIds);

      if (empError) {
        console.error('Employee fetch error for leave records:', empError);
        throw empError;
      }

      // Create a map of employee ID to name
      const employeeMap = new Map(employeeData?.map(emp => [emp.id, emp.name]) || []);

      // Combine the data
      const recordsWithNames = leaveData.map(record => ({
        ...record,
        employee_name: employeeMap.get(record.employee_id) || 'Unknown',
      }));

      console.log(`Setting ${recordsWithNames.length} leave records with names`);
      setLeaveRecords(recordsWithNames);
    } catch (error) {
      console.error('Error fetching leave records:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave records',
        variant: 'destructive',
      });
    }
  };

  const fetchMonthlyAttendance = async () => {
    try {
      const monthYear = `${months[selectedMonth - 1].label}-${selectedYear.toString().slice(-2)}`;
      const { data, error } = await supabase
        .from('monthly_attendance_records')
        .select('*')
        .eq('month', monthYear);

      if (error) throw error;
      setMonthlyAttendance(data || []);
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
    }
  };

  const updateLeaveBalance = async () => {
    if (!editingBalance) return;

    try {
      const { error } = await supabase
        .from('employee_leave_balances')
        .update({
          pl_opening_balance: editForm.pl_opening_balance,
          cl_opening_balance: editForm.cl_opening_balance,
          is_manually_updated: true,
        })
        .eq('id', editingBalance.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Leave balance updated successfully',
      });

      setIsEditDialogOpen(false);
      setEditingBalance(null);
      fetchLeaveBalances();
    } catch (error) {
      console.error('Error updating leave balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to update leave balance',
        variant: 'destructive',
      });
    }
  };

  const syncLeaveTakenFromAttendance = async () => {
    try {
      setIsLoading(true);
      
      // Get monthly attendance data for the selected month
      const monthYear = `${months[selectedMonth - 1].label}-${selectedYear.toString().slice(-2)}`;
      const attendanceData = monthlyAttendance.find(att => att.month === monthYear);
      
      if (!attendanceData) {
        toast({
          title: 'No Data',
          description: 'No attendance data found for the selected month',
          variant: 'destructive',
        });
        return;
      }

      // Update leave balances based on attendance data
      for (const employeeDetail of attendanceData.employee_details) {
        const clTaken = employeeDetail.attendance['CL'] || 0;
        const plTaken = employeeDetail.attendance['PL'] || 0;

        if (clTaken > 0 || plTaken > 0) {
          // Find existing leave balance record
          const existingBalance = leaveBalances.find(
            balance => balance.employee_id === employeeDetail.employeeId
          );

          if (existingBalance) {
            // Update the leave taken
            await supabase
              .from('employee_leave_balances')
              .update({
                cl_taken: clTaken,
                pl_taken: plTaken,
              })
              .eq('id', existingBalance.id);
          }
        }
      }

      toast({
        title: 'Success',
        description: 'Leave taken synced from attendance data',
      });

      fetchLeaveBalances();
    } catch (error) {
      console.error('Error syncing leave taken:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync leave taken from attendance',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLeaveTakenFromAttendance = (employeeId: string) => {
    const monthYear = `${months[selectedMonth - 1].label}-${selectedYear.toString().slice(-2)}`;
    const attendanceData = monthlyAttendance.find(att => att.month === monthYear);
    
    if (!attendanceData) return { cl: 0, pl: 0 };

    const employeeDetail = attendanceData.employee_details.find(
      emp => emp.employeeId === employeeId
    );

    if (!employeeDetail) return { cl: 0, pl: 0 };

    return {
      cl: employeeDetail.attendance['CL'] || 0,
      pl: employeeDetail.attendance['PL'] || 0,
    };
  };

  const openEditDialog = (balance: LeaveBalance) => {
    setEditingBalance(balance);
    setEditForm({
      pl_opening_balance: balance.pl_opening_balance,
      cl_opening_balance: balance.cl_opening_balance,
    });
    setIsEditDialogOpen(true);
  };

  const exportLeaveData = () => {
    const csvContent = [
      ['Employee Name', 'Month', 'Year', 'PL Opening Balance', 'CL Opening Balance', 'PL Taken', 'CL Taken', 'PL Closing Balance', 'CL Closing Balance'],
      ...leaveBalances.map(balance => [
        balance.employee_name,
        months[selectedMonth - 1].label,
        selectedYear,
        balance.pl_opening_balance,
        balance.cl_opening_balance,
        balance.pl_taken,
        balance.cl_taken,
        balance.pl_closing_balance,
        balance.cl_closing_balance,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_balances_${months[selectedMonth - 1].label}_${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter leave balances based on search query
  const filteredLeaveBalances = leaveBalances.filter(balance =>
    balance.employee_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
                          {/* Filters and Action Buttons */}
         <Card className="dark:bg-slate-800 dark:border-slate-700">
           <CardContent className="p-4">
                           <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="year" className="dark:text-slate-200">Year:</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger className="w-24 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()} className="dark:text-white dark:hover:bg-slate-600">{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="month" className="dark:text-slate-200">Month:</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger className="w-32 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                        {months.map(month => (
                          <SelectItem key={month.value} value={month.value.toString()} className="dark:text-white dark:hover:bg-slate-600">{month.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="search" className="dark:text-slate-200">Search:</Label>
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search employee name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-48 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400 focus:dark:ring-slate-500"
                    />
                  </div>
                </div>
               <div className="flex items-center gap-3">
                 <Button onClick={syncLeaveTakenFromAttendance} disabled={isLoading}>
                   <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                   Sync from Attendance
                 </Button>
                 <Button onClick={exportLeaveData} variant="outline">
                   <Download className="w-4 h-4 mr-2" />
                   Export
                 </Button>
               </div>
             </div>
           </CardContent>
         </Card>

        {/* Main Content */}
                 <Tabs defaultValue="balances" className="space-y-6">
           <TabsList className="grid w-full grid-cols-2 dark:bg-slate-800 dark:border-slate-700">
             <TabsTrigger value="balances" className="dark:data-[state=active]:bg-slate-600 dark:data-[state=active]:text-white dark:text-slate-300">Leave Balances</TabsTrigger>
             <TabsTrigger value="records" className="dark:data-[state=active]:bg-slate-600 dark:data-[state=active]:text-white dark:text-slate-300">Leave Records</TabsTrigger>
           </TabsList>

                                           <TabsContent value="balances" className="space-y-6">
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Calendar className="w-5 h-5" />
                    Leave Balances - {months[selectedMonth - 1].label} {selectedYear}
                  </CardTitle>
                                     {leaveBalances.length === 0 && (
                     <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700 p-3 rounded-md border border-amber-200">
                       <p><strong>No leave balance data found.</strong> This is normal when starting fresh. You can:</p>
                       <ul className="list-disc list-inside mt-1 space-y-1">
                         <li>Run the initialization script to create leave balances for all employees</li>
                         <li>Upload attendance data and use the "Sync from Attendance" button</li>
                         <li>Manually create leave balance records in the database</li>
                       </ul>
                     </div>
                   )}
                   {leaveBalances.length > 0 && filteredLeaveBalances.length === 0 && searchQuery && (
                     <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700 p-3 rounded-md border border-blue-200">
                       <p><strong>No employees found matching "{searchQuery}"</strong></p>
                       <p>Try adjusting your search terms or clearing the search field.</p>
                     </div>
                   )}
                </CardHeader>
                <CardContent>
                <div className="overflow-x-auto">
                                     <Table className="dark:border-slate-700">
                     <TableHeader>
                       <TableRow className="dark:border-slate-700 dark:hover:bg-slate-700/50">
                         <TableHead className="dark:text-slate-200">Employee Name</TableHead>
                         <TableHead className="dark:text-slate-200">PL Opening</TableHead>
                         <TableHead className="dark:text-slate-200">CL Opening</TableHead>
                         <TableHead className="dark:text-slate-200">PL Taken</TableHead>
                         <TableHead className="dark:text-slate-200">CL Taken</TableHead>
                         <TableHead className="dark:text-slate-200">PL Closing</TableHead>
                         <TableHead className="dark:text-slate-200">CL Closing</TableHead>
                         <TableHead className="dark:text-slate-200">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                                         <TableBody>
                                               {filteredLeaveBalances.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                              <div className="space-y-2">
                                {searchQuery ? (
                                  <>
                                    <p className="font-medium">No employees found matching "{searchQuery}"</p>
                                    <p className="text-sm">Try adjusting your search terms or clearing the search field.</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="font-medium">No leave balances found for {months[selectedMonth - 1].label} {selectedYear}</p>
                                    <p className="text-sm">This usually means:</p>
                                    <ul className="text-sm text-left max-w-md mx-auto space-y-1">
                                      <li>• Leave balances haven't been initialized for this month</li>
                                      <li>• No employees exist in the system</li>
                                      <li>• The month/year combination is invalid</li>
                                    </ul>
                                    <p className="text-sm mt-2">
                                      <strong>Tip:</strong> Run the initialization script or check if employees exist in the system.
                                    </p>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredLeaveBalances.map((balance) => {
                             const attendanceLeave = getLeaveTakenFromAttendance(balance.employee_id);
                             return (
                               <TableRow key={balance.id} className="dark:border-slate-700 dark:hover:bg-slate-700/50">
                                 <TableCell className="font-medium dark:text-white">{balance.employee_name}</TableCell>
                                 <TableCell className="dark:text-slate-200">
                                   <span className={balance.is_manually_updated ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}>
                                     {balance.pl_opening_balance}
                                   </span>
                                 </TableCell>
                                 <TableCell className="dark:text-slate-200">
                                   <span className={balance.is_manually_updated ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}>
                                     {balance.cl_opening_balance}
                                   </span>
                                 </TableCell>
                                 <TableCell>
                                   <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                     {attendanceLeave.pl}
                                   </Badge>
                                 </TableCell>
                                 <TableCell>
                                   <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                     {attendanceLeave.cl}
                                   </Badge>
                                 </TableCell>
                                 <TableCell>
                                   <span className="font-semibold text-green-600 dark:text-green-400">
                                     {balance.pl_closing_balance}
                                   </span>
                                 </TableCell>
                                 <TableCell>
                                   <span className="font-semibold text-green-600 dark:text-green-400">
                                     {balance.cl_closing_balance}
                                   </span>
                                 </TableCell>
                                 <TableCell>
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => openEditDialog(balance)}
                                     className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600 dark:hover:text-white"
                                   >
                                     <Edit className="w-4 h-4" />
                                   </Button>
                                 </TableCell>
                               </TableRow>
                             );
                           })
                         )}
                     </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

                     <TabsContent value="records" className="space-y-6">
             <Card className="dark:bg-slate-800 dark:border-slate-700">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2 dark:text-white">
                   <FileText className="w-5 h-5" />
                   Leave Records - {months[selectedMonth - 1].label} {selectedYear}
                 </CardTitle>
               </CardHeader>
               <CardContent>
                                 <div className="overflow-x-auto">
                   <Table className="dark:border-slate-700">
                     <TableHeader>
                       <TableRow className="dark:border-slate-700 dark:hover:bg-slate-700/50">
                         <TableHead className="dark:text-slate-200">Employee Name</TableHead>
                         <TableHead className="dark:text-slate-200">Leave Type</TableHead>
                         <TableHead className="dark:text-slate-200">Start Date</TableHead>
                         <TableHead className="dark:text-slate-200">End Date</TableHead>
                         <TableHead className="dark:text-slate-200">Days</TableHead>
                         <TableHead className="dark:text-slate-200">Status</TableHead>
                         <TableHead className="dark:text-slate-200">Reason</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {leaveRecords.map((record) => (
                         <TableRow key={record.id} className="dark:border-slate-700 dark:hover:bg-slate-700/50">
                           <TableCell className="font-medium dark:text-white">{record.employee_name}</TableCell>
                           <TableCell>
                             <Badge variant={record.leave_type === 'PL' ? 'default' : 'secondary'}>
                               {record.leave_type}
                             </Badge>
                           </TableCell>
                           <TableCell className="dark:text-slate-200">{new Date(record.start_date).toLocaleDateString()}</TableCell>
                           <TableCell className="dark:text-slate-200">{new Date(record.end_date).toLocaleDateString()}</TableCell>
                           <TableCell className="dark:text-slate-200">{record.days_taken}</TableCell>
                           <TableCell>
                             <Badge 
                               variant={
                                 record.status === 'approved' ? 'default' : 
                                 record.status === 'pending' ? 'secondary' : 'destructive'
                               }
                             >
                               {record.status}
                             </Badge>
                           </TableCell>
                           <TableCell className="max-w-xs truncate dark:text-slate-200">{record.reason || '-'}</TableCell>
                         </TableRow>
                       ))}
                       {leaveRecords.length === 0 && (
                         <TableRow className="dark:border-slate-700">
                           <TableCell colSpan={7} className="text-center text-slate-500 dark:text-slate-400 py-8">
                             No leave records found for this month
                           </TableCell>
                         </TableRow>
                       )}
                     </TableBody>
                   </Table>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

             {/* Edit Leave Balance Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
         <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
           <DialogHeader>
             <DialogTitle className="dark:text-white">Edit Leave Balance</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div>
               <Label htmlFor="pl_opening_balance" className="dark:text-slate-200">PL Opening Balance</Label>
               <Input
                 id="pl_opening_balance"
                 type="number"
                 step="0.5"
                 value={editForm.pl_opening_balance}
                 onChange={(e) => setEditForm(prev => ({ ...prev, pl_opening_balance: parseFloat(e.target.value) || 0 }))}
                 className="dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400 focus:dark:ring-slate-500"
               />
             </div>
             <div>
               <Label htmlFor="cl_opening_balance" className="dark:text-slate-200">CL Opening Balance</Label>
               <Input
                 id="cl_opening_balance"
                 type="number"
                 step="0.5"
                 value={editForm.cl_opening_balance}
                 onChange={(e) => setEditForm(prev => ({ ...prev, cl_opening_balance: parseFloat(e.target.value) || 0 }))}
                 className="dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400 focus:dark:ring-slate-500"
               />
             </div>
             <div className="flex justify-end gap-2">
               <Button 
                 variant="outline" 
                 onClick={() => setIsEditDialogOpen(false)}
                 className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600 dark:hover:text-white"
               >
                 Cancel
               </Button>
               <Button 
                 onClick={updateLeaveBalance}
                 className="dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500"
               >
                 Update Balance
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
    </div>
  );
};

export default LeaveManagement;
