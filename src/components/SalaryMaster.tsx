import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Users, Edit, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SalaryData {
  id: string;
  emp_code: string;
  emp_name: string;
  designation: string;
  department: string;
  location: string;
  fix_gross: number;
  doj: string;
  percentage: number;
  created_at: string;
  updated_at: string;
}

interface SalaryMasterProps {
  isManagement?: boolean;
}

const SalaryMaster: React.FC<SalaryMasterProps> = ({ isManagement = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'employee' | 'department'>('employee');
  const [salaryData, setSalaryData] = useState<SalaryData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<SalaryData | null>(null);
  const [filterDesignation, setFilterDesignation] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterDoj, setFilterDoj] = useState('');
  const [formData, setFormData] = useState({
    emp_code: '', 
    emp_name: '', 
    designation: '', 
    department: '', 
    location: '', 
    fix_gross: '', 
    doj: ''
  });
  const { toast } = useToast();

  // Fetch salary data from Supabase
  const fetchSalaryData = async () => {
    try {
      const { data, error } = await supabase
        .from('salary_master')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSalaryData(data || []);
    } catch (err: any) {
      toast({
        title: "Error Fetching Data",
        description: err.message || String(err),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, []);

  // Filtered data for employee view
  const filteredData = salaryData.filter(emp =>
    (emp.emp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.emp_code.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterDesignation === 'all' || emp.designation === filterDesignation) &&
    (filterDepartment === 'all' || emp.department === filterDepartment) &&
    (filterLocation === 'all' || emp.location === filterLocation) &&
    (filterDoj === '' || emp.doj === filterDoj)
  );

  // Unique values for filters
  const designations = [...new Set(salaryData.map(emp => emp.designation))];
  const departments = [...new Set(salaryData.map(emp => emp.department))];
  const locations = [...new Set(salaryData.map(emp => emp.location))];

  // Summary values for employee view
  const totalSalary = filteredData.reduce((sum, emp) => sum + emp.fix_gross, 0);
  const totalEmployees = filteredData.length;
  const avgSalary = totalEmployees ? totalSalary / totalEmployees : 0;
  const totalDepartments = new Set(filteredData.map(emp => emp.department)).size;

  // Group by department for department view
  const departmentData = salaryData.reduce((acc, emp) => {
    const dept = acc[emp.department] || { department: emp.department, total: 0, count: 0, percentage: 0 };
    dept.total += emp.fix_gross;
    dept.count += 1;
    dept.percentage += emp.percentage;
    acc[emp.department] = dept;
    return acc;
  }, {} as Record<string, { department: string; total: number; count: number; percentage: number }>);
  const departmentRows = Object.values(departmentData).map(dept => ({
    ...dept,
    avgPercentage: dept.count ? (dept.percentage / dept.count) : 0
  }));

  // Summary values for department view
  const filteredDepartments = departmentRows.filter(dept =>
    dept.department.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const departmentTotalSalary = filteredDepartments.reduce((sum, dept) => sum + dept.total, 0);
  const departmentTotalEmployees = filteredDepartments.reduce((sum, dept) => sum + dept.count, 0);
  const departmentCount = filteredDepartments.length;
  const avgDepartmentSalary = departmentCount ? departmentTotalSalary / departmentCount : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const exportToExcel = () => {
    const exportData = salaryData.map(emp => ({
      'Employee Code': emp.emp_code,
      'Employee Name': emp.emp_name,
      'Designation': emp.designation,
      'Department': emp.department,
      'Location': emp.location,
      'Fixed Gross': emp.fix_gross,
      'Date of Joining': new Date(emp.doj).toLocaleDateString('en-GB'),
      'Percentage': emp.percentage + '%'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Salary Data');
    
    XLSX.writeFile(workbook, `Employee_Salary_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export logic for current view
  const handleExport = () => {
    if (view === 'employee') {
      exportToExcel();
    } else {
      const exportData = departmentRows.map(dept => ({
        Department: dept.department,
        'Total Salary': dept.total,
        'Employees': dept.count,
        'Avg Percentage': dept.avgPercentage + '%',
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Department Salary Data');
      XLSX.writeFile(workbook, `Department_Salary_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    const { emp_code, emp_name, designation, department, location, fix_gross, doj } = formData;
    if (!emp_code || !emp_name || !designation || !department || !location || !fix_gross || !doj) {
      toast({ title: 'All fields are required', variant: 'destructive' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('salary_master')
        .insert([{
          emp_code,
          emp_name,
          designation,
          department,
          location,
          fix_gross: Number(fix_gross),
          doj,
          percentage: 0
        }])
        .select()
        .single();

      if (error) throw error;

      setSalaryData(prev => [data, ...prev]);
      setFormData({ emp_code: '', emp_name: '', designation: '', department: '', location: '', fix_gross: '', doj: '' });
      setIsDialogOpen(false);
      toast({ title: 'Employee added successfully', variant: 'default' });
    } catch (err: any) {
      toast({
        title: "Error Adding Employee",
        description: err.message || String(err),
        variant: "destructive",
      });
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const { emp_code, emp_name, designation, department, location, fix_gross, doj } = formData;
    if (!emp_code || !emp_name || !designation || !department || !location || !fix_gross || !doj) {
      toast({ title: 'All fields are required', variant: 'destructive' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('salary_master')
        .update({
          emp_code,
          emp_name,
          designation,
          department,
          location,
          fix_gross: Number(fix_gross),
          doj
        })
        .eq('id', selectedEmployee.id)
        .select()
        .single();

      if (error) throw error;

      setSalaryData(prev => prev.map(emp => emp.id === selectedEmployee.id ? data : emp));
      setFormData({ emp_code: '', emp_name: '', designation: '', department: '', location: '', fix_gross: '', doj: '' });
      setSelectedEmployee(null);
      setIsEditDialogOpen(false);
      toast({ title: 'Employee updated successfully', variant: 'default' });
    } catch (err: any) {
      toast({
        title: "Error Updating Employee",
        description: err.message || String(err),
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (employee: SalaryData) => {
    setSelectedEmployee(employee);
    setFormData({
      emp_code: employee.emp_code,
      emp_name: employee.emp_name,
      designation: employee.designation,
      department: employee.department,
      location: employee.location,
      fix_gross: employee.fix_gross.toString(),
      doj: employee.doj
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isManagement && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Employee-wise</span>
              <Switch checked={view === 'department'} onCheckedChange={checked => setView(checked ? 'department' : 'employee')} />
              <span className="text-sm font-medium text-slate-700">Department-wise</span>
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <Button 
            className="professional-button"
            onClick={handleExport}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export to Excel
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="professional-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="empCode">Employee Code *</Label>
                    <Input id="empCode" value={formData.emp_code} onChange={e => setFormData({ ...formData, emp_code: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="empName">Name *</Label>
                    <Input id="empName" value={formData.emp_name} onChange={e => setFormData({ ...formData, emp_name: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation *</Label>
                    <Input id="designation" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Input id="department" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input id="location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="fixGross">Fixed Gross *</Label>
                    <Input id="fixGross" type="number" value={formData.fix_gross} onChange={e => setFormData({ ...formData, fix_gross: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="doj">Date of Joining *</Label>
                    <Input id="doj" type="date" value={formData.doj} onChange={e => setFormData({ ...formData, doj: e.target.value })} required />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {view === 'employee' ? (
          <>
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-700 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Total Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-800">{totalEmployees}</div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-emerald-700">Total Payroll</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-800">{formatCurrency(totalSalary)}</div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700">Avg Salary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-800">{formatCurrency(avgSalary)}</div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-700">Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-800">{totalDepartments}</div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-700">Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-800">{departmentCount}</div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-emerald-700">Total Payroll</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-800">{formatCurrency(departmentTotalSalary)}</div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700">Avg Dept Salary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-800">{formatCurrency(avgDepartmentSalary)}</div>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-700 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Total Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-800">{departmentTotalEmployees}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Search and Filter */}
      <Card className="border-slate-200 bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-grow" style={{ minWidth: '250px' }}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
            <Select value={filterDesignation} onValueChange={setFilterDesignation}>
              <SelectTrigger className="w-full md:w-auto flex-grow" style={{ minWidth: '150px' }}>
                <SelectValue placeholder="Designation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                {designations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full md:w-auto flex-grow" style={{ minWidth: '150px' }}>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-full md:w-auto flex-grow" style={{ minWidth: '150px' }}>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterDoj}
              onChange={e => setFilterDoj(e.target.value)}
              className="w-full md:w-auto flex-grow"
              style={{ minWidth: '150px' }}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Salary Table */}
      {view === 'employee' && (
        <Card className="border-slate-200 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Employee Salary Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto overflow-y-auto max-h-[56vh] w-full block">
              <Table className="min-w-[1200px] border border-gray-200">
                <TableHeader className="sticky top-0 z-20 bg-white shadow border-t border-gray-200">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="border-r border-gray-200 text-slate-700 font-semibold">Employee Code</TableHead>
                    <TableHead className="border-r border-gray-200 text-slate-700 font-semibold">Name</TableHead>
                    <TableHead className="border-r border-gray-200 text-slate-700 font-semibold">Designation</TableHead>
                    <TableHead className="border-r border-gray-200 text-slate-700 font-semibold">Department</TableHead>
                    <TableHead className="border-r border-gray-200 text-slate-700 font-semibold">Location</TableHead>
                    <TableHead className="border-r border-gray-200 text-slate-700 font-semibold">Fixed Gross</TableHead>
                    <TableHead className="border-r border-gray-200 text-slate-700 font-semibold">Date of Joining</TableHead>
                    <TableHead className="text-slate-700 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((emp) => (
                    <TableRow key={emp.id} className="border-b border-gray-200 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="border-r border-gray-200 font-medium text-slate-800">{emp.emp_code}</TableCell>
                      <TableCell className="border-r border-gray-200 text-slate-700">{emp.emp_name}</TableCell>
                      <TableCell className="border-r border-gray-200">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                          {emp.designation}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r border-gray-200">
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                          {emp.department}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r border-gray-200 text-slate-600">{emp.location}</TableCell>
                      <TableCell className="border-r border-gray-200 font-semibold text-slate-800">
                        {formatCurrency(emp.fix_gross)}
                      </TableCell>
                      <TableCell className="border-r border-gray-200 text-slate-600">
                        {new Date(emp.doj).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(emp)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredData.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No employees found</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {view === 'department' && (
        <Card className="border-slate-200 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Department Salary Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto overflow-y-auto max-h-[56vh] w-full block">
              <Table className="min-w-[800px] border border-gray-200">
                <TableHeader className="sticky top-0 z-20 bg-white shadow border-t border-gray-200">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="border-r border-gray-200 text-slate-700 font-semibold">Department</TableHead>
                    <TableHead className="border-r border-gray-200 text-slate-700 font-semibold">Total Salary</TableHead>
                    <TableHead className="border-r border-gray-200 text-slate-700 font-semibold">Employees</TableHead>
                    <TableHead className="text-slate-700 font-semibold">Avg Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentRows.map((dept) => (
                    <TableRow key={dept.department} className="border-b border-gray-200 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="border-r border-gray-200 font-medium text-slate-800">{dept.department}</TableCell>
                      <TableCell className="border-r border-gray-200 font-semibold text-slate-800">{formatCurrency(dept.total)}</TableCell>
                      <TableCell className="border-r border-gray-200 text-slate-700">{dept.count}</TableCell>
                      <TableCell className="text-slate-700">{dept.avgPercentage.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditEmployee} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editEmpCode">Employee Code *</Label>
                <Input id="editEmpCode" value={formData.emp_code} onChange={e => setFormData({ ...formData, emp_code: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="editEmpName">Name *</Label>
                <Input id="editEmpName" value={formData.emp_name} onChange={e => setFormData({ ...formData, emp_name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="editDesignation">Designation *</Label>
                <Input id="editDesignation" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="editDepartment">Department *</Label>
                <Input id="editDepartment" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="editLocation">Location *</Label>
                <Input id="editLocation" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="editFixGross">Fixed Gross *</Label>
                <Input id="editFixGross" type="number" value={formData.fix_gross} onChange={e => setFormData({ ...formData, fix_gross: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="editDoj">Date of Joining *</Label>
                <Input id="editDoj" type="date" value={formData.doj} onChange={e => setFormData({ ...formData, doj: e.target.value })} required />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryMaster;
