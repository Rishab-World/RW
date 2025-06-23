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
            <Button className="flex items-center space-x-2 professional-button">
              <Plus className="w-4 h-4" />
              <span>Add Candidate</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Candidate</DialogTitle>
              <DialogDescription>
                Enter candidate application details
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    className="professional-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                    className="professional-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    required
                    className="professional-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jobId">Applied Position *</Label>
                  <Select
                    value={formData.jobId}
                    onValueChange={(value) => setFormData({ ...formData, jobId: value })}
                    required
                  >
                    <SelectTrigger className="professional-input">
                      <SelectValue placeholder="Select job position" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title} - {job.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="source">Application Source *</Label>
                  <Select
                    value={formData.source}
                    onValueChange={value => {
                      setFormData({ ...formData, source: value });
                      setAgencyName('');
                      setOtherSource('');
                    }}
                    required
                  >
                    <SelectTrigger className="professional-input">
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
                  {formData.source === 'recruitment-agency' && (
                    <input
                      className="w-full border rounded p-2 mt-2"
                      placeholder="Name of Recruitment Agency"
                      value={agencyName}
                      onChange={e => setAgencyName(e.target.value)}
                    />
                  )}
                  {formData.source === 'other' && (
                    <input
                      className="w-full border rounded p-2 mt-2"
                      placeholder="Please specify"
                      value={otherSource}
                      onChange={e => setOtherSource(e.target.value)}
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="3"
                    required
                    className="professional-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currentSalary">Current Salary *</Label>
                  <Input
                    id="currentSalary"
                    type="number"
                    value={formData.currentSalary}
                    onChange={(e) => setFormData({ ...formData, currentSalary: e.target.value })}
                    placeholder="65000"
                    required
                    className="professional-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expectedSalary">Expected Salary *</Label>
                  <Input
                    id="expectedSalary"
                    type="number"
                    value={formData.expectedSalary}
                    onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                    placeholder="75000"
                    required
                    className="professional-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="noticePeriod">Notice Period *</Label>
                  <Select
                    value={formData.noticePeriod}
                    onValueChange={(value) => setFormData({ ...formData, noticePeriod: value })}
                    required
                  >
                    <SelectTrigger className="professional-input">
                      <SelectValue placeholder="Select notice period" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Label htmlFor="remark">Remarks</Label>
                  <Textarea
                    id="remark"
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    placeholder="Additional notes about the candidate..."
                    rows={3}
                    className="professional-input"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Resume Upload *</Label>
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
                >
                  Cancel
                </Button>
                <Button type="submit" className="professional-button">
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
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-amber-200 text-slate-800 placeholder:text-slate-400 shadow-sm"
        />
        <button
          onClick={() => {
            setFilterStatus('all');
            setFilterPosition('all');
            setFilterNoticePeriod('all');
            setFilterDate('');
            setSearchTerm('');
          }}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded shadow text-sm font-medium border border-slate-300"
        >
          Clear Filters
        </button>
        <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
          Candidates: {sortedCandidates.length}
        </span>
      </div>

      {/* Table and controls container */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-3 items-center mb-4 px-1">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptionsFiltered.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPosition} onValueChange={setFilterPosition}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Positions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {positionOptionsFiltered.map(position => (
                <SelectItem key={position} value={position}>{position}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterNoticePeriod} onValueChange={setFilterNoticePeriod}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Notice Periods" />
            </SelectTrigger>
            <SelectContent>
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
            className="w-full"
          />
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[56vh] w-full block scroll-to-highlight" ref={scrollRef} style={{ WebkitOverflowScrolling: 'touch' }}>
          <Table className="min-w-[1200px] border border-gray-200">
            <TableHeader className="sticky top-0 z-20 bg-white shadow border-t border-gray-200">
              <TableRow className="border-b border-gray-200">
                <TableHead className="border-r border-gray-200">Candidate</TableHead>
                <TableHead className="border-r border-gray-200">Position</TableHead>
                <TableHead className="border-r border-gray-200">Application Source</TableHead>
                <TableHead className="border-r border-gray-200">Experience</TableHead>
                <TableHead className="border-r border-gray-200">Current Salary</TableHead>
                <TableHead className="border-r border-gray-200">Expected Salary</TableHead>
                <TableHead className="border-r border-gray-200">Notice Period</TableHead>
                <TableHead className="border-r border-gray-200">Status</TableHead>
                <TableHead className="border-r border-gray-200">Applied Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCandidates.map((candidate) => (
                <TableRow 
                  key={candidate.id} 
                  data-candidate-id={candidate.id}
                  className={`border-b border-gray-200 transition-all duration-300 ${
                    highlightedCandidate === candidate.id 
                      ? 'highlight-row' 
                      : ''
                  }`}
                >
                  <TableCell className="border-r border-gray-200">
                    <div>
                      <div className="font-medium">{candidate.name}</div>
                      <div className="text-sm text-gray-600">{candidate.email}</div>
                      <div className="text-sm text-gray-600">{candidate.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-gray-200">{candidate.position}</TableCell>
                  <TableCell className="border-r border-gray-200">{toProperCase(candidate.source) || 'N/A'}</TableCell>
                  <TableCell className="border-r border-gray-200">{candidate.experience || 'N/A'}</TableCell>
                  <TableCell className="border-r border-gray-200">₹{candidate.currentSalary?.toLocaleString() || 'N/A'}</TableCell>
                  <TableCell className="border-r border-gray-200">₹{candidate.expectedSalary.toLocaleString()}</TableCell>
                  <TableCell className="border-r border-gray-200 capitalize">{candidate.noticePeriod || 'N/A'}</TableCell>
                  <TableCell className="border-r border-gray-200">
                    <span className={`status-badge ${
                      candidate.interviewStatus === 'applied' ? 'status-pending' :
                      candidate.interviewStatus === 'shortlisted' ? 'status-pending' :
                      candidate.interviewStatus === 'selected' ? 'status-active' : 'status-rejected'
                    }`}>
                      {candidate.interviewStatus}
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-gray-200">
                    {new Date(candidate.appliedDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openStatusDialog(candidate)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openHistoryDialog(candidate)}
                      >
                        <History className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSeeResume(candidate)}
                        disabled={!candidate.resume_url}
                        title={candidate.resume_url ? 'View Resume' : 'No resume available'}
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
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No candidates found</p>
          </div>
        )}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Candidate Status</DialogTitle>
            <DialogDescription>
              Change the status of {selectedCandidate?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newStatus">New Status *</Label>
              <Select
                value={statusFormData.newStatus}
                onValueChange={(value) => setStatusFormData({ ...statusFormData, newStatus: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="interviewed">Interviewed</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for change</Label>
              <Textarea
                id="reason"
                value={statusFormData.reason}
                onChange={(e) => setStatusFormData({ ...statusFormData, reason: e.target.value })}
                placeholder="Enter reason for status change..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Status</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Status History - {selectedCandidate?.name}</DialogTitle>
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
