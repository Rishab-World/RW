import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building, Calendar, Mail, Phone, Edit, FileText, Users, TrendingUp, Clock, Bell, Eye, Download, Upload, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatSalary } from '@/lib/utils';

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  costToHire?: number;
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

// Helper to format date as dd-mmm-yy
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    
    return `${day}-${month}-${year}`;
  } catch {
    return '-';
  }
};

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, refreshEmployees }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    costToHire: '',
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
  
  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);
  
  // Import/Export states
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);

  // Get unique filter options from employees data
  const departmentOptions = useMemo(() => Array.from(new Set(employees.map(e => e.department).filter(Boolean))), [employees]);
  const designationOptions = useMemo(() => Array.from(new Set(employees.map(e => e.position).filter(Boolean))), [employees]);
  const managerOptions = useMemo(() => Array.from(new Set(employees.map(e => e.reportingManager).filter(Boolean))), [employees]);
  const statusOptions = useMemo(() => Array.from(new Set(employees.map(e => e.status).filter(Boolean))), [employees]);



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
      (emp.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (emp.employeeId?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (emp.department?.toLowerCase() || '').includes(search.toLowerCase())
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

  // Export template function
  const handleExportTemplate = () => {
    const templateData = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91-9876543210',
        department: 'Engineering',
        position: 'Software Engineer',
        join_date: '2024-01-15',
        status: 'active',
        reporting_manager: 'Jane Smith',
        employee_id: 'EMP001',
        salary: '75000',
        cost_to_hire: '50000',
        probation_status: 'ongoing',
        source: 'LinkedIn'
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Template');
    XLSX.writeFile(wb, 'employee_import_template.xlsx');
  };

  // Validate import data
  const validateImportData = (data: any[]): { valid: any[], errors: string[] } => {
    const valid: any[] = [];
    const errors: string[] = [];
    
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because Excel is 1-indexed and we have header
      const rowErrors: string[] = [];
      
      // Required field validations - only name is required
      if (!row.name || row.name.trim() === '') {
        rowErrors.push('Name is required');
      }
      
      // Email validation - only if provided
      if (row.email && row.email.trim() !== '') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          rowErrors.push('Invalid email format');
        }
      }
      
      // Department and position are optional - no validation required
      
      // Check for duplicate emails - only if email is provided
      if (row.email && row.email.trim() !== '') {
        const existingEmails = employees.map(emp => emp.email?.toLowerCase()).filter(Boolean);
        if (existingEmails.includes(row.email.toLowerCase())) {
          rowErrors.push('Email already exists in database');
        }
        
        // Check for duplicate emails within import data
        const importEmails = data.slice(0, index).map(r => r.email?.toLowerCase()).filter(Boolean);
        if (importEmails.includes(row.email.toLowerCase())) {
          rowErrors.push('Duplicate email within import file');
        }
      }
      
      // Date validation and Excel date conversion
      if (row.join_date) {
        let joinDate: Date;
        
        // Check if it's an Excel date serial number (numeric value)
        if (typeof row.join_date === 'number' || !isNaN(Number(row.join_date))) {
          const excelDateNumber = Number(row.join_date);
          
          // Excel date serial numbers start from 1 (January 1, 1900)
          // Valid range: 1 to 2958465 (December 31, 9999)
          if (excelDateNumber >= 1 && excelDateNumber <= 2958465) {
            // Convert Excel date serial number to JavaScript Date
            // Excel uses 1900-01-01 as day 1, but has a leap year bug
            // We need to adjust for this
            const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
            const daysToAdd = excelDateNumber - 1; // Subtract 1 because Excel day 1 is 1900-01-01
            
            // Adjust for Excel's leap year bug (it incorrectly treats 1900 as leap year)
            let adjustedDaysToAdd = daysToAdd;
            if (excelDateNumber > 60) {
              adjustedDaysToAdd -= 1;
            }
            
            joinDate = new Date(excelEpoch.getTime() + adjustedDaysToAdd * 24 * 60 * 60 * 1000);
          } else {
            rowErrors.push('Invalid Excel date serial number');
            return;
          }
        } else {
          // Try to parse as regular date string
          joinDate = new Date(row.join_date);
        }
        
        if (isNaN(joinDate.getTime())) {
          rowErrors.push('Invalid join date format (use YYYY-MM-DD or Excel date)');
        } else {
          // Check if date is not in the future
          const today = new Date();
          today.setHours(23, 59, 59, 999); // End of today
          if (joinDate > today) {
            rowErrors.push('Join date cannot be in the future');
          }
        }
      }
      
      // Salary validation
      if (row.salary) {
        const salary = Number(row.salary);
        if (isNaN(salary)) {
          rowErrors.push('Salary must be a valid number');
        } else if (salary < 0) {
          rowErrors.push('Salary cannot be negative');
        } else if (salary > 10000000) { // 10 million limit
          rowErrors.push('Salary seems too high (max 10,000,000)');
        }
      }
      
      // Cost to hire validation
      if (row.cost_to_hire) {
        const cost = Number(row.cost_to_hire);
        if (isNaN(cost)) {
          rowErrors.push('Cost to hire must be a valid number');
        } else if (cost < 0) {
          rowErrors.push('Cost to hire cannot be negative');
        } else if (cost > 1000000) { // 1 million limit
          rowErrors.push('Cost to hire seems too high (max 1,000,000)');
        }
      }
      
      // Status validation
      if (row.status && !['active', 'inactive', 'terminated', 'resigned'].includes(row.status?.toLowerCase())) {
        rowErrors.push('Status must be one of: active, inactive, terminated, resigned');
      }
      
      // Probation status validation
      if (row.probation_status && !['ongoing', 'completed'].includes(row.probation_status?.toLowerCase())) {
        rowErrors.push('Probation status must be either "ongoing" or "completed"');
      }
      
      // Phone validation (basic format check)
      if (row.phone && row.phone.trim() !== '') {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
        if (!phoneRegex.test(row.phone.trim())) {
          rowErrors.push('Phone number format is invalid');
        }
      }
      
      if (rowErrors.length > 0) {
        errors.push(`Row ${rowNumber}: ${rowErrors.join(', ')}`);
      } else {
        valid.push(row);
      }
    });
    
    return { valid, errors };
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // File format validation
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload an Excel file (.xlsx or .xls)',
        variant: 'destructive'
      });
      return;
    }
    
    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 10MB',
        variant: 'destructive'
      });
      return;
    }
    
    setImportFile(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('No file data received');
        }
        
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('No sheets found in the Excel file');
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          throw new Error('Unable to read the first sheet');
        }
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (!jsonData || jsonData.length === 0) {
          toast({
            title: 'Empty file',
            description: 'The uploaded file contains no data',
            variant: 'destructive'
          });
          return;
        }
        
        // Ensure all rows have the required structure - only name is required
        const processedData = jsonData.map((row: any) => ({
          name: row.name || row.Name || '',
          email: row.email || row.Email || '',
          phone: row.phone || row.Phone || '',
          department: row.department || row.Department || '',
          position: row.position || row.Position || '',
          join_date: row.join_date || row['join_date'] || row['Join Date'] || '',
          status: row.status || row.Status || 'active',
          reporting_manager: row.reporting_manager || row['reporting_manager'] || row['Reporting Manager'] || '',
          employee_id: row.employee_id || row['employee_id'] || row['Employee ID'] || '',
          salary: row.salary || row.Salary || '',
          cost_to_hire: row.cost_to_hire || row['cost_to_hire'] || row['Cost to Hire'] || '',
          probation_status: row.probation_status || row['probation_status'] || row['Probation Status'] || 'ongoing',
          source: row.source || row.Source || ''
        }));
        
        setImportData(processedData);
        setImportPreview(processedData.slice(0, 5)); // Show first 5 rows as preview
        setShowImportPreview(true);
        
        // Validate the data
        const { valid, errors } = validateImportData(processedData);
        setImportErrors(errors);
        
        if (errors.length > 0) {
          toast({
            title: 'Validation errors found',
            description: `${errors.length} error(s) found. Please review and fix them.`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'File uploaded successfully',
            description: `${valid.length} valid records found`,
            variant: 'default'
          });
        }
      } catch (error: any) {
        console.error('File reading error:', error);
        toast({
          title: 'Error reading file',
          description: error.message || 'Unable to read the uploaded file. Please ensure it\'s a valid Excel file.',
          variant: 'destructive'
        });
        // Reset state on error
        setImportFile(null);
        setImportData([]);
        setImportErrors([]);
        setImportPreview([]);
        setShowImportPreview(false);
      }
    };
    
    reader.onerror = () => {
      toast({
        title: 'File reading error',
        description: 'Failed to read the uploaded file',
        variant: 'destructive'
      });
      setImportFile(null);
      setImportData([]);
      setImportErrors([]);
      setImportPreview([]);
      setShowImportPreview(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Process import
  const handleProcessImport = async () => {
    if (importErrors.length > 0) {
      toast({
        title: 'Cannot proceed with errors',
        description: 'Please fix all validation errors before importing',
        variant: 'destructive'
      });
      return;
    }
    
    setIsProcessingImport(true);
    
    try {
      const { valid } = validateImportData(importData);
      
      if (valid.length === 0) {
        toast({
          title: 'No valid data to import',
          description: 'All records have validation errors',
          variant: 'destructive'
        });
        return;
      }
      
      // Prepare data for insertion - only name is required, others are optional
      const insertData = valid.map(row => {
        // Convert Excel date serial number to proper date format
        let processedJoinDate = null;
        if (row.join_date) {
          if (typeof row.join_date === 'number' || !isNaN(Number(row.join_date))) {
            const excelDateNumber = Number(row.join_date);
            if (excelDateNumber >= 1 && excelDateNumber <= 2958465) {
              // Convert Excel date serial number to JavaScript Date
              const excelEpoch = new Date(1900, 0, 1);
              let daysToAdd = excelDateNumber - 1;
              
              // Adjust for Excel's leap year bug
              if (excelDateNumber > 60) {
                daysToAdd -= 1;
              }
              
              const convertedDate = new Date(excelEpoch.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
              processedJoinDate = convertedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            }
          } else {
            // Try to parse as regular date string
            const parsedDate = new Date(row.join_date);
            if (!isNaN(parsedDate.getTime())) {
              processedJoinDate = parsedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            }
          }
        }

        return {
          name: row.name?.trim() || '',
          email: row.email?.trim() ? row.email.trim().toLowerCase() : null,
          phone: row.phone?.trim() || null,
          department: row.department?.trim() || null,
          position: row.position?.trim() || null,
          join_date: processedJoinDate,
          status: row.status?.trim() || 'active',
          reporting_manager: row.reporting_manager?.trim() || null,
          employee_id: row.employee_id?.trim() || null,
          salary: row.salary ? Number(row.salary) : null,
          cost_to_hire: row.cost_to_hire ? Number(row.cost_to_hire) : null,
          probation_status: row.probation_status?.trim() || 'ongoing',
          source: row.source?.trim() || null,
        };
      });
      
      // Insert data into database
      const { error } = await supabase
        .from('employees')
        .insert(insertData);
      
      if (error) {
        throw error;
      }
      
      // Reset import state
      setImportFile(null);
      setImportData([]);
      setImportErrors([]);
      setImportPreview([]);
      setShowImportPreview(false);
      setIsImportDialogOpen(false);
      
      // Refresh employees list
      refreshEmployees();
      
      toast({
        title: 'Import successful',
        description: `${valid.length} employees imported successfully`,
        variant: 'default'
      });
      
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error.message || 'An error occurred during import',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingImport(false);
    }
  };

  // Reset import
  const handleResetImport = () => {
    setImportFile(null);
    setImportData([]);
    setImportErrors([]);
    setImportPreview([]);
    setShowImportPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          cost_to_hire: createForm.costToHire ? Number(createForm.costToHire) : null,
          probation_status: createForm.probationStatus,
          source: sourceValue,
        },
      ]);
    if (!error) {
      setIsCreateDialogOpen(false);
      setCreateForm({
        name: '', email: '', phone: '', department: '', position: '', joinDate: '', status: 'active', reportingManager: '', employeeId: '', salary: '', costToHire: '', probationStatus: 'ongoing', source: '',
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
      id, name, email, phone, department, position, joinDate, status, reportingManager, employeeId, salary, costToHire, probationStatus, performanceRating, source
    } = editForm;
    const updateSourceValue =
      editForm.sourceType === 'recruitment-agency' ? `Recruitment Agency - ${editAgencyName}` :
      editForm.sourceType === 'other' ? `Other - ${editOtherSource}` :
      editForm.sourceType ? toProperCase(editForm.sourceType.replace(/-/g, ' ')) : '';
    const updateFields = {
      name,
      email,
      phone,
      department,
      position,
      join_date: joinDate || null,
      status,
      reporting_manager: reportingManager || null,
      employee_id: employeeId || null,
      salary: salary ? Number(salary) : null,
      cost_to_hire: costToHire ? Number(costToHire) : null,
      probation_status: probationStatus || null,
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
        costToHire: '',
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
    <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
      {/* Search bar remains above the table container */}
      <div className="w-full flex flex-wrap gap-2 items-center mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search employees..."
          className="border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm flex-1 min-w-[180px] max-w-xs focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm bg-white dark:bg-slate-700"
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
          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded shadow text-sm font-medium border border-slate-300 dark:border-slate-600 transition-colors"
        >
          Clear Filters
        </button>
        <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-sm font-medium border border-blue-200 dark:border-blue-800">
          Employees: {filteredEmployees.length}
        </span>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleExportTemplate}
            className="px-4 py-1 bg-green-500 hover:bg-green-600 text-white rounded shadow text-sm font-medium flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Template
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded shadow text-sm font-medium flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setIsImportDialogOpen(true)}
            className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded shadow text-sm font-medium flex items-center gap-1"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            + Create Employee
          </Button>
        </div>
      </div>
      {/* Table container with filters inside */}
      <div className="mt-2">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <CardContent>
            {/* Filters inside table container, above the table */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-5 gap-3 items-center mb-4 px-1 pt-4">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                placeholder="dd-----yyyy"
                className="border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm w-full h-10 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              />
              
              {/* Department Filter */}
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'department' ? null : 'department')}
                  className="w-full h-10 px-3 py-2 text-sm text-left border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400 bg-white dark:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-between"
                >
                  <span>{filterDepartment || 'Department'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === 'department' && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    <div
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white ${filterDepartment === '' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : ''}`}
                      onClick={() => {
                        setFilterDepartment('');
                        setOpenDropdown(null);
                      }}
                    >
                      Department
                    </div>
                    {departmentOptionsFiltered.map(opt => (
                      <div
                        key={opt}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white ${filterDepartment === opt ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : ''}`}
                        onClick={() => {
                          setFilterDepartment(opt);
                          setOpenDropdown(null);
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Designation Filter */}
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'designation' ? null : 'designation')}
                  className="w-full h-10 px-3 py-2 text-sm text-left border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400 bg-white dark:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-between"
                >
                  <span>{filterDesignation || 'Designation'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === 'designation' && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    <div
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white ${filterDesignation === '' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : ''}`}
                      onClick={() => {
                        setFilterDesignation('');
                        setOpenDropdown(null);
                      }}
                    >
                      Designation
                    </div>
                    {designationOptionsFiltered.map(opt => (
                      <div
                        key={opt}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white ${filterDesignation === opt ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : ''}`}
                        onClick={() => {
                          setFilterDesignation(opt);
                          setOpenDropdown(null);
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manager Filter */}
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'manager' ? null : 'manager')}
                  className="w-full h-10 px-3 py-2 text-sm text-left border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400 bg-white dark:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-between"
                >
                  <span>{filterManager || 'Manager'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === 'manager' && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    <div
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white ${filterManager === '' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : ''}`}
                      onClick={() => {
                        setFilterManager('');
                        setOpenDropdown(null);
                      }}
                    >
                      Manager
                    </div>
                    {managerOptionsFiltered.map(opt => (
                      <div
                        key={opt}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white ${filterManager === opt ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : ''}`}
                        onClick={() => {
                          setFilterManager(opt);
                          setOpenDropdown(null);
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                  className="w-full h-10 px-3 py-2 text-sm text-left border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400 bg-white dark:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-between"
                >
                  <span>{filterStatus || 'Status'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === 'status' && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    <div
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white ${filterStatus === '' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : ''}`}
                      onClick={() => {
                        setFilterStatus('');
                        setOpenDropdown(null);
                      }}
                    >
                      Status
                    </div>
                    {statusOptionsFiltered.map(opt => (
                      <div
                        key={opt}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 text-slate-800 dark:text-white ${filterStatus === opt ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : ''}`}
                        onClick={() => {
                          setFilterStatus(opt);
                          setOpenDropdown(null);
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 w-full overflow-x-auto overflow-y-auto max-h-[60vh] border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
              <Table className="w-full min-w-[1200px] border border-gray-200 dark:border-slate-700">
                <TableHeader className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 shadow-sm dark:shadow-slate-900/50 border-t border-slate-200 dark:border-slate-600">
                  <TableRow>
                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 min-w-[150px] border-r border-slate-200 dark:border-slate-600 whitespace-nowrap text-sm font-semibold text-slate-700 dark:text-slate-200">EMP ID</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[200px] min-w-[200px] max-w-[200px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Name</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[150px] min-w-[150px] max-w-[150px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Department</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[150px] min-w-[150px] max-w-[150px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Designation</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Joining Date</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Salary</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Cost to Hire</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[150px] min-w-[150px] max-w-[150px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Manager</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[150px] min-w-[150px] max-w-[150px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Application Source</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[100px] min-w-[100px] max-w-[100px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Status</TableHead>
                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[120px] min-w-[120px] max-w-[120px] text-sm font-semibold text-slate-700 dark:text-slate-200">All Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white dark:bg-slate-800">
                  {filteredEmployees.map(emp => (
                    <TableRow key={emp.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300">
                      <TableCell className="min-w-[150px] border-r border-slate-200 dark:border-slate-700 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{emp.employeeId || '-'}</TableCell>
                      <TableCell className="w-[200px] min-w-[200px] max-w-[200px] border-r border-slate-200 dark:border-slate-700 text-sm font-medium break-words leading-tight text-slate-900 dark:text-white">{emp.name}</TableCell>
                      <TableCell className="w-[150px] min-w-[150px] max-w-[150px] border-r border-slate-200 dark:border-slate-700 text-sm break-words leading-tight text-slate-900 dark:text-white">{emp.department || '-'}</TableCell>
                      <TableCell className="w-[150px] min-w-[150px] max-w-[150px] border-r border-slate-200 dark:border-slate-700 text-sm break-words leading-tight text-slate-900 dark:text-white">{emp.position || '-'}</TableCell>
                      <TableCell className="w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-700 text-sm break-words leading-tight text-slate-900 dark:text-white">{formatDate(emp.joinDate)}</TableCell>
                      <TableCell className="w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-700 text-sm break-words leading-tight text-slate-900 dark:text-white">{emp.salary ? formatSalary(emp.salary) : '-'}</TableCell>
                      <TableCell className="w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-700 text-sm break-words leading-tight text-slate-900 dark:text-white">{emp.costToHire ? formatSalary(emp.costToHire) : '-'}</TableCell>
                      <TableCell className="w-[150px] min-w-[150px] max-w-[150px] border-r border-slate-200 dark:border-slate-700 text-sm break-words leading-tight text-slate-900 dark:text-white">{emp.reportingManager || '-'}</TableCell>
                      <TableCell className="w-[150px] min-w-[150px] max-w-[150px] border-r border-slate-200 dark:border-slate-700 text-sm break-words leading-tight text-slate-900 dark:text-white">{toProperCase(emp.source) || '-'}</TableCell>
                      <TableCell className="w-[100px] min-w-[100px] max-w-[100px] border-r border-slate-200 dark:border-slate-700 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emp.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 
                          emp.status === 'inactive' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' : 
                          'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200'
                        }`}>
                          {emp.status}
                        </span>
                      </TableCell>
                      <TableCell className="w-[120px] min-w-[120px] max-w-[120px]">
                        <div className="flex items-center space-x-1">
                        <button onClick={() => setModalEmployee(emp)} className="p-2 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                          <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </button>
                          <button onClick={() => handleEditEmployee(emp)} className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                          <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
        <DialogContent className="max-w-5xl w-full max-h-[80vh] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 border-0 shadow-2xl rounded-xl">
          {modalEmployee && (
            <div className="space-y-4">
              {/* Modal Header */}
                              <div className="p-6 border-b border-amber-200 dark:border-amber-600 bg-white/80 dark:bg-slate-800/80 rounded-t-xl">
                <div className="flex items-center space-x-4">
                                      <div className="w-14 h-14 bg-amber-600 dark:bg-slate-700 rounded-lg flex items-center justify-center shadow-lg">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{modalEmployee.name}</h2>
                      <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-600 text-xs">
                        {modalEmployee.employeeId}
                      </Badge>
                      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-600 text-xs">
                        Probation
                      </Badge>
                    </div>
                    <p className="text-lg text-blue-600 dark:text-blue-400 font-medium mb-2">{modalEmployee.position} - {modalEmployee.department}</p>
                    <div className="grid grid-cols-4 gap-4 text-sm text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="font-medium text-xs">Manager:</span>
                        <p className="text-sm">{modalEmployee.reportingManager || 'Sarah Wilson'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-xs">Join Date:</span>
                        <p className="text-sm">{formatDate(modalEmployee.joinDate)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-xs">Email:</span>
                        <p className="text-sm">{modalEmployee.email}</p>
                      </div>
                      <div>
                        <span className="font-medium text-xs">Salary:</span>
                        <p className="text-sm">{modalEmployee.salary ? formatSalary(modalEmployee.salary) : '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          {/* Compact Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-600 h-10">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-800 dark:data-[state=active]:text-amber-300 text-xs text-slate-700 dark:text-slate-300">Overview</TabsTrigger>
                                      <TabsTrigger value="actions" className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-800 dark:data-[state=active]:text-amber-300 text-xs text-slate-700 dark:text-slate-300">Actions</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Card className="professional-card dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Employee ID</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{modalEmployee.employeeId}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="professional-card dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center">
                        <Building className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Department</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{modalEmployee.department}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="professional-card dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-md flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Join Date</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{formatDate(modalEmployee.joinDate)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="professional-card dark:bg-slate-800 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-md flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Salary</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{modalEmployee.salary ? formatSalary(modalEmployee.salary) : '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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


          </Tabs>
        </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Create New Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEmployee} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                <input className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                <input className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                <input className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <input className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={createForm.department} onChange={e => setCreateForm({ ...createForm, department: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Position</label>
                <input className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={createForm.position} onChange={e => setCreateForm({ ...createForm, position: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Join Date</label>
                <input type="date" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={createForm.joinDate} onChange={e => setCreateForm({ ...createForm, joinDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reporting Manager</label>
                <input className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={createForm.reportingManager} onChange={e => setCreateForm({ ...createForm, reportingManager: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee ID</label>
                <input className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={createForm.employeeId} onChange={e => setCreateForm({ ...createForm, employeeId: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Salary</label>
                <input type="number" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={createForm.salary} onChange={e => setCreateForm({ ...createForm, salary: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cost to Hire</label>
                <input type="number" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={createForm.costToHire} onChange={e => setCreateForm({ ...createForm, costToHire: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Application Source</label>
                <Select
                  value={createForm.source}
                  onValueChange={value => {
                    setCreateForm({ ...createForm, source: value });
                    setCreateAgencyName('');
                    setCreateOtherSource('');
                  }}
                  required
                >
                  <SelectTrigger className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                    <SelectItem value="referral" className="text-slate-900 dark:text-slate-100">Employee Referral</SelectItem>
                    <SelectItem value="linkedin" className="text-slate-900 dark:text-slate-100">LinkedIn</SelectItem>
                    <SelectItem value="indeed" className="text-slate-900 dark:text-slate-100">Indeed</SelectItem>
                    <SelectItem value="company-website" className="text-slate-900 dark:text-slate-100">Company Website</SelectItem>
                    <SelectItem value="recruitment-agency" className="text-slate-900 dark:text-slate-100">Recruitment Agency</SelectItem>
                    <SelectItem value="job-fair" className="text-slate-900 dark:text-slate-100">Job Fair</SelectItem>
                    <SelectItem value="other" className="text-slate-900 dark:text-slate-100">Other</SelectItem>
                  </SelectContent>
                </Select>
                {createForm.source === 'recruitment-agency' && (
                  <input
                    className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 mt-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400"
                    placeholder="Name of Recruitment Agency"
                    value={createAgencyName}
                    onChange={e => setCreateAgencyName(e.target.value)}
                  />
                )}
                {createForm.source === 'other' && (
                  <input
                    className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 mt-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400"
                    placeholder="Please specify"
                    value={createOtherSource}
                    onChange={e => setCreateOtherSource(e.target.value)}
                  />
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} type="button" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</Button>
                              <Button type="submit" className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-slate-900 dark:text-slate-100">Edit Employee</DialogTitle>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleUpdateEmployee} className="flex flex-col h-full">
              <div className="overflow-y-auto max-h-[50vh] pr-2 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                  <input type="email" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={editForm.department || ''} onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Position</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={editForm.position || ''} onChange={e => setEditForm({ ...editForm, position: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Join Date</label>
                  <input type="date" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={editForm.joinDate || ''} onChange={e => setEditForm({ ...editForm, joinDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={editForm.status || 'active'} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                    <option value="resigned">Resigned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Probation Status</label>
                  <select className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={editForm.probationStatus || 'ongoing'} onChange={e => setEditForm({ ...editForm, probationStatus: e.target.value })}>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reporting Manager</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={editForm.reportingManager || ''} onChange={e => setEditForm({ ...editForm, reportingManager: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee ID</label>
                  <input className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={editForm.employeeId || ''} onChange={e => setEditForm({ ...editForm, employeeId: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Salary</label>
                  <input type="number" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={editForm.salary || ''} onChange={e => setEditForm({ ...editForm, salary: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cost to Hire</label>
                  <input type="number" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={editForm.costToHire || ''} onChange={e => setEditForm({ ...editForm, costToHire: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Performance Rating</label>
                  <select className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400" value={editForm.performanceRating || ''} onChange={e => setEditForm({ ...editForm, performanceRating: e.target.value })}>
                    <option value="">Select Rating</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Below Average">Below Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Application Source</label>
                  <Select
                    value={editForm?.sourceType || ''}
                    onValueChange={value => {
                      setEditForm({ ...editForm, sourceType: value });
                      setEditAgencyName('');
                      setEditOtherSource('');
                    }}
                  >
                    <SelectTrigger className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                      <SelectItem value="referral" className="text-slate-900 dark:text-slate-100">Employee Referral</SelectItem>
                      <SelectItem value="linkedin" className="text-slate-900 dark:text-slate-100">LinkedIn</SelectItem>
                      <SelectItem value="indeed" className="text-slate-900 dark:text-slate-100">Indeed</SelectItem>
                      <SelectItem value="company-website" className="text-slate-900 dark:text-slate-100">Company Website</SelectItem>
                      <SelectItem value="recruitment-agency" className="text-slate-900 dark:text-slate-100">Recruitment Agency</SelectItem>
                      <SelectItem value="job-fair" className="text-slate-900 dark:text-slate-100">Job Fair</SelectItem>
                      <SelectItem value="other" className="text-slate-900 dark:text-slate-100">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {editForm?.sourceType === 'recruitment-agency' && (
                    <input
                      className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 mt-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400"
                      placeholder="Name of Recruitment Agency"
                      value={editAgencyName}
                      onChange={e => setEditAgencyName(e.target.value)}
                    />
                  )}
                  {editForm?.sourceType === 'other' && (
                    <input
                      className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 mt-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400"
                      placeholder="Please specify"
                      value={editOtherSource}
                      onChange={e => setEditOtherSource(e.target.value)}
                    />
                  )}
                </div>
              </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700 mt-4 flex-shrink-0">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} type="button" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</Button>
                <Button type="submit" className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white">Update</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Employees
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Download the template using the "Template" button above</li>
                <li>Fill in the employee data following the template format</li>
                <li>Save the file as Excel (.xlsx or .xls)</li>
                <li>Upload the file here to import employees</li>
                <li>Review any validation errors and fix them in your file</li>
                <li>Click "Import" to add the employees to the database</li>
              </ol>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Excel File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {importFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{importFile.name}</span>
                  <span>({(importFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {/* Validation Errors */}
            {importErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Validation Errors ({importErrors.length}):</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importErrors.map((error, index) => (
                        <div key={index} className="text-sm bg-red-50 p-2 rounded border border-red-200">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Import Preview */}
            {showImportPreview && importPreview.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Data Preview (First 5 rows):</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.name || '-'}</TableCell>
                          <TableCell>{row.email || '-'}</TableCell>
                          <TableCell>{row.department || '-'}</TableCell>
                          <TableCell>{row.position || '-'}</TableCell>
                          <TableCell>{row.join_date || '-'}</TableCell>
                          <TableCell>{row.status || 'active'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {importData.length > 5 && (
                  <p className="text-sm text-gray-600">
                    ... and {importData.length - 5} more rows
                  </p>
                )}
              </div>
            )}

            {/* Summary */}
            {importData.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Import Summary:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Records:</span>
                    <span className="ml-2 text-gray-600">{importData.length}</span>
                  </div>
                  <div>
                    <span className="font-medium">Valid Records:</span>
                    <span className="ml-2 text-green-600">{importData.length - importErrors.length}</span>
                  </div>
                  <div>
                    <span className="font-medium">Errors:</span>
                    <span className="ml-2 text-red-600">{importErrors.length}</span>
                  </div>
                  <div>
                    <span className="font-medium">Can Import:</span>
                    <span className="ml-2 text-blue-600">
                      {importErrors.length === 0 ? 'Yes' : 'No (fix errors first)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleResetImport}
                disabled={isProcessingImport}
              >
                Reset
              </Button>
              <Button
                onClick={handleProcessImport}
                disabled={isProcessingImport || importErrors.length > 0 || importData.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessingImport ? 'Importing...' : 'Import Employees'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeManagement;
