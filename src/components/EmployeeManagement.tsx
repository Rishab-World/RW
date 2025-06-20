import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building, Calendar, Mail, Phone, Edit, FileText, Users, TrendingUp, Clock, Bell, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import KYCDataForm from './KYCDataForm';
import AttendanceAnalysis from './AttendanceAnalysis';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  joinDate: string;
  status: string;
  reportingManager?: string;
  employeeId?: string;
  salary?: number;
  probationStatus?: 'ongoing' | 'completed';
  availableDays?: number;
  pendingRequests?: number;
  usedDaysThisYear?: number;
  lastReview?: string;
  goalCompletion?: number;
  performanceRating?: string;
  grade?: string;
  source?: string;
}

interface EmployeeManagementProps {
  employees: Employee[];
  refreshEmployees: () => void;
}

// Helper for Indian number formatting
const formatINR = (amount: number | string | undefined) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '-';
  return Number(amount).toLocaleString('en-IN');
};

// Helper to capitalize each word
const toProperCase = (str) => str ? str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : '';

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, refreshEmployees }) => {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    employees.length > 0 ? employees[0] : null
  );
  const [activeTab, setActiveTab] = useState('overview');
  const [modalEmployee, setModalEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    joinDate: '',
    status: 'active',
    reportingManager: '',
    employeeId: '',
    salary: '',
    probationStatus: 'ongoing',
    source: '',
  });
  const [createAgencyName, setCreateAgencyName] = useState('');
  const [createOtherSource, setCreateOtherSource] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editAgencyName, setEditAgencyName] = useState('');
  const [editOtherSource, setEditOtherSource] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('');
  const [filterManager, setFilterManager] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Get unique filter options from employees data
  const departmentOptions = useMemo(() => Array.from(new Set(employees.map(e => e.department).filter(Boolean))), [employees]);
  const designationOptions = useMemo(() => Array.from(new Set(employees.map(e => e.position).filter(Boolean))), [employees]);
  const managerOptions = useMemo(() => Array.from(new Set(employees.map(e => e.reportingManager).filter(Boolean))), [employees]);
  const statusOptions = useMemo(() => Array.from(new Set(employees.map(e => e.status).filter(Boolean))), [employees]);

  // Check for confirmation process (6 months completion)
  useEffect(() => {
    const checkConfirmationProcess = () => {
      const today = new Date();
      employees.forEach(employee => {
        const joinDate = new Date(employee.joinDate);
        const sixMonthsLater = new Date(joinDate);
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        
        // Check if it's the day after 6 months completion
        const dayAfterSixMonths = new Date(sixMonthsLater);
        dayAfterSixMonths.setDate(dayAfterSixMonths.getDate() + 1);
        
        if (today.toDateString() === dayAfterSixMonths.toDateString()) {
          // Send confirmation email to reporting manager
          toast({
            title: "Confirmation Email Sent",
            description: `Probation form has been sent to ${employee.reportingManager} for ${employee.name}`,
          });
        }
      });
    };

    checkConfirmationProcess();
  }, [employees, toast]);

  const activeEmployees = employees.filter(emp => emp.status === 'active');
  const totalEmployees = employees.length;

  // Mock data for the selected employee
  const mockEmployee = selectedEmployee ? {
    ...selectedEmployee,
    employeeId: selectedEmployee.employeeId || 'EMP001',
    salary: selectedEmployee.salary || 75000,
    probationStatus: 'ongoing' as const,
    availableDays: 15,
    pendingRequests: 3,
    usedDaysThisYear: 18,
    lastReview: 'Q4 2023',
    goalCompletion: 85,
    performanceRating: 'N/A'
  } : null;

  // Apply filters
  let filteredEmployees = employees.filter(emp => {
    const matchDate = filterDate ? (emp.joinDate && new Date(emp.joinDate).toISOString().split('T')[0] === filterDate) : true;
    const matchDepartment = filterDepartment ? emp.department === filterDepartment : true;
    const matchDesignation = filterDesignation ? emp.position === filterDesignation : true;
    const matchManager = filterManager ? emp.reportingManager === filterManager : true;
    const matchStatus = filterStatus ? emp.status === filterStatus : true;
    const matchSearch = search ? (
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase())
    ) : true;
    return matchDate && matchDepartment && matchDesignation && matchManager && matchStatus && matchSearch;
  });
  // Sort by joinDate descending (newest first)
  filteredEmployees = filteredEmployees.sort((a, b) => {
    if (!a.joinDate) return 1;
    if (!b.joinDate) return -1;
    return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
  });

  // Context-aware filter options based on filteredEmployees
  const departmentOptionsFiltered = useMemo(() => Array.from(new Set(filteredEmployees.map(e => e.department).filter(Boolean))), [filteredEmployees]);
  const designationOptionsFiltered = useMemo(() => Array.from(new Set(filteredEmployees.map(e => e.position).filter(Boolean))), [filteredEmployees]);
  const managerOptionsFiltered = useMemo(() => Array.from(new Set(filteredEmployees.map(e => e.reportingManager).filter(Boolean))), [filteredEmployees]);
  const statusOptionsFiltered = useMemo(() => Array.from(new Set(filteredEmployees.map(e => e.status).filter(Boolean))), [filteredEmployees]);

  // Export to Excel function
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredEmployees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'employees.xlsx');
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    // Insert into Supabase
    const sourceValue =
      createForm.source === 'recruitment-agency' ? `Recruitment Agency - ${createAgencyName}` :
      createForm.source === 'other' ? `Other - ${createOtherSource}` :
      createForm.source ? toProperCase(createForm.source.replace(/-/g, ' ')) : '';
    const { error } = await supabase
      .from('employees')
      .insert([
        {
          name: createForm.name,
          email: createForm.email,
          phone: createForm.phone,
          department: createForm.department,
          position: createForm.position,
          join_date: createForm.joinDate,
          status: createForm.status,
          reporting_manager: createForm.reportingManager,
          employee_id: createForm.employeeId,
          salary: createForm.salary ? Number(createForm.salary) : null,
          probation_status: createForm.probationStatus,
          source: sourceValue,
        },
      ]);
    if (!error) {
      setIsCreateDialogOpen(false);
      setCreateForm({
        name: '', email: '', phone: '', department: '', position: '', joinDate: '', status: 'active', reportingManager: '', employeeId: '', salary: '', probationStatus: 'ongoing', source: '',
      });
      setCreateAgencyName('');
      setCreateOtherSource('');
      refreshEmployees();
      toast({ title: 'Employee created successfully', variant: 'default' });
    } else {
      toast({ title: 'Error creating employee', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    let sourceType = employee.source;
    let agencyName = '';
    let otherSource = '';
    if (employee.source?.startsWith('Recruitment Agency - ')) {
      sourceType = 'recruitment-agency';
      agencyName = employee.source.replace('Recruitment Agency - ', '');
    } else if (employee.source?.startsWith('Other - ')) {
      sourceType = 'other';
      otherSource = employee.source.replace('Other - ', '');
    }
    setEditForm({ ...employee, sourceType });
    setEditAgencyName(agencyName);
    setEditOtherSource(otherSource);
    setIsEditDialogOpen(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm || !editForm.id) return;
    const {
      id, name, email, phone, department, position, joinDate, status, reportingManager, employeeId, salary, probationStatus, grade,
      availableDays, pendingRequests, usedDaysThisYear, lastReview, goalCompletion, performanceRating, source
    } = editForm;
    const updateSourceValue =
      editForm.sourceType === 'recruitment-agency' ? `Recruitment Agency - ${editAgencyName}` :
      editForm.sourceType === 'other' ? `Other - ${editOtherSource}` :
      editForm.sourceType ? toProperCase(editForm.sourceType.replace(/-/g, ' ')) : '';
    const updateFields = {
      phone,
      department,
      position,
      join_date: joinDate || null,
      status,
      reporting_manager: reportingManager || null,
      employee_id: employeeId || null,
      salary: salary ? Number(salary) : null,
      probation_status: probationStatus || null,
      grade: grade || null,
      available_days: availableDays || null,
      pending_requests: pendingRequests || null,
      used_days_this_year: usedDaysThisYear || null,
      last_review: lastReview || null,
      goal_completion: goalCompletion || null,
      performance_rating: performanceRating || null,
      source: updateSourceValue,
    };
    const { error } = await supabase
      .from('employees')
      .update(updateFields)
      .eq('id', id);
    if (!error) {
      setIsEditDialogOpen(false);
      setEditForm(null);
      setEditAgencyName('');
      setEditOtherSource('');
      refreshEmployees();
      toast({ title: 'Employee updated successfully', variant: 'default' });
    } else {
      toast({ title: 'Error updating employee', description: error.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (isCreateDialogOpen) {
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        joinDate: '',
        status: 'active',
        reportingManager: '',
        employeeId: '',
        salary: '',
        probationStatus: 'ongoing',
        source: '',
      });
      setCreateAgencyName('');
      setCreateOtherSource('');
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (isEditDialogOpen && !editForm) {
      setEditAgencyName('');
      setEditOtherSource('');
    }
  }, [isEditDialogOpen]);

  if (!selectedEmployee || !mockEmployee) {
    return (
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 text-sm mt-1">No employees found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Search bar remains above the table container */}
      <div className="w-full flex flex-wrap gap-2 items-center mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search employees..."
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-[180px] max-w-xs focus:outline-none focus:ring-2 focus:ring-amber-200 text-slate-800 placeholder:text-slate-400 shadow-sm"
          style={{ minWidth: 180 }}
        />
        <button
          onClick={() => {
            setFilterDate('');
            setFilterDepartment('');
            setFilterDesignation('');
            setFilterManager('');
            setFilterStatus('');
          }}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded shadow text-sm font-medium border border-slate-300"
        >
          Clear Filters
        </button>
        <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
          Employees: {filteredEmployees.length}
        </span>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleExport}
            className="px-4 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded shadow text-sm font-medium"
          >
            Export
          </button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            + Create Employee
          </Button>
        </div>
      </div>
      {/* Table container with filters inside */}
      <div className="mt-2">
        <Card>
          <CardContent>
            {/* Filters inside table container, above the table */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-5 gap-3 items-center mb-4 px-1 pt-4">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                placeholder="dd-----yyyy"
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full h-10 focus:outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-slate-400"
              />
              <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm w-full h-10 focus:outline-none focus:ring-2 focus:ring-amber-200">
                <option value="">Department</option>
                {departmentOptionsFiltered.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select value={filterDesignation} onChange={e => setFilterDesignation(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm w-full h-10 focus:outline-none focus:ring-2 focus:ring-amber-200">
                <option value="">Designation</option>
                {designationOptionsFiltered.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select value={filterManager} onChange={e => setFilterManager(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm w-full h-10 focus:outline-none focus:ring-2 focus:ring-amber-200">
                <option value="">Manager</option>
                {managerOptionsFiltered.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm w-full h-10 focus:outline-none focus:ring-2 focus:ring-amber-200">
                <option value="">Status</option>
                {statusOptionsFiltered.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="mt-4 w-full overflow-x-hidden overflow-y-auto max-h-[60vh]">
              <Table className="w-full min-w-full border border-gray-200">
                <TableHeader className="sticky top-0 z-20 bg-white shadow border-t border-gray-200">
                  <TableRow>
                    <TableHead className="sticky top-0 z-20 bg-white w-[100px] border-r border-gray-200">EMP ID</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-white w-[200px] border-r border-gray-200">Name</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-white w-[150px] border-r border-gray-200">Department</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-white w-[150px] border-r border-gray-200">Designation</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-white w-[120px] border-r border-gray-200">Joining Date</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-white w-[120px] border-r border-gray-200">Salary</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-white w-[150px] border-r border-gray-200">Manager</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-white w-[150px] border-r border-gray-200">Application Source</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-white w-[100px] border-r border-gray-200">Status</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-white w-[120px]">All Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="overflow-ellipsis overflow-hidden border-r border-gray-200">{emp.employeeId}</TableCell>
                      <TableCell className="overflow-ellipsis overflow-hidden border-r border-gray-200">{emp.name}</TableCell>
                      <TableCell className="overflow-ellipsis overflow-hidden border-r border-gray-200">{emp.department}</TableCell>
                      <TableCell className="overflow-ellipsis overflow-hidden border-r border-gray-200">{emp.position}</TableCell>
                      <TableCell className="overflow-ellipsis overflow-hidden border-r border-gray-200">{emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="overflow-ellipsis overflow-hidden border-r border-gray-200">{emp.salary ? `₹${formatINR(emp.salary)}` : '-'}</TableCell>
                      <TableCell className="overflow-ellipsis overflow-hidden border-r border-gray-200">{emp.reportingManager}</TableCell>
                      <TableCell className="overflow-ellipsis overflow-hidden border-r border-gray-200">{toProperCase(emp.source)}</TableCell>
                      <TableCell className="overflow-ellipsis overflow-hidden border-r border-gray-200">{emp.status}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                        <button onClick={() => setModalEmployee(emp)} className="p-2 rounded hover:bg-amber-100 transition-colors">
                          <Eye className="w-5 h-5 text-amber-600" />
                        </button>
                          <button onClick={() => handleEditEmployee(emp)} className="p-2 rounded hover:bg-blue-100 transition-colors">
                          <Edit className="w-5 h-5 text-blue-600" />
                        </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Employee Details Modal */}
      <Dialog open={!!modalEmployee} onOpenChange={() => setModalEmployee(null)}>
        <DialogContent className="max-w-5xl w-full max-h-[80vh] overflow-y-auto p-4 bg-gradient-to-br from-slate-50 to-blue-50 border-0 shadow-2xl rounded-xl">
          {modalEmployee && (
            <div className="space-y-4">
              {/* Modal Header */}
              <div className="p-6 border-b border-amber-200 bg-gradient-to-r from-white/80 to-slate-50/80 rounded-t-xl">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h2 className="text-2xl font-semibold text-slate-800">{modalEmployee.name}</h2>
                      <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-xs">
                        {modalEmployee.employeeId}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 border border-blue-200 text-xs">
                        Probation
                      </Badge>
                    </div>
                    <p className="text-lg text-blue-600 font-medium mb-2">{modalEmployee.position} - {modalEmployee.department}</p>
                    <div className="grid grid-cols-4 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium text-xs">Manager:</span>
                        <p className="text-sm">{modalEmployee.reportingManager || 'Sarah Wilson'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-xs">Join Date:</span>
                        <p className="text-sm">{new Date(modalEmployee.joinDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-xs">Email:</span>
                        <p className="text-sm">{modalEmployee.email}</p>
                      </div>
                      <div>
                        <span className="font-medium text-xs">Salary:</span>
                        <p className="text-sm">₹{formatINR(modalEmployee.salary)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          {/* Compact Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7 bg-white border border-amber-200 h-10">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-yellow-100 data-[state=active]:text-amber-800 text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="performance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-yellow-100 data-[state=active]:text-amber-800 text-xs">Performance</TabsTrigger>
                  <TabsTrigger value="leave" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-yellow-100 data-[state=active]:text-amber-800 text-xs">Leave</TabsTrigger>
                  <TabsTrigger value="actions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-yellow-100 data-[state=active]:text-amber-800 text-xs">Actions</TabsTrigger>
                  <TabsTrigger value="kyc" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-yellow-100 data-[state=active]:text-amber-800 text-xs">KYC Data</TabsTrigger>
                  <TabsTrigger value="attendance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-yellow-100 data-[state=active]:text-amber-800 text-xs">Attendance</TabsTrigger>
                  <TabsTrigger value="confirmation" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-yellow-100 data-[state=active]:text-amber-800 text-xs">Confirmation</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Card className="professional-card">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">Employee ID</p>
                            <p className="text-base font-semibold text-gray-900">{modalEmployee.employeeId}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="professional-card">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                        <Building className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">Department</p>
                            <p className="text-base font-semibold text-gray-900">{modalEmployee.department}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="professional-card">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">Join Date</p>
                            <p className="text-base font-semibold text-gray-900">{new Date(modalEmployee.joinDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="professional-card">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">Salary</p>
                            <p className="text-base font-semibold text-gray-900">₹{formatINR(modalEmployee.salary)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="professional-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-400 mb-1">N/A</div>
                    <p className="text-xs text-gray-600">Performance Rating</p>
                  </CardContent>
                </Card>

                <Card className="professional-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">85%</div>
                    <p className="text-xs text-gray-600">Goal Completion</p>
                  </CardContent>
                </Card>

                <Card className="professional-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">Q4 2023</div>
                    <p className="text-xs text-gray-600">Last Review</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex space-x-3">
                <Button size="sm">
                  <Calendar className="w-3 h-3 mr-1" />
                  Schedule Review
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="w-3 h-3 mr-1" />
                  View History
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="leave" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="professional-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">15</div>
                    <p className="text-xs text-gray-600">Available Days</p>
                  </CardContent>
                </Card>

                <Card className="professional-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">3</div>
                    <p className="text-xs text-gray-600">Pending Requests</p>
                  </CardContent>
                </Card>

                <Card className="professional-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">18</div>
                    <p className="text-xs text-gray-600">Used This Year</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex space-x-3">
                <Button size="sm">
                  <FileText className="w-3 h-3 mr-1" />
                  View Requests
                </Button>
                <Button variant="outline" size="sm">
                  <Clock className="w-3 h-3 mr-1" />
                  Leave History
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button className="h-12 px-2 py-1 flex-col text-xs">
                  <Edit className="w-4 h-4 mb-1" />
                  <span>Edit Profile</span>
                </Button>
                    <Button className="h-12 px-2 py-1 flex-col text-xs">
                  <Building className="w-4 h-4 mb-1" />
                  <span>Change Dept</span>
                </Button>
                    <Button className="h-12 px-2 py-1 flex-col text-xs">
                  <TrendingUp className="w-4 h-4 mb-1" />
                  <span>Salary Revision</span>
                </Button>
                    <Button className="h-12 px-2 py-1 flex-col text-xs">
                  <FileText className="w-4 h-4 mb-1" />
                  <span>Generate Report</span>
                </Button>
                    <Button className="h-12 px-2 py-1 flex-col text-xs">
                  <Users className="w-4 h-4 mb-1" />
                  <span>Asset Assignment</span>
                </Button>
                    <Button className="h-12 px-2 py-1 flex-col text-xs">
                  <FileText className="w-4 h-4 mb-1" />
                  <span>Documents</span>
                </Button>
                    <Button className="h-12 px-2 py-1 flex-col text-xs">
                  <Calendar className="w-4 h-4 mb-1" />
                  <span>Training</span>
                </Button>
                    <Button variant="destructive" className="h-12 px-2 py-1 flex-col bg-red-500 hover:bg-red-600 text-xs">
                  <User className="w-4 h-4 mb-1" />
                  <span>Exit Process</span>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="kyc">
              <KYCDataForm />
            </TabsContent>

                <TabsContent value="attendance" className="space-y-2">
              <AttendanceAnalysis />
            </TabsContent>

            <TabsContent value="confirmation" className="space-y-4">
              <Card className="professional-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-amber-800">
                    <Bell className="w-5 h-5" />
                    <span>Confirmation Process</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Automatic Confirmation Process</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      When an employee completes 6 months of service, an email with probation form 
                      will be automatically sent to their reporting manager the next day.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Employee:</span>
                            <p>{modalEmployee.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Join Date:</span>
                            <p>{new Date(modalEmployee.joinDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">6 Months Completion:</span>
                            <p>{new Date(new Date(modalEmployee.joinDate).setMonth(new Date(modalEmployee.joinDate).getMonth() + 6)).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">Reporting Manager:</span>
                            <p>{modalEmployee.reportingManager}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="professional-button">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Confirmation Email Now
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEmployee} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>Name *</label>
                <input className="w-full border rounded p-2" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
              </div>
              <div>
                <label>Email *</label>
                <input className="w-full border rounded p-2" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} required />
              </div>
              <div>
                <label>Phone</label>
                <input className="w-full border rounded p-2" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} />
              </div>
              <div>
                <label>Department</label>
                <input className="w-full border rounded p-2" value={createForm.department} onChange={e => setCreateForm({ ...createForm, department: e.target.value })} />
              </div>
              <div>
                <label>Position</label>
                <input className="w-full border rounded p-2" value={createForm.position} onChange={e => setCreateForm({ ...createForm, position: e.target.value })} />
              </div>
              <div>
                <label>Join Date</label>
                <input type="date" className="w-full border rounded p-2" value={createForm.joinDate} onChange={e => setCreateForm({ ...createForm, joinDate: e.target.value })} />
              </div>
              <div>
                <label>Reporting Manager</label>
                <input className="w-full border rounded p-2" value={createForm.reportingManager} onChange={e => setCreateForm({ ...createForm, reportingManager: e.target.value })} />
              </div>
              <div>
                <label>Employee ID</label>
                <input className="w-full border rounded p-2" value={createForm.employeeId} onChange={e => setCreateForm({ ...createForm, employeeId: e.target.value })} />
              </div>
              <div>
                <label>Salary</label>
                <input type="number" className="w-full border rounded p-2" value={createForm.salary} onChange={e => setCreateForm({ ...createForm, salary: e.target.value })} />
              </div>
              <div>
                <label>Application Source</label>
                <Select
                  value={createForm.source}
                  onValueChange={value => {
                    setCreateForm({ ...createForm, source: value });
                    setCreateAgencyName('');
                    setCreateOtherSource('');
                  }}
                  required
                >
                  <SelectTrigger className="w-full border rounded p-2">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">Employee Referral</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="indeed">Indeed</SelectItem>
                    <SelectItem value="company-website">Company Website</SelectItem>
                    <SelectItem value="recruitment-agency">Recruitment Agency</SelectItem>
                    <SelectItem value="job-fair">Job Fair</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {createForm.source === 'recruitment-agency' && (
                  <input
                    className="w-full border rounded p-2 mt-2"
                    placeholder="Name of Recruitment Agency"
                    value={createAgencyName}
                    onChange={e => setCreateAgencyName(e.target.value)}
                  />
                )}
                {createForm.source === 'other' && (
                  <input
                    className="w-full border rounded p-2 mt-2"
                    placeholder="Please specify"
                    value={createOtherSource}
                    onChange={e => setCreateOtherSource(e.target.value)}
                  />
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} type="button">Cancel</Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label>Name</label>
                  <input className="w-full border rounded p-2 bg-gray-100" value={editForm.name} disabled />
                </div>
                <div>
                  <label>Email</label>
                  <input className="w-full border rounded p-2 bg-gray-100" value={editForm.email} disabled />
                </div>
                <div>
                  <label>Phone</label>
                  <input className="w-full border rounded p-2" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div>
                  <label>Department</label>
                  <input className="w-full border rounded p-2" value={editForm.department || ''} onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
                </div>
                <div>
                  <label>Position</label>
                  <input className="w-full border rounded p-2" value={editForm.position || ''} onChange={e => setEditForm({ ...editForm, position: e.target.value })} />
                </div>
                <div>
                  <label>Join Date</label>
                  <input type="date" className="w-full border rounded p-2" value={editForm.joinDate || ''} onChange={e => setEditForm({ ...editForm, joinDate: e.target.value })} />
                </div>
                <div>
                  <label>Reporting Manager</label>
                  <input className="w-full border rounded p-2" value={editForm.reportingManager || ''} onChange={e => setEditForm({ ...editForm, reportingManager: e.target.value })} />
                </div>
                <div>
                  <label>Employee ID</label>
                  <input className="w-full border rounded p-2" value={editForm.employeeId || ''} onChange={e => setEditForm({ ...editForm, employeeId: e.target.value })} />
                </div>
                <div>
                  <label>Salary</label>
                  <input type="number" className="w-full border rounded p-2" value={editForm.salary || ''} onChange={e => setEditForm({ ...editForm, salary: e.target.value })} />
                </div>
                <div>
                  <label>Application Source</label>
                  <Select
                    value={editForm?.sourceType || ''}
                    onValueChange={value => {
                      setEditForm({ ...editForm, sourceType: value });
                      setEditAgencyName('');
                      setEditOtherSource('');
                    }}
                    required
                  >
                    <SelectTrigger className="w-full border rounded p-2">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="referral">Employee Referral</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="indeed">Indeed</SelectItem>
                      <SelectItem value="company-website">Company Website</SelectItem>
                      <SelectItem value="recruitment-agency">Recruitment Agency</SelectItem>
                      <SelectItem value="job-fair">Job Fair</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {editForm?.sourceType === 'recruitment-agency' && (
                    <input
                      className="w-full border rounded p-2 mt-2"
                      placeholder="Name of Recruitment Agency"
                      value={editAgencyName}
                      onChange={e => setEditAgencyName(e.target.value)}
                    />
                  )}
                  {editForm?.sourceType === 'other' && (
                    <input
                      className="w-full border rounded p-2 mt-2"
                      placeholder="Please specify"
                      value={editOtherSource}
                      onChange={e => setEditOtherSource(e.target.value)}
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} type="button">Cancel</Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeManagement;
