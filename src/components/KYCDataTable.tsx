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
import * as XLSX from 'xlsx';

interface KYCData {
  id: string;
  sr_no: number;
  employee_name: string;
  father_name: string;
  husband_name: string;
  gender: string;
  marital_status: string;
  date_of_birth: string;
  designation: string;
  basic_salary_rate: number;
  s_a: number;
  conveyance_allow: number;
  house_rent_allow: number;
  education_allow: number;
  books_perks: number;
  telephone: number;
  gross_salary_rate: number;
  previous_company_esic_no: string;
  previous_company_uan_no: string;
  previous_company_pf_ac_no: string;
  date_of_appointment: string;
  mobile_number: string;
  email_id: string;
  aadhaar_card_no: string;
  name_as_per_e_aadhaar_card: string;
  pan_no: string;
  name_as_per_pan_card: string;
  bank_account_no: string;
  ifsc_code: string;
  name_as_per_bank_passbook: string;
  educational_qualification: string;
  physical_status: string;
  type_of_handicapped: string;
  permanent_address: string;
  aadhaar_card_address: string;
  reference_no: string;
  photo_copy: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

const KYCDataTable: React.FC = () => {
  const { toast } = useToast();
  const [kycData, setKycData] = useState<KYCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
      kyc.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.email_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kyc.mobile_number?.includes(searchTerm);
    
    const matchesGender = filterGender === 'all' || kyc.gender === filterGender;
    
    return matchesSearch && matchesGender;
  });

  // Handle form input changes
  const handleInputChange = (field: keyof KYCData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle adding new KYC data
  const handleAddKYC = async () => {
    // Basic validation
    if (!formData.employee_name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Employee Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email_id?.trim()) {
      toast({
        title: "Validation Error",
        description: "Email ID is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.mobile_number?.trim()) {
      toast({
        title: "Validation Error",
        description: "Mobile Number is required",
        variant: "destructive",
      });
      return;
    }

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

    // Basic validation
    if (!formData.employee_name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Employee Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email_id?.trim()) {
      toast({
        title: "Validation Error",
        description: "Email ID is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.mobile_number?.trim()) {
      toast({
        title: "Validation Error",
        description: "Mobile Number is required",
        variant: "destructive",
      });
      return;
    }

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
    try {
      // Export with ALL columns (visible + hidden) for complete data
      const exportData = kycData.map(record => {
        const exportRecord: any = {};
        
        // All fields from the KYC data table
        const allColumns = [
          'sr_no', 'employee_name', 'father_name', 'husband_name', 'gender',
          'marital_status', 'date_of_birth', 'designation', 'basic_salary_rate',
          's_a', 'conveyance_allow', 'house_rent_allow', 'education_allow',
          'books_perks', 'telephone', 'gross_salary_rate', 'previous_company_esic_no',
          'previous_company_uan_no', 'previous_company_pf_ac_no', 'date_of_appointment',
          'mobile_number', 'email_id', 'aadhaar_card_no', 'name_as_per_e_aadhaar_card',
          'pan_no', 'name_as_per_pan_card', 'bank_account_no', 'ifsc_code',
          'name_as_per_bank_passbook', 'educational_qualification', 'physical_status',
          'type_of_handicapped', 'permanent_address', 'aadhaar_card_address',
          'reference_no', 'photo_copy'
        ];
        
        allColumns.forEach(column => {
          exportRecord[column] = record[column as keyof KYCData] || '';
        });
        
        return exportRecord;
      });
      
      // Create Excel file
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'KYC Data');
      XLSX.writeFile(wb, 'kyc_data_complete.xlsx');
      
      toast({
        title: "Export Successful",
        description: `${exportData.length} KYC records exported with all fields`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export KYC data",
        variant: "destructive",
      });
    }
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
                placeholder="Search by name, email, designation, or mobile number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
              />
              </div>
            </div>

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

      {/* Table - Showing Only Yellow Columns (Essential Fields) */}
      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-700">
                  <TableHead className="text-slate-700 dark:text-slate-300">Employee Details</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Father Name</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Gender</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Designation</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Basic Salary</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Aadhaar No</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">PAN No</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Bank Account No</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      Loading KYC data...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      No KYC records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((kyc) => (
                    <TableRow key={kyc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {kyc.employee_name || '-'}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {kyc.email_id || '-'}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {kyc.mobile_number || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-white">
                        {kyc.father_name || '-'}
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-white">
                        {kyc.gender || '-'}
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-white">
                        {kyc.designation || '-'}
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-white font-medium">
                        {kyc.basic_salary_rate ? `₹${kyc.basic_salary_rate.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-white">
                        {kyc.aadhaar_card_no || '-'}
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-white">
                        {kyc.pan_no || '-'}
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-white">
                        {kyc.bank_account_no || '-'}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Add New KYC Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Form fields - similar to KYCDataForm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Employee Name *</Label>
                <Input
                  value={formData.employee_name || ''}
                  onChange={(e) => handleInputChange('employee_name', e.target.value)}
                  placeholder="Enter employee name"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Email ID *</Label>
                <Input
                  type="email"
                  value={formData.email_id || ''}
                  onChange={(e) => handleInputChange('email_id', e.target.value)}
                  placeholder="Enter email address"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Mobile Number *</Label>
                <Input
                  value={formData.mobile_number || ''}
                  onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                  placeholder="Enter mobile number"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Father Name</Label>
                <Input
                  value={formData.father_name || ''}
                  onChange={(e) => handleInputChange('father_name', e.target.value)}
                  placeholder="Enter father name"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Gender</Label>
                <Select value={formData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-amber-200 dark:focus:ring-amber-400">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                    <SelectItem value="Male" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Male</SelectItem>
                    <SelectItem value="Female" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Female</SelectItem>
                    <SelectItem value="Other" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Designation</Label>
                <Input
                  value={formData.designation || ''}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  placeholder="Enter designation"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Basic Salary</Label>
                <Input
                  type="number"
                  value={formData.basic_salary_rate || ''}
                  onChange={(e) => handleInputChange('basic_salary_rate', e.target.value)}
                  placeholder="Enter basic salary"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Aadhaar Number</Label>
                <Input
                  value={formData.aadhaar_card_no || ''}
                  onChange={(e) => handleInputChange('aadhaar_card_no', e.target.value)}
                  placeholder="Enter Aadhaar number"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">PAN Number</Label>
                <Input
                  value={formData.pan_no || ''}
                  onChange={(e) => handleInputChange('pan_no', e.target.value)}
                  placeholder="Enter PAN number"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Bank Account Number</Label>
                <Input
                  value={formData.bank_account_no || ''}
                  onChange={(e) => handleInputChange('bank_account_no', e.target.value)}
                  placeholder="Enter bank account number"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                Cancel
              </Button>
              <Button onClick={handleAddKYC} className="bg-amber-600 hover:bg-amber-700 text-white">
                Add KYC
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit KYC Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Edit KYC Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Form fields - similar to add dialog */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Employee Name *</Label>
                <Input
                  value={formData.employee_name || ''}
                  onChange={(e) => handleInputChange('employee_name', e.target.value)}
                  placeholder="Enter employee name"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Email ID *</Label>
                <Input
                  type="email"
                  value={formData.email_id || ''}
                  onChange={(e) => handleInputChange('email_id', e.target.value)}
                  placeholder="Enter email address"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Mobile Number *</Label>
                <Input
                  value={formData.mobile_number || ''}
                  onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                  placeholder="Enter mobile number"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Father Name</Label>
                <Input
                  value={formData.father_name || ''}
                  onChange={(e) => handleInputChange('father_name', e.target.value)}
                  placeholder="Enter father name"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Gender</Label>
                <Select value={formData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-amber-200 dark:focus:ring-amber-400">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                    <SelectItem value="Male" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Male</SelectItem>
                    <SelectItem value="Female" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Female</SelectItem>
                    <SelectItem value="Other" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Designation</Label>
                <Input
                  value={formData.designation || ''}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  placeholder="Enter designation"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Basic Salary</Label>
                <Input
                  type="number"
                  value={formData.basic_salary_rate || ''}
                  onChange={(e) => handleInputChange('basic_salary_rate', e.target.value)}
                  placeholder="Enter basic salary"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Aadhaar Number</Label>
                <Input
                  value={formData.aadhaar_card_no || ''}
                  onChange={(e) => handleInputChange('aadhaar_card_no', e.target.value)}
                  placeholder="Enter Aadhaar number"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">PAN Number</Label>
                <Input
                  value={formData.pan_no || ''}
                  onChange={(e) => handleInputChange('pan_no', e.target.value)}
                  placeholder="Enter PAN number"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Bank Account Number</Label>
                <Input
                  value={formData.bank_account_no || ''}
                  onChange={(e) => handleInputChange('bank_account_no', e.target.value)}
                  placeholder="Enter bank account number"
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-amber-200 dark:focus:ring-amber-400"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                Cancel
              </Button>
              <Button onClick={handleUpdateKYC} className="bg-amber-600 hover:bg-amber-700 text-white">
                Update KYC
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View KYC Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">KYC Details</DialogTitle>
          </DialogHeader>
          {selectedKYC && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-500">Employee Name</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.employee_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Email ID</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.email_id || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Mobile Number</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.mobile_number || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Father Name</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.father_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Gender</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.gender || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Designation</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.designation || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Basic Salary</Label>
                  <p className="text-slate-900 dark:text-white">
                    {selectedKYC.basic_salary_rate ? `₹${selectedKYC.basic_salary_rate.toLocaleString()}` : '-'}
                  </p>
                </div>
              </div>

              {/* Document Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-500">Aadhaar Number</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.aadhaar_card_no || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">PAN Number</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.pan_no || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-500">Bank Account Number</Label>
                  <p className="text-slate-900 dark:text-white">{selectedKYC.bank_account_no || '-'}</p>
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