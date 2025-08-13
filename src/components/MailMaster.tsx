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
  Mail, 
  Phone, 
  Edit, 
  Plus, 
  Search, 
  Filter,
  ExternalLink,
  User,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

interface MailMasterEmployee {
  id: string;
  employee_id: string;
  employee_name: string;
  company_email?: string;
  personal_email?: string;
  phone_number?: string;
  department?: string;
  position?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const MailMaster: React.FC = () => {
  const [employees, setEmployees] = useState<MailMasterEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<MailMasterEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<MailMasterEmployee | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  
  const { toast } = useToast();

  // Form state for create/edit
  const [formData, setFormData] = useState({
    employee_id: '',
    employee_name: '',
    company_email: '',
    personal_email: '',
    phone_number: '',
    department: '',
    position: '',
    status: 'active'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, departmentFilter]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('mail_master')
        .select('*')
        .order('employee_name');

      if (error) throw error;

      setEmployees(data || []);
      
      // Extract unique departments for filter
      const uniqueDepartments = [...new Set(data?.map(emp => emp.department).filter(Boolean) || [])];
      setDepartments(uniqueDepartments);
    } catch (error: any) {
      toast({
        title: "Error fetching employees",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.company_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.personal_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter && departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    setFilteredEmployees(filtered);
  };

  const handleCreateEmployee = async () => {
    try {
      const { error } = await supabase
        .from('mail_master')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Employee created successfully",
        description: "New employee contact has been added to Mail Master."
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error creating employee",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    try {
      const { error } = await supabase
        .from('mail_master')
        .update(formData)
        .eq('id', editingEmployee.id);

      if (error) throw error;

      toast({
        title: "Employee updated successfully",
        description: "Employee contact information has been updated."
      });

      setIsEditDialogOpen(false);
      setEditingEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error updating employee",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (employee: MailMasterEmployee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_id: employee.employee_id,
      employee_name: employee.employee_name,
      company_email: employee.company_email || '',
      personal_email: employee.personal_email || '',
      phone_number: employee.phone_number || '',
      department: employee.department || '',
      position: employee.position || '',
      status: employee.status
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      employee_name: '',
      company_email: '',
      personal_email: '',
      phone_number: '',
      department: '',
      position: '',
      status: 'active'
    });
  };

  const openWhatsApp = (phoneNumber: string) => {
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${formattedPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const openEmail = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const getEmailCount = (employee: MailMasterEmployee) => {
    let count = 0;
    if (employee.company_email) count++;
    if (employee.personal_email) count++;
    return count;
  };

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Mail Master</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Manage employee contact information for email communications
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Employee Contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee_id">Employee ID *</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    placeholder="Enter employee ID"
                  />
                </div>
                <div>
                  <Label htmlFor="employee_name">Employee Name *</Label>
                  <Input
                    id="employee_name"
                    value={formData.employee_name}
                    onChange={(e) => setFormData({...formData, employee_name: e.target.value})}
                    placeholder="Enter employee name"
                  />
                </div>
                <div>
                  <Label htmlFor="company_email">Company Email</Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={formData.company_email}
                    onChange={(e) => setFormData({...formData, company_email: e.target.value})}
                    placeholder="@rishabworld.com"
                  />
                </div>
                <div>
                  <Label htmlFor="personal_email">Personal Email</Label>
                  <Input
                    id="personal_email"
                    type="email"
                    value={formData.personal_email}
                    onChange={(e) => setFormData({...formData, personal_email: e.target.value})}
                    placeholder="@gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    placeholder="For WhatsApp"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="Enter department"
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    placeholder="Enter position"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateEmployee} className="flex-1">
                    Create Employee
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, ID, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Employee Contacts ({filteredEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Contact Information</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No employees found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {employee.employee_name}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              ID: {employee.employee_id}
                            </div>
                            {employee.position && (
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                {employee.position}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {employee.company_email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">{employee.company_email}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEmail(employee.company_email!)}
                                  className="h-6 w-6 p-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                            {employee.personal_email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-green-600" />
                                <span className="text-sm">{employee.personal_email}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEmail(employee.personal_email!)}
                                  className="h-6 w-6 p-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                            {employee.phone_number && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-green-600" />
                                <span className="text-sm">{employee.phone_number}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openWhatsApp(employee.phone_number!)}
                                  className="h-6 w-6 p-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                            {getEmailCount(employee) === 0 && (
                              <span className="text-sm text-slate-400">No contact info</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {employee.department ? (
                            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700">
                              <Building className="w-3 h-3 mr-1" />
                              {employee.department}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={employee.status === 'active' ? 'default' : 'secondary'}
                            className={employee.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                            }
                          >
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Employee Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_employee_id">Employee ID *</Label>
                <Input
                  id="edit_employee_id"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  placeholder="Enter employee ID"
                />
              </div>
              <div>
                <Label htmlFor="edit_employee_name">Employee Name *</Label>
                <Input
                  id="edit_employee_name"
                  value={formData.employee_name}
                  onChange={(e) => setFormData({...formData, employee_name: e.target.value})}
                  placeholder="Enter employee name"
                />
              </div>
              <div>
                <Label htmlFor="edit_company_email">Company Email</Label>
                <Input
                  id="edit_company_email"
                  type="email"
                  value={formData.company_email}
                  onChange={(e) => setFormData({...formData, company_email: e.target.value})}
                  placeholder="@rishabworld.com"
                />
              </div>
              <div>
                <Label htmlFor="edit_personal_email">Personal Email</Label>
                <Input
                  id="edit_personal_email"
                  type="email"
                  value={formData.personal_email}
                  onChange={(e) => setFormData({...formData, personal_email: e.target.value})}
                  placeholder="@gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="edit_phone_number">Phone Number</Label>
                <Input
                  id="edit_phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  placeholder="For WhatsApp"
                />
              </div>
              <div>
                <Label htmlFor="edit_department">Department</Label>
                <Input
                  id="edit_department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="Enter department"
                />
              </div>
              <div>
                <Label htmlFor="edit_position">Position</Label>
                <Input
                  id="edit_position"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  placeholder="Enter position"
                />
              </div>
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateEmployee} className="flex-1">
                  Update Employee
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MailMaster;
