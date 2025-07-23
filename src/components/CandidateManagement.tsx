import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Users, Plus, Search, History, Edit, Eye } from 'lucide-react';
import CandidateStatusHistory from './CandidateStatusHistory';
import FileUpload from './FileUpload';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';

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
  remark: string;
  resumeUploaded: boolean;
  resumeFile: File | null;
  interviewStatus: string;
  appliedDate: string;
  resume_url?: string;
}

interface StatusChange {
  id: string;
  candidateId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

interface CandidateManagementProps {
  candidates: Candidate[];
  jobs: any[];
  onAddCandidate: (candidate: Omit<Candidate, 'id'> & { resumeFile?: File | null }) => void;
  onUpdateCandidateStatus: (candidateId: string, newStatus: string, reason?: string) => void;
  statusHistory: StatusChange[];
  userEmail: string;
  highlightedCandidate?: string | null;
  onClearHighlight?: () => void;
}

const CandidateManagement: React.FC<CandidateManagementProps> = ({ 
  candidates, 
  jobs, 
  onAddCandidate,
  onUpdateCandidateStatus,
  statusHistory: _statusHistory,
  userEmail,
  highlightedCandidate,
  onClearHighlight
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterNoticePeriod, setFilterNoticePeriod] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [statusFormData, setStatusFormData] = useState({
    newStatus: '',
    reason: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobId: '',
    source: '',
    experience: '',
    expectedSalary: '',
    currentSalary: '',
    noticePeriod: '',
    remark: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeFileType, setResumeFileType] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState('');
  const [otherSource, setOtherSource] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clear highlight when component mounts or highlighted candidate changes
  useEffect(() => {
    if (highlightedCandidate && onClearHighlight) {
      // Scroll to the highlighted row
      const highlightedRow = document.querySelector(`[data-candidate-id="${highlightedCandidate}"]`);
      if (highlightedRow && scrollRef.current) {
        highlightedRow.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      
      // Clear the highlight after the animation completes
      const timer = setTimeout(() => {
        onClearHighlight();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedCandidate, onClearHighlight]);

  useEffect(() => {
    if (isDialogOpen) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        jobId: '',
        source: '',
        experience: '',
        expectedSalary: '',
        currentSalary: '',
        noticePeriod: '',
        remark: '',
      });
      setAgencyName('');
      setOtherSource('');
      setSelectedFile(null);
    }
  }, [isDialogOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedJob = jobs.find(job => job.id === formData.jobId);
    
    const sourceValue =
      formData.source === 'recruitment-agency' ? `Recruitment Agency - ${agencyName}` :
      formData.source === 'other' ? `Other - ${otherSource}` :
      formData.source ? toProperCase(formData.source.replace(/-/g, ' ')) : '';
    
    const newCandidate = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      position: selectedJob?.title || '',
      jobId: formData.jobId,
      source: sourceValue,
      experience: parseInt(formData.experience),
      expectedSalary: parseInt(formData.expectedSalary),
      currentSalary: parseInt(formData.currentSalary),
      noticePeriod: formData.noticePeriod,
      remark: formData.remark,
      resumeUploaded: selectedFile !== null,
      resumeFile: selectedFile,
      interviewStatus: 'applied',
      appliedDate: new Date().toISOString().split('T')[0],
    };

    onAddCandidate(newCandidate);
    
    setFormData({
      name: '',
      email: '',
      phone: '',
      jobId: '',
      source: '',
      experience: '',
      expectedSalary: '',
      currentSalary: '',
      noticePeriod: '',
      remark: '',
    });
    setSelectedFile(null);
    
    setIsDialogOpen(false);
    toast({
      title: "Candidate Added",
      description: "New candidate application has been recorded.",
    });
  };

  const handleStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    onUpdateCandidateStatus(selectedCandidate.id, statusFormData.newStatus, statusFormData.reason);
    
    setStatusFormData({ newStatus: '', reason: '' });
    setSelectedCandidate(null);
    setIsStatusDialogOpen(false);
    
    toast({
      title: "Status Updated",
      description: "Candidate status has been updated successfully.",
    });
  };

  const openStatusDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setStatusFormData({ newStatus: candidate.interviewStatus, reason: '' });
    setIsStatusDialogOpen(true);
  };

  const openHistoryDialog = async (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsHistoryDialogOpen(true);
    // Fetch status history from Supabase
    const { data, error } = await supabase
      .from('candidate_status_history')
      .select('*')
      .eq('candidate_id', candidate.id)
      .order('changed_at', { ascending: false });
    if (!error && data) {
      setHistoryRecords(data.map(record => ({
        id: record.id,
        candidateId: record.candidate_id,
        oldStatus: record.old_status,
        newStatus: record.new_status,
        changedBy: record.changed_by,
        changedAt: record.changed_at,
        reason: record.reason,
      })));
    } else {
      setHistoryRecords([]);
    }
  };

  const handleSeeResume = (candidate: Candidate) => {
    if (candidate.resume_url) {
      setResumeUrl(candidate.resume_url);
      // Determine file type for preview logic
      const ext = candidate.resume_url.split('.').pop()?.toLowerCase();
      setResumeFileType(ext || null);
      setIsResumeDialogOpen(true);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || candidate.interviewStatus === filterStatus;
    const matchesPosition = filterPosition === 'all' || candidate.position === filterPosition;
    const matchesNoticePeriod = filterNoticePeriod === 'all' || candidate.noticePeriod === filterNoticePeriod;
    const matchesDate = !filterDate || candidate.appliedDate === filterDate;
    
    return matchesSearch && matchesStatus && matchesPosition && matchesNoticePeriod && matchesDate;
  });
  // Sort by appliedDate descending (newest to oldest)
  const sortedCandidates = filteredCandidates.sort((a, b) => {
    if (!a.appliedDate) return 1;
    if (!b.appliedDate) return -1;
    return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
  });

  // Context-aware filter options based on sortedCandidates
  const statusOptionsFiltered = Array.from(new Set(sortedCandidates.map(c => c.interviewStatus).filter(Boolean)));
  const positionOptionsFiltered = Array.from(new Set(sortedCandidates.map(c => c.position).filter(Boolean)));
  const noticePeriodOptionsFiltered = Array.from(new Set(sortedCandidates.map(c => c.noticePeriod).filter(Boolean)));

  // Helper to capitalize each word
  const toProperCase = (str) => str ? str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : '';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4 w-full">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2 bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4" />
              <span>Add Candidate</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-800 dark:text-white">Add New Candidate</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-300">
                Enter candidate application details
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 dark:text-slate-200">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-200">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 dark:text-slate-200">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    required
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jobId" className="text-slate-700 dark:text-slate-200">Applied Position *</Label>
                  <Select
                    value={formData.jobId}
                    onValueChange={(value) => setFormData({ ...formData, jobId: value })}
                    required
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select job position" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title} - {job.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="source" className="text-slate-700 dark:text-slate-200">Application Source *</Label>
                  <Select
                    value={formData.source}
                    onValueChange={value => {
                      setFormData({ ...formData, source: value });
                      setAgencyName('');
                      setOtherSource('');
                    }}
                    required
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                      <SelectItem value="referral">Employee Referral</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="indeed">Indeed</SelectItem>
                      <SelectItem value="company-website">Company Website</SelectItem>
                      <SelectItem value="recruitment-agency">Recruitment Agency</SelectItem>
                      <SelectItem value="job-fair">Job Fair</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.source === 'recruitment-agency' && (
                    <input
                      className="w-full border border-slate-200 dark:border-slate-600 rounded p-2 mt-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="Name of Recruitment Agency"
                      value={agencyName}
                      onChange={e => setAgencyName(e.target.value)}
                    />
                  )}
                  {formData.source === 'other' && (
                    <input
                      className="w-full border border-slate-200 dark:border-slate-600 rounded p-2 mt-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="Please specify"
                      value={otherSource}
                      onChange={e => setOtherSource(e.target.value)}
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-slate-700 dark:text-slate-200">Years of Experience *</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="3"
                    required
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currentSalary" className="text-slate-700 dark:text-slate-200">Current Salary *</Label>
                  <Input
                    id="currentSalary"
                    type="number"
                    value={formData.currentSalary}
                    onChange={(e) => setFormData({ ...formData, currentSalary: e.target.value })}
                    placeholder="65000"
                    required
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expectedSalary" className="text-slate-700 dark:text-slate-200">Expected Salary *</Label>
                  <Input
                    id="expectedSalary"
                    type="number"
                    value={formData.expectedSalary}
                    onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                    placeholder="75000"
                    required
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="noticePeriod" className="text-slate-700 dark:text-slate-200">Notice Period *</Label>
                  <Select
                    value={formData.noticePeriod}
                    onValueChange={(value) => setFormData({ ...formData, noticePeriod: value })}
                    required
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select notice period" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="15-days">15 Days</SelectItem>
                      <SelectItem value="1-month">1 Month</SelectItem>
                      <SelectItem value="2-months">2 Months</SelectItem>
                      <SelectItem value="3-months">3 Months</SelectItem>
                      <SelectItem value="negotiable">Negotiable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="remark" className="text-slate-700 dark:text-slate-200">Remarks</Label>
                  <Textarea
                    id="remark"
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    placeholder="Additional notes about the candidate..."
                    rows={3}
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-200">Resume Upload *</Label>
                <FileUpload
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                  accept=".pdf,.doc,.docx"
                  maxSize={5}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  Add Candidate
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search candidates..."
          className="border border-slate-200 dark:border-slate-600 rounded px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm bg-white dark:bg-slate-700"
        />
        <button
          onClick={() => {
            setFilterStatus('all');
            setFilterPosition('all');
            setFilterNoticePeriod('all');
            setFilterDate('');
            setSearchTerm('');
          }}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded shadow text-sm font-medium border border-slate-300 dark:border-slate-600 transition-colors"
        >
          Clear Filters
        </button>
        <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-sm font-medium border border-blue-200 dark:border-blue-800">
          Candidates: {sortedCandidates.length}
        </span>
      </div>

      {/* Table and controls container */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg dark:shadow-xl">
        <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-3 items-center mb-4 px-1">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
              <SelectItem value="all">All Status</SelectItem>
              {statusOptionsFiltered.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPosition} onValueChange={setFilterPosition}>
            <SelectTrigger className="w-full border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <SelectValue placeholder="All Positions" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
              <SelectItem value="all">All Positions</SelectItem>
              {positionOptionsFiltered.map(position => (
                <SelectItem key={position} value={position}>{position}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterNoticePeriod} onValueChange={setFilterNoticePeriod}>
            <SelectTrigger className="w-full border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <SelectValue placeholder="All Notice Periods" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
              <SelectItem value="all">All Notice Periods</SelectItem>
              {noticePeriodOptionsFiltered.map(noticePeriod => (
                <SelectItem key={noticePeriod} value={noticePeriod}>{noticePeriod}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            placeholder="dd-----yyyy"
            className="w-full border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[56vh] w-full block scroll-to-highlight" ref={scrollRef} style={{ WebkitOverflowScrolling: 'touch' }}>
          <Table className="min-w-[1200px] border border-slate-200 dark:border-slate-700">
            <TableHeader className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 shadow-sm dark:shadow-slate-900/50 border-t border-slate-200 dark:border-slate-600">
              <TableRow className="border-b border-slate-200 dark:border-slate-600">
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Candidate</TableHead>
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Position</TableHead>
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Application Source</TableHead>
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Experience</TableHead>
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Current Salary</TableHead>
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Expected Salary</TableHead>
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Notice Period</TableHead>
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Status</TableHead>
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Applied Date</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-200 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white dark:bg-slate-800">
              {sortedCandidates.map((candidate, index) => (
                <TableRow 
                  key={candidate.id} 
                  data-candidate-id={candidate.id}
                  className={`border-b border-slate-200 dark:border-slate-700 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                    highlightedCandidate === candidate.id 
                      ? 'highlight-row bg-amber-50 dark:bg-amber-900/20' 
                      : index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                >
                  <TableCell className="border-r border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{candidate.name}</div>
                      <div className="text-sm text-gray-600 dark:text-slate-400">{candidate.email}</div>
                      <div className="text-sm text-gray-600 dark:text-slate-400">{candidate.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{candidate.position}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{toProperCase(candidate.source) || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{candidate.experience || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{formatCurrency(candidate.currentSalary) || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{formatCurrency(candidate.expectedSalary)}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 capitalize text-slate-900 dark:text-white">{candidate.noticePeriod || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700">
                    <span className={`status-badge ${
                      candidate.interviewStatus === 'applied' ? 'status-pending' :
                      candidate.interviewStatus === 'shortlisted' ? 'status-pending' :
                      candidate.interviewStatus === 'selected' ? 'status-active' : 'status-rejected'
                    }`}>
                      {candidate.interviewStatus}
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    {new Date(candidate.appliedDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openStatusDialog(candidate)}
                        className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openHistoryDialog(candidate)}
                        className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <History className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSeeResume(candidate)}
                        disabled={!candidate.resume_url}
                        title={candidate.resume_url ? 'View Resume' : 'No resume available'}
                        className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {sortedCandidates.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-slate-300">No candidates found</p>
          </div>
        )}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">Update Candidate Status</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
              Change the status of {selectedCandidate?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newStatus" className="text-slate-700 dark:text-slate-200">New Status *</Label>
              <Select
                value={statusFormData.newStatus}
                onValueChange={(value) => setStatusFormData({ ...statusFormData, newStatus: value })}
                required
              >
                <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="interviewed">Interviewed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-slate-700 dark:text-slate-200">Reason for change</Label>
              <Textarea
                id="reason"
                value={statusFormData.reason}
                onChange={(e) => setStatusFormData({ ...statusFormData, reason: e.target.value })}
                placeholder="Enter reason for status change..."
                rows={3}
                className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
                className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                Update Status
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">Status History - {selectedCandidate?.name}</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <CandidateStatusHistory 
              candidateId={selectedCandidate.id}
              statusHistory={historyRecords}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Resume Preview Dialog */}
      <Dialog open={isResumeDialogOpen} onOpenChange={setIsResumeDialogOpen}>
        <DialogContent className="w-[98vw] max-w-[1200px] h-[90vh] p-2 sm:p-4 flex flex-col justify-between">
          <DialogHeader>
            <DialogTitle>Resume Preview</DialogTitle>
          </DialogHeader>
          {resumeUrl ? (
            <div className="flex-1 flex flex-col min-h-0">
              {resumeFileType === 'pdf' ? (
                <div className="flex-1 min-h-0">
                  <iframe
                    src={resumeUrl}
                    title="Resume PDF Preview"
                    className="w-full h-full min-h-[70vh] border rounded"
                    style={{ minHeight: '70vh', height: '100%' }}
                  />
                </div>
              ) : resumeFileType === 'doc' || resumeFileType === 'docx' ? (
                <div className="flex flex-col items-center justify-center flex-1 min-h-0">
                  <p className="text-gray-600 mb-4">This file type cannot be previewed directly.</p>
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Open Resume in new tab
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 min-h-0">
                  <p className="text-gray-600 mb-4">Cannot preview this file type.</p>
                  <a 
                    href={resumeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 underline"
                  >
                    Download Resume
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">Resume is not present.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateManagement;
