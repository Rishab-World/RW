import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { FileText, Plus, Edit, Eye, Download, MapPin, Briefcase, Users } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Job {
  id: string;
  title: string;
  department: string;
  designation: string;
  vacancies: number;
  salaryMin: number;
  salaryMax: number;
  openDate: string;
  status: string;
  description: string;
  location?: string;
  roleType?: string;
  applications?: number;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department?: string;
  jobId: string;
  source: string;
  experience: number;
  monthlyYearly?: string;
  expectedSalary: number;
  currentSalary: number;
  remark?: string;
  noticePeriod: string;
  interviewStatus: string;
  appliedDate: string;
}

interface JobManagementProps {
  jobs: Job[];
  onAddJob: (job: Omit<Job, 'id'>) => void;
  onJobUpdated?: () => void;
}

const formatINR = (amount: number | string | undefined) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '-';
  return Number(amount).toLocaleString('en-IN');
};

const JobManagement: React.FC<JobManagementProps> = ({ jobs, onAddJob, onJobUpdated }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApplicationsDialogOpen, setIsApplicationsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobCandidates, setJobCandidates] = useState<Candidate[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    designation: '',
    vacancies: '',
    salaryMin: '',
    salaryMax: '',
    openDate: '',
    description: '',
    location: '',
    roleType: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch department options on component mount
  useEffect(() => {
    fetchDepartmentOptions();
  }, []);

  const fetchDepartmentOptions = async () => {
    try {
      const { data: deptOptions } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('department_name');
      if (deptOptions) setDepartmentOptions(deptOptions);
    } catch (error) {
      console.error('Error fetching department options:', error);
    }
  };

  const addNewDepartment = async () => {
    if (!newDepartmentName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('departments')
        .insert([{ department_name: newDepartmentName.trim() }]);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Department added successfully",
      });
      
      // Refresh department options
      await fetchDepartmentOptions();
      
      setNewDepartmentName('');
      setIsAddingDepartment(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add department",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      designation: job.designation,
      vacancies: job.vacancies.toString(),
      salaryMin: job.salaryMin.toString(),
      salaryMax: job.salaryMax.toString(),
      openDate: job.openDate,
      description: job.description || '',
      location: job.location || '',
      roleType: job.roleType || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJob) {
      setIsUpdating(true);
      await supabase.from('jobs').update({
        title: formData.title,
        department: formData.department,
        designation: formData.designation,
        vacancies: parseInt(formData.vacancies),
        salary_min: parseInt(formData.salaryMin),
        salary_max: parseInt(formData.salaryMax),
        open_date: formData.openDate,
        description: formData.description,
        location: formData.location,
        role_type: formData.roleType,
      }).eq('id', editingJob.id);
      setIsUpdating(false);
      if (typeof onJobUpdated === 'function') onJobUpdated();
    } else {
      const newJob = {
        title: formData.title,
        department: formData.department,
        designation: formData.designation,
        vacancies: parseInt(formData.vacancies),
        salaryMin: parseInt(formData.salaryMin),
        salaryMax: parseInt(formData.salaryMax),
        openDate: formData.openDate,
        status: 'active',
        description: formData.description,
        location: formData.location || 'Mumbai',
        roleType: formData.roleType || 'New',
        applications: 0,
      };
      onAddJob(newJob);
    }
    setFormData({
      title: '',
      department: '',
      designation: '',
      vacancies: '',
      salaryMin: '',
      salaryMax: '',
      openDate: '',
      description: '',
      location: '',
      roleType: '',
    });
    setEditingJob(null);
    setIsDialogOpen(false);
    toast({
      title: editingJob ? 'Job Updated' : 'Job Created',
      description: editingJob ? 'Job has been updated.' : 'New job opening has been successfully created.',
    });
  };

  const handleEdit = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) openEditDialog(job);
  };

  const handleViewApplications = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setIsApplicationsDialogOpen(true);
      
      // Fetch candidates for this job
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('job_id', jobId)
        .order('applied_date', { ascending: false });
      
      if (!error && data) {
        setJobCandidates(data.map(candidate => ({
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          position: candidate.position,
          jobId: candidate.job_id,
          source: candidate.source,
          experience: candidate.experience,
          expectedSalary: candidate.expected_salary,
          currentSalary: candidate.current_salary,
          noticePeriod: candidate.notice_period,
          interviewStatus: candidate.interview_status,
          appliedDate: candidate.applied_date,
        })));
      } else {
        setJobCandidates([]);
        console.error('Error fetching candidates:', error);
      }
    }
  };

  const handleDownloadJD = (jobId: string) => {
    toast({
      title: "Download JD",
      description: "Job description download started.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        {/* Main header removed, description can be moved if needed */}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2 bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4" />
              <span>Create New Job</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-800 dark:text-white">{editingJob ? 'Update Job' : 'Create New Job Opening'}</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-300">
                Fill in the details for the new job position
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-700 dark:text-slate-200">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    required
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-slate-700 dark:text-slate-200">Department *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value })}
                      required
                    >
                      <SelectTrigger className="flex-1 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto">
                        {departmentOptions.map(dept => (
                          <SelectItem key={dept.id} value={dept.department_name}>
                            {dept.department_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={() => setIsAddingDepartment(true)}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="designation" className="text-slate-700 dark:text-slate-200">Designation *</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Senior Level"
                    required
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-slate-700 dark:text-slate-200">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="roleType" className="text-slate-700 dark:text-slate-200">Role Type</Label>
                  <Select
                    value={formData.roleType}
                    onValueChange={(value) => setFormData({ ...formData, roleType: value })}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select role type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Old">Old</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vacancies" className="text-slate-700 dark:text-slate-200">Number of Vacancies *</Label>
                  <Input
                    id="vacancies"
                    type="number"
                    min="1"
                    value={formData.vacancies}
                    onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
                    placeholder="1"
                    required
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salaryMin" className="text-slate-700 dark:text-slate-200">Minimum Salary *</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                    placeholder="80000"
                    required
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salaryMax" className="text-slate-700 dark:text-slate-200">Maximum Salary *</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                    placeholder="120000"
                    required
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="openDate" className="text-slate-700 dark:text-slate-200">Job Open Date *</Label>
                  <Input
                    id="openDate"
                    type="date"
                    value={formData.openDate}
                    onChange={(e) => setFormData({ ...formData, openDate: e.target.value })}
                    required
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 dark:text-slate-200">Job Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={4}
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingJob ? 'Update Job' : 'Create Job'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-md dark:hover:shadow-xl transition-shadow bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                    <div className="flex space-x-2">
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800">
                        {job.status === 'active' ? 'Active' : job.status}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        {job.roleType || 'Open'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500 dark:text-slate-400 block">Department</span>
                      <span className="font-medium flex items-center text-gray-900 dark:text-white">
                        <Briefcase className="w-4 h-4 mr-1" />
                        {job.department}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400 block">Location</span>
                      <span className="font-medium flex items-center text-gray-900 dark:text-white">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location || 'Mumbai'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400 block">Vacancies</span>
                      <span className="font-medium flex items-center text-gray-900 dark:text-white">
                        <Users className="w-4 h-4 mr-1" />
                        {job.vacancies}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400 block">Applications</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {job.applications ?? 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-slate-300 mb-4">
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Salary Range:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        ₹{formatINR(job.salaryMin)} - ₹{formatINR(job.salaryMax)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Posted on:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {new Date(job.openDate).toLocaleDateString('en-US', { 
                          month: 'numeric', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(job.id)}
                    className="flex items-center space-x-1 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewApplications(job.id)}
                    className="flex items-center space-x-1 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Applications</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadJD(job.id)}
                    className="flex items-center space-x-1 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download JD</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <Card className="text-center py-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent>
            <FileText className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
            <CardTitle className="text-gray-600 dark:text-slate-300 mb-2">No Jobs Created Yet</CardTitle>
            <CardDescription className="text-gray-500 dark:text-slate-400">
              Create your first job opening to start the recruitment process
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Applications Dialog */}
      <Dialog open={isApplicationsDialogOpen} onOpenChange={setIsApplicationsDialogOpen}>
        <DialogContent className="max-w-4xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl dark:shadow-black/50">
          <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <DialogTitle className="text-slate-800 dark:text-white text-xl font-semibold">Applications for {selectedJob?.title}</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300 mt-2">
              View all candidates who have applied for this position
            </DialogDescription>
          </DialogHeader>
          <div className="relative bg-slate-50 dark:bg-slate-900 rounded-lg mt-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <Table className="min-w-[900px] bg-white dark:bg-slate-800">
              <TableHeader>
                <TableRow className="sticky top-0 bg-slate-100 dark:bg-slate-700 z-10 shadow-sm dark:shadow-slate-900/50 border-b border-slate-200 dark:border-slate-600">
                  <TableHead className="text-slate-700 dark:text-slate-200 font-semibold py-4">Candidate</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-200 font-semibold py-4">Department</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-200 font-semibold py-4">Contact</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-200 font-semibold py-4">Experience</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-200 font-semibold py-4">Salary Type</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-200 font-semibold py-4">Salary</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-200 font-semibold py-4">Remark</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-200 font-semibold py-4">Notice Period</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-200 font-semibold py-4">Status</TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-200 font-semibold py-4">Applied Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white dark:bg-slate-800">
                {jobCandidates.map((candidate, index) => (
                  <TableRow 
                    key={candidate.id} 
                    className={`border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <TableCell className="py-4">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{candidate.name}</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">{candidate.position}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-900 dark:text-white py-4">{candidate.department || 'N/A'}</TableCell>
                    <TableCell className="py-4">
                      <div>
                        <div className="text-sm text-slate-900 dark:text-white">{candidate.email}</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">{candidate.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-900 dark:text-white py-4">{candidate.experience} years</TableCell>
                    <TableCell className="capitalize text-slate-900 dark:text-white py-4">{candidate.monthlyYearly || 'N/A'}</TableCell>
                    <TableCell className="py-4">
                      <div>
                        <div className="text-sm text-slate-900 dark:text-white">Current: ${candidate.currentSalary?.toLocaleString()}</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">Expected: ${candidate.expectedSalary?.toLocaleString()}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-900 dark:text-white py-4">{candidate.remark || 'N/A'}</TableCell>
                    <TableCell className="capitalize text-slate-900 dark:text-white py-4">{candidate.noticePeriod}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={
                        candidate.interviewStatus === 'applied' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                        candidate.interviewStatus === 'shortlisted' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' :
                        candidate.interviewStatus === 'selected' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800' :
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800'
                      }>
                        {candidate.interviewStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-900 dark:text-white py-4">{new Date(candidate.appliedDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {jobCandidates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center text-gray-500 dark:text-slate-400">
                        <Users className="w-12 h-12 mb-4 text-slate-400 dark:text-slate-500" />
                        <p className="text-lg font-medium">No applications received yet</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">Candidates will appear here once they apply</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Department Dialog */}
      <Dialog open={isAddingDepartment} onOpenChange={setIsAddingDepartment}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">Add New Department</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
              Create a new department for job postings
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            addNewDepartment();
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newDepartmentName" className="text-slate-700 dark:text-slate-200">Department Name</Label>
              <Input
                id="newDepartmentName"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                placeholder="Enter department name"
                required
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddingDepartment(false);
                  setNewDepartmentName('');
                }}
                className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                Add Department
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobManagement;
