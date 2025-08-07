import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Eye, 
  Trash2, 
  Plus,
  User,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

interface KYCData {
  id: string;
  employeeName: string;
  fatherName: string;
  husbandName: string;
  gender: string;
  maritalStatus: string;
  dobAadhar: string;
  designation: string;
  basicSalary: string;
  specialAllowance: string;
  conveyance: string;
  hra: string;
  cea: string;
  booksPerks: string;
  telephonic: string;
  grossSalary: string;
  dateOfAppointment: string;
  mobileNo: string;
  emailId: string;
  aadharNo: string;
  namePerAadhar: string;
  panNo: string;
  namePerPan: string;
  bankAccountNo: string;
  ifscCode: string;
  permanentAddress: string;
  aadharAddress: string;
  grade: string;
  created_at: string;
  updated_at: string;
}

const KYCDataTable: React.FC = () => {
  const { toast } = useToast();
  const [kycData, setKycData] = useState<KYCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState<KYCData | null>(null);
  const [editingKYC, setEditingKYC] = useState<KYCData | null>(null);
  const [formData, setFormData] = useState<Partial<KYCData>>({});

  // Fetch KYC data from Supabase
  const fetchKYCData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kyc_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching KYC data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch KYC data",
          variant: "destructive",
        });
      } else {
        setKycData(data || []);
      }
    } catch (error) {
      console.error('Error fetching KYC data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch KYC data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYCData();
  }, []);



  // Filter data based on search and filters
  const filteredData = kycData.filter(kyc => {
    const matchesSearch = 
      kyc.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.emailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.mobileNo?.includes(searchTerm);
    
    const matchesGrade = filterGrade === 'all' || kyc.grade === filterGrade;
    const matchesGender = filterGender === 'all' || kyc.gender === filterGender;
    
    return matchesSearch && matchesGrade && matchesGender;
  });

  // Handle form input changes
  const handleInputChange = (field: keyof KYCData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle adding new KYC data
  const handleAddKYC = async () => {
    try {
      const { error } = await supabase
        .from('kyc_data')
        .insert([formData]);

      if (error) {
        console.error('Error adding KYC data:', error);
        toast({
          title: "Error",
          description: "Failed to add KYC data",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "KYC data added successfully",
        });
        setIsAddDialogOpen(false);
        setFormData({});
        fetchKYCData();
      }
    } catch (error) {
      console.error('Error adding KYC data:', error);
      toast({
        title: "Error",
        description: "Failed to add KYC data",
        variant: "destructive",
      });
    }
  };

  // Handle updating KYC data
  const handleUpdateKYC = async () => {
    if (!editingKYC) return;

    try {
      const { error } = await supabase
        .from('kyc_data')
        .update(formData)
        .eq('id', editingKYC.id);

      if (error) {
        console.error('Error updating KYC data:', error);
        toast({
          title: "Error",
          description: "Failed to update KYC data",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "KYC data updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingKYC(null);
        setFormData({});
        fetchKYCData();
      }
    } catch (error) {
      console.error('Error updating KYC data:', error);
      toast({
        title: "Error",
        description: "Failed to update KYC data",
        variant: "destructive",
      });
    }
  };

  // Handle deleting KYC data
  const handleDeleteKYC = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this KYC record?')) return;

    try {
      const { error } = await supabase
        .from('kyc_data')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting KYC data:', error);
        toast({
          title: "Error",
          description: "Failed to delete KYC data",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "KYC data deleted successfully",
        });
        fetchKYCData();
      }
    } catch (error) {
      console.error('Error deleting KYC data:', error);
      toast({
        title: "Error",
        description: "Failed to delete KYC data",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (kyc: KYCData) => {
    setEditingKYC(kyc);
    setFormData(kyc);
    setIsEditDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = (kyc: KYCData) => {
    setSelectedKYC(kyc);
    setIsViewDialogOpen(true);
  };

  // Export to Excel
  const handleExport = () => {
    // Implementation for Excel export
    toast({
      title: "Export",
      description: "Export functionality will be implemented",
    });
  };

  // Get status badge color
  const getStatusColor = (grade: string) => {
    const colors: { [key: string]: string } = {
      'M1': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'M2': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'M3': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'M4': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'M5': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'M6': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'M7': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'M8': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };
    return colors[grade] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">KYC Data Records</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage employee KYC information</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="border-slate-200 dark:border-slate-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Add KYC
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, designation, or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                />
              </div>
            </div>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="w-full sm:w-40 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700">
                <SelectValue placeholder="Filter by Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="M1">M1</SelectItem>
                <SelectItem value="M2">M2</SelectItem>
                <SelectItem value="M3">M3</SelectItem>
                <SelectItem value="M4">M4</SelectItem>
                <SelectItem value="M5">M5</SelectItem>
                <SelectItem value="M6">M6</SelectItem>
                <SelectItem value="M7">M7</SelectItem>
                <SelectItem value="M8">M8</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="w-full sm:w-40 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700">
                <SelectValue placeholder="Filter by Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-700">
                  <TableHead className="text-slate-700 dark:text-slate-300">Employee</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Contact</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Designation</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Grade</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Salary</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Appointment Date</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Loading KYC data...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No KYC records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((kyc) => (
                    <TableRow key={kyc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {kyc.employeeName}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {kyc.gender} • {kyc.maritalStatus}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="w-3 h-3 mr-1 text-slate-400" />
                            {kyc.emailId}
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-1 text-slate-400" />
                            {kyc.mobileNo}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-slate-900 dark:text-white font-medium">
                          {kyc.designation}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(kyc.grade)}>
                          {kyc.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-slate-900 dark:text-white font-medium">
                          ₹{parseInt(kyc.grossSalary || '0').toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          Basic: ₹{parseInt(kyc.basicSalary || '0').toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                          {new Date(kyc.dateOfAppointment).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openViewDialog(kyc)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(kyc)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteKYC(kyc.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add KYC Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New KYC Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Form fields - similar to KYCDataForm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Employee Name *</Label>
                <Input
                  value={formData.employeeName || ''}
                  onChange={(e) => handleInputChange('employeeName', e.target.value)}
                  placeholder="Enter employee name"
                />
              </div>
              <div>
                <Label>Email ID *</Label>
                <Input
                  type="email"
                  value={formData.emailId || ''}
                  onChange={(e) => handleInputChange('emailId', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label>Designation</Label>
                <Input
                  value={formData.designation || ''}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  placeholder="Enter designation"
                />
              </div>
              <div>
                <Label>Grade</Label>
                <Select value={formData.grade || ''} onValueChange={(value) => handleInputChange('grade', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M1">M1</SelectItem>
                    <SelectItem value="M2">M2</SelectItem>
                    <SelectItem value="M3">M3</SelectItem>
                    <SelectItem value="M4">M4</SelectItem>
                    <SelectItem value="M5">M5</SelectItem>
                    <SelectItem value="M6">M6</SelectItem>
                    <SelectItem value="M7">M7</SelectItem>
                    <SelectItem value="M8">M8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mobile No.</Label>
                <Input
                  value={formData.mobileNo || ''}
                  onChange={(e) => handleInputChange('mobileNo', e.target.value)}
                  placeholder="Enter mobile number"
                />
              </div>
              <div>
                <Label>Gross Salary</Label>
                <Input
                  type="number"
                  value={formData.grossSalary || ''}
                  onChange={(e) => handleInputChange('grossSalary', e.target.value)}
                  placeholder="Enter gross salary"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddKYC} className="bg-amber-600 hover:bg-amber-700">
                Add KYC
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit KYC Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit KYC Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Form fields - similar to add dialog */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Employee Name *</Label>
                <Input
                  value={formData.employeeName || ''}
                  onChange={(e) => handleInputChange('employeeName', e.target.value)}
                  placeholder="Enter employee name"
                />
              </div>
              <div>
                <Label>Email ID *</Label>
                <Input
                  type="email"
                  value={formData.emailId || ''}
                  onChange={(e) => handleInputChange('emailId', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label>Designation</Label>
                <Input
                  value={formData.designation || ''}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  placeholder="Enter designation"
                />
              </div>
              <div>
                <Label>Grade</Label>
                <Select value={formData.grade || ''} onValueChange={(value) => handleInputChange('grade', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M1">M1</SelectItem>
                    <SelectItem value="M2">M2</SelectItem>
                    <SelectItem value="M3">M3</SelectItem>
                    <SelectItem value="M4">M4</SelectItem>
                    <SelectItem value="M5">M5</SelectItem>
                    <SelectItem value="M6">M6</SelectItem>
                    <SelectItem value="M7">M7</SelectItem>
                    <SelectItem value="M8">M8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mobile No.</Label>
                <Input
                  value={formData.mobileNo || ''}
                  onChange={(e) => handleInputChange('mobileNo', e.target.value)}
                  placeholder="Enter mobile number"
                />
              </div>
              <div>
                <Label>Gross Salary</Label>
                <Input
                  type="number"
                  value={formData.grossSalary || ''}
                  onChange={(e) => handleInputChange('grossSalary', e.target.value)}
                  placeholder="Enter gross salary"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateKYC} className="bg-amber-600 hover:bg-amber-700">
                Update KYC
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View KYC Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Details</DialogTitle>
          </DialogHeader>
          {selectedKYC && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-500">Employee Name</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.employeeName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Email ID</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.emailId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Designation</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.designation}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Grade</Label>
                  <Badge className={getStatusColor(selectedKYC.grade)}>
                    {selectedKYC.grade}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Mobile No.</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.mobileNo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Gross Salary</Label>
                  <p className="text-slate-900 dark:text-white">₹{parseInt(selectedKYC.grossSalary || '0').toLocaleString()}</p>
                </div>
              </div>

              {/* Document Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-500">Aadhar No.</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.aadharNo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">PAN No.</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.panNo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Bank A/c No.</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.bankAccountNo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">IFSC Code</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.ifscCode}</p>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-500">Permanent Address</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.permanentAddress}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Aadhar Card Address</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.aadharAddress}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
         </div>
   );
 };

export default KYCDataTable; 