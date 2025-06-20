import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SalaryData {
  id: string;
  empCode: string;
  empName: string;
  designation: string;
  department: string;
  location: string;
  fixGross: number;
  doj: string;
  percentage: number;
}

interface SalaryMasterProps {
  isManagement?: boolean;
}

const SalaryMaster: React.FC<SalaryMasterProps> = ({ isManagement = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'employee' | 'department'>('employee');
  const [salaryData, setSalaryData] = useState<SalaryData[]>([
    {
      id: '1',
      empCode: 'EMP001',
      empName: 'John Smith',
      designation: 'Senior Software Engineer',
      department: 'Engineering',
      location: 'London',
      fixGross: 85000,
      doj: '2023-01-15',
      percentage: 15.2
    },
    {
      id: '2',
      empCode: 'EMP002',
      empName: 'Sarah Johnson',
      designation: 'Research Lead',
      department: 'Research & Development',
      location: 'London',
      fixGross: 95000,
      doj: '2023-02-01',
      percentage: 17.1
    },
    {
      id: '3',
      empCode: 'EMP003',
      empName: 'Michael Brown',
      designation: 'Strategy Advisor',
      department: 'Operations',
      location: 'Manchester',
      fixGross: 75000,
      doj: '2023-03-10',
      percentage: 13.5
    },
    {
      id: '4',
      empCode: 'EMP004',
      empName: 'Emma Wilson',
      designation: 'Innovation Specialist',
      department: 'Research & Development',
      location: 'Edinburgh',
      fixGross: 70000,
      doj: '2023-04-05',
      percentage: 12.6
    },
    {
      id: '5',
      empCode: 'EMP005',
      empName: 'David Miller',
      designation: 'Growth Manager',
      department: 'Business Development',
      location: 'Birmingham',
      fixGross: 80000,
      doj: '2023-05-20',
      percentage: 14.4
    }
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    empCode: '', empName: '', designation: '', department: '', location: '', fixGross: '', doj: ''
  });
  const { toast } = useToast();
  
  // Filtered data for employee view
  const filteredData = salaryData.filter(emp =>
    emp.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.empCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary values for employee view
  const totalSalary = filteredData.reduce((sum, emp) => sum + emp.fixGross, 0);
  const totalEmployees = filteredData.length;
  const avgSalary = totalEmployees ? totalSalary / totalEmployees : 0;
  const totalDepartments = new Set(filteredData.map(emp => emp.department)).size;

  // Group by department for department view
  const departmentData = salaryData.reduce((acc, emp) => {
    const dept = acc[emp.department] || { department: emp.department, total: 0, count: 0, percentage: 0 };
    dept.total += emp.fixGross;
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
      'Employee Code': emp.empCode,
      'Employee Name': emp.empName,
      'Designation': emp.designation,
      'Department': emp.department,
      'Location': emp.location,
      'Fixed Gross': emp.fixGross,
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

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    const { empCode, empName, designation, department, location, fixGross, doj } = formData;
    if (!empCode || !empName || !designation || !department || !location || !fixGross || !doj) {
      toast({ title: 'All fields are required', variant: 'destructive' });
      return;
    }
    setSalaryData(prev => [
      ...prev,
      {
        id: (prev.length + 1).toString(),
        empCode,
        empName,
        designation,
        department,
        location,
        fixGross: Number(fixGross),
        doj,
        percentage: 0
      }
    ]);
    setFormData({ empCode: '', empName: '', designation: '', department: '', location: '', fixGross: '', doj: '' });
    setIsDialogOpen(false);
    toast({ title: 'Employee added successfully', variant: 'default' });
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
            variant="outline" 
            className="border-amber-200 text-amber-700 hover:bg-amber-50 professional-button"
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
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
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
                    <Input id="empCode" value={formData.empCode} onChange={e => setFormData({ ...formData, empCode: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="empName">Name *</Label>
                    <Input id="empName" value={formData.empName} onChange={e => setFormData({ ...formData, empName: e.target.value })} required />
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
                    <Input id="fixGross" type="number" value={formData.fixGross} onChange={e => setFormData({ ...formData, fixGross: e.target.value })} required />
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
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search employees by name, code, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
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
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-slate-700 font-semibold">Employee Code</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Name</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Designation</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Department</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Location</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Fixed Gross</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Date of Joining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-800">{emp.empCode}</TableCell>
                    <TableCell className="text-slate-700">{emp.empName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                        {emp.designation}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                        {emp.department}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{emp.location}</TableCell>
                    <TableCell className="font-semibold text-slate-800">
                      {formatCurrency(emp.fixGross)}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(emp.doj).toLocaleDateString('en-GB')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {view === 'department' && (
        <Card className="border-slate-200 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Department Salary Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-slate-700 font-semibold">Department</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Total Salary</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Employees</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Avg Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentRows.map((dept) => (
                  <TableRow key={dept.department} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-800">{dept.department}</TableCell>
                    <TableCell className="font-semibold text-slate-800">{formatCurrency(dept.total)}</TableCell>
                    <TableCell className="text-slate-700">{dept.count}</TableCell>
                    <TableCell className="text-slate-700">{dept.avgPercentage.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalaryMaster;
