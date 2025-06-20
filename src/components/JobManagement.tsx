import React, { useState } from 'react';
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
  jobId: string;
  source: string;
  experience: number;
  expectedSalary: number;
  currentSalary: number;
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
            <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              <span>Create New Job</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingJob ? 'Update Job' : 'Create New Job Opening'}</DialogTitle>
              <DialogDescription>
                Fill in the details for the new job position
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Human Resources">Human Resources</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Senior Level"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Mumbai"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="roleType">Role Type</Label>
                  <Select
                    value={formData.roleType}
                    onValueChange={(value) => setFormData({ ...formData, roleType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Old">Old</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vacancies">Number of Vacancies *</Label>
                  <Input
                    id="vacancies"
                    type="number"
                    min="1"
                    value={formData.vacancies}
                    onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
                    placeholder="1"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Minimum Salary *</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                    placeholder="80000"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Maximum Salary *</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                    placeholder="120000"
                    required
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="openDate">Job Open Date *</Label>
                  <Input
                    id="openDate"
                    type="date"
                    value={formData.openDate}
                    onChange={(e) => setFormData({ ...formData, openDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={4}
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
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                    <div className="flex space-x-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {job.status === 'active' ? 'Active' : job.status}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {job.roleType || 'Open'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500 block">Department</span>
                      <span className="font-medium flex items-center">
                        <Briefcase className="w-4 h-4 mr-1" />
                        {job.department}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Location</span>
                      <span className="font-medium flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location || 'Mumbai'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Vacancies</span>
                      <span className="font-medium flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {job.vacancies}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Applications</span>
                      <span className="font-medium text-blue-600">
                        {job.applications ?? 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="text-gray-500">Salary Range:</span>
                      <span className="ml-2 font-medium">
                        ₹{formatINR(job.salaryMin)} - ₹{formatINR(job.salaryMax)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Posted on:</span>
                      <span className="ml-2 font-medium">
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
                    className="flex items-center space-x-1"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewApplications(job.id)}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Applications</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadJD(job.id)}
                    className="flex items-center space-x-1"
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
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="text-gray-600 mb-2">No Jobs Created Yet</CardTitle>
            <CardDescription>
              Create your first job opening to start the recruitment process
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Applications Dialog */}
      <Dialog open={isApplicationsDialogOpen} onOpenChange={setIsApplicationsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Applications for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              View all candidates who have applied for this position
            </DialogDescription>
          </DialogHeader>
          <div className="relative" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="sticky top-0 bg-white z-10 shadow">
                  <TableHead>Candidate</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Notice Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{candidate.name}</div>
                        <div className="text-sm text-gray-500">{candidate.position}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{candidate.email}</div>
                        <div className="text-sm text-gray-500">{candidate.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{candidate.experience} years</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">Current: ${candidate.currentSalary?.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Expected: ${candidate.expectedSalary?.toLocaleString()}</div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{candidate.noticePeriod}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        candidate.interviewStatus === 'applied' ? 'bg-blue-100 text-blue-800' :
                        candidate.interviewStatus === 'shortlisted' ? 'bg-yellow-100 text-yellow-800' :
                        candidate.interviewStatus === 'selected' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {candidate.interviewStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(candidate.appliedDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {jobCandidates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center text-gray-500">
                        <Users className="w-8 h-8 mb-2" />
                        <p>No applications received yet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobManagement;
