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
import { Users, Plus, Search, History, Edit, Eye, Download, Upload, AlertCircle, FileText, Settings } from 'lucide-react';
import CandidateStatusHistory from './CandidateStatusHistory';
import FileUpload from './FileUpload';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  onUpdateCandidate: (updatedCandidate: Candidate) => Promise<void>;
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
  onUpdateCandidate,
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
    monthlyYearly: 'monthly',
    expectedSalary: '',
    currentSalary: '',
    remark: '',
    noticePeriod: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeFileType, setResumeFileType] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState('');
  const [otherSource, setOtherSource] = useState('');
  const [customPosition, setCustomPosition] = useState('');
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isDraftsDialogOpen, setIsDraftsDialogOpen] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [completingDraft, setCompletingDraft] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Import/Export state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const draftDataRef = useRef<any>(null);

  useEffect(() => {
    if (isDialogOpen) {
      // If we have draft data to load, use it instead of resetting
      if (draftDataRef.current) {
        const draft = draftDataRef.current;
        
        // Parse source field to extract the base source and additional info
        let source = '';
        let agencyNameValue = '';
        let otherSourceValue = '';
        
        if (draft.source) {
          if (draft.source.startsWith('Recruitment Agency - ')) {
            source = 'recruitment-agency';
            agencyNameValue = draft.source.replace('Recruitment Agency - ', '');
          } else if (draft.source.startsWith('Other - ')) {
            source = 'other';
            otherSourceValue = draft.source.replace('Other - ', '');
          } else {
            // Convert back to the original format
            source = draft.source.toLowerCase().replace(/\s+/g, '-');
          }
        }
        
        const formDataToSet = {
          name: draft.name || '',
          email: draft.email || '',
          phone: draft.phone || '',
          jobId: draft.custom_position ? 'custom' : (draft.job_id || ''),
          source: source,
          experience: draft.experience?.toString() || '',
          monthlyYearly: draft.monthly_yearly || 'monthly',
          expectedSalary: draft.expected_salary?.toString() || '',
          currentSalary: draft.current_salary?.toString() || '',
          remark: draft.remark || '',
          noticePeriod: draft.notice_period || '',
        };
        
        console.log('Loading draft data in useEffect:', formDataToSet);
        console.log('Setting custom position:', draft.custom_position);
        console.log('Setting is custom position:', !!draft.custom_position);
        
        setFormData(formDataToSet);
        setCustomPosition(draft.custom_position || '');
        setIsCustomPosition(!!draft.custom_position);
        setAgencyName(agencyNameValue);
        setOtherSource(otherSourceValue);
        
        console.log('All form data set, clearing draft data');
        // Clear the draft data after loading
        draftDataRef.current = null;
      } else if (!isEditMode && !completingDraft) {
        // Normal form reset - only if no draft data to load, not in edit mode, and not completing draft
        console.log('Performing normal form reset');
        setFormData({
          name: '',
          email: '',
          phone: '',
          jobId: '',
          source: '',
          experience: '',
          monthlyYearly: 'monthly',
          expectedSalary: '',
          currentSalary: '',
          remark: '',
          noticePeriod: '',
        });
        setAgencyName('');
        setOtherSource('');
        setCustomPosition('');
        setIsCustomPosition(false);
        setSelectedFile(null);
      }
    }
  }, [isDialogOpen, isEditMode, completingDraft]);

  // Load drafts when component mounts
  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      console.log('Fetching drafts for user:', userEmail);
      const { data, error } = await supabase
        .from('candidate_drafts')
        .select('*')
        .eq('created_by', userEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching drafts:', error);
        toast({
          title: "Error",
          description: "Failed to load drafts",
          variant: "destructive",
        });
      } else {
        console.log('Drafts loaded:', data);
        setDrafts(data || []);
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required to save as draft",
        variant: "destructive",
      });
      return;
    }

    // Validate custom position if selected
    if (isCustomPosition && !customPosition.trim()) {
      toast({
        title: "Error",
        description: "Please enter a custom job title",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      const sourceValue =
        formData.source === 'recruitment-agency' ? `Recruitment Agency - ${agencyName}` :
        formData.source === 'other' ? `Other - ${otherSource}` :
        formData.source ? toProperCase(formData.source.replace(/-/g, ' ')) : '';

      const selectedJob = jobs.find(job => job.id === formData.jobId);
      
      const draftData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        position: isCustomPosition ? customPosition : (selectedJob?.title || ''),
        department: selectedJob?.department || null,
        job_id: isCustomPosition ? null : (formData.jobId || null), // Don't save "custom" as job_id
        source: sourceValue || null,
        experience: formData.experience && formData.experience.trim() ? parseInt(formData.experience) : null,
        monthly_yearly: formData.monthlyYearly || 'monthly',
        expected_salary: formData.expectedSalary && formData.expectedSalary.trim() ? parseFloat(formData.expectedSalary) : null,
        current_salary: formData.currentSalary && formData.currentSalary.trim() ? parseFloat(formData.currentSalary) : null,
        remark: formData.remark || null,
        notice_period: formData.noticePeriod || null,
        resume_uploaded: selectedFile !== null,
        custom_position: isCustomPosition ? customPosition : null,
        created_by: userEmail,
      };

      const { error } = await supabase
        .from('candidate_drafts')
        .insert([draftData])
        .select();

      if (error) {
        console.error('Error saving draft:', error);
        toast({
          title: "Error",
          description: "Failed to save draft",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Draft saved successfully",
        });
        setIsDialogOpen(false);
        fetchDrafts();
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft",
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const loadDraft = (draft: any) => {
    console.log('Loading draft:', draft);
    
    // Close drafts dialog first
    setIsDraftsDialogOpen(false);
    
    // Store the draft data to load in ref
    draftDataRef.current = draft;
    
    // Set completing draft to track which draft we're completing
    setCompletingDraft(draft);
    
    // Set edit mode to false since we're loading a draft (not editing existing candidate)
    setIsEditMode(false);
    setEditingCandidate(null);
    
    // Open form dialog after a small delay to ensure state is set
    setTimeout(() => {
      setIsDialogOpen(true);
    }, 50);
  };

  const deleteDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('candidate_drafts')
        .delete()
        .eq('id', draftId);

      if (error) {
        console.error('Error deleting draft:', error);
        toast({
          title: "Error",
          description: "Failed to delete draft",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Draft deleted successfully",
        });
        fetchDrafts();
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };



  const handleCompleteDraft = async (newCandidate: any, draftId: string) => {
    try {
      // Use the parent's onAddCandidate function to add the candidate
      await onAddCandidate(newCandidate);

      // Delete the draft
      const { error: deleteError } = await supabase
        .from('candidate_drafts')
        .delete()
        .eq('id', draftId);

      if (deleteError) {
        console.error('Error deleting draft:', deleteError);
        toast({
          title: "Warning",
          description: "Candidate added but failed to delete draft",
          variant: "destructive",
        });
      }

      // Refresh drafts list
      await fetchDrafts();

    } catch (error) {
      console.error('Error completing draft:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate custom position if selected
    if (isCustomPosition && !customPosition.trim()) {
      toast({
        title: "Error",
        description: "Please enter a custom job title",
        variant: "destructive",
      });
      return;
    }
    
    const selectedJob = jobs.find(job => job.id === formData.jobId);
    
    const sourceValue =
      formData.source === 'recruitment-agency' ? `Recruitment Agency - ${agencyName}` :
      formData.source === 'other' ? `Other - ${otherSource}` :
      formData.source ? toProperCase(formData.source.replace(/-/g, ' ')) : '';
    
    if (isEditMode && editingCandidate) {
      // Update existing candidate
      const updatedCandidate = {
        id: editingCandidate.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: isCustomPosition ? customPosition : (selectedJob?.title || ''),
        department: selectedJob?.department || '',
        jobId: formData.jobId,
        source: sourceValue,
        experience: parseInt(formData.experience),
        monthlyYearly: formData.monthlyYearly,
        expectedSalary: parseInt(formData.expectedSalary),
        currentSalary: parseInt(formData.currentSalary),
        remark: formData.remark,
        noticePeriod: formData.noticePeriod,
        resumeUploaded: selectedFile !== null,
        resumeFile: selectedFile,
        interviewStatus: editingCandidate.interviewStatus, // Keep existing status
        appliedDate: editingCandidate.appliedDate, // Keep existing date
        resume_url: editingCandidate.resume_url, // Keep existing resume URL
      };

      // Call update function
      try {
        await onUpdateCandidate(updatedCandidate);
        
        setIsEditMode(false);
        setEditingCandidate(null);
        
        toast({
          title: "Candidate Updated",
          description: "Candidate information has been updated successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update candidate",
          variant: "destructive",
        });
      }
    } else if (completingDraft) {
      // Complete draft and add to candidates table
      const newCandidate = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: isCustomPosition ? customPosition : (selectedJob?.title || ''),
        department: selectedJob?.department || '',
        jobId: formData.jobId,
        source: sourceValue,
        experience: parseInt(formData.experience),
        monthlyYearly: formData.monthlyYearly,
        expectedSalary: parseInt(formData.expectedSalary),
        currentSalary: parseInt(formData.currentSalary),
        remark: formData.remark,
        noticePeriod: formData.noticePeriod,
        resumeUploaded: selectedFile !== null,
        resumeFile: selectedFile,
        interviewStatus: 'applied',
        appliedDate: new Date().toISOString().split('T')[0],
      };

      // Add candidate and delete draft
      try {
        await handleCompleteDraft(newCandidate, completingDraft.id);
        
        setCompletingDraft(null);
        
        toast({
          title: "Draft Completed",
          description: "Draft has been completed and added to candidates.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to complete draft",
          variant: "destructive",
        });
      }
    } else {
      // Add new candidate
      const newCandidate = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: isCustomPosition ? customPosition : (selectedJob?.title || ''),
        department: selectedJob?.department || '',
        jobId: formData.jobId,
        source: sourceValue,
        experience: parseInt(formData.experience),
        monthlyYearly: formData.monthlyYearly,
        expectedSalary: parseInt(formData.expectedSalary),
        currentSalary: parseInt(formData.currentSalary),
        remark: formData.remark,
        noticePeriod: formData.noticePeriod,
        resumeUploaded: selectedFile !== null,
        resumeFile: selectedFile,
        interviewStatus: 'applied',
        appliedDate: new Date().toISOString().split('T')[0],
      };

      onAddCandidate(newCandidate);
      
      toast({
        title: "Candidate Added",
        description: "New candidate application has been recorded.",
      });
    }
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      jobId: '',
      source: '',
      experience: '',
      monthlyYearly: 'monthly',
      expectedSalary: '',
      currentSalary: '',
      remark: '',
      noticePeriod: '',
    });
    setSelectedFile(null);
    setCustomPosition('');
    setIsCustomPosition(false);
    setAgencyName('');
    setOtherSource('');
    
    setIsDialogOpen(false);
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

  const openEditDialog = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setIsEditMode(true);
    
    // Parse source field to extract the base source and additional info
    let source = '';
    let agencyNameValue = '';
    let otherSourceValue = '';
    
    if (candidate.source) {
      if (candidate.source.startsWith('Recruitment Agency - ')) {
        source = 'recruitment-agency';
        agencyNameValue = candidate.source.replace('Recruitment Agency - ', '');
      } else if (candidate.source.startsWith('Other - ')) {
        source = 'other';
        otherSourceValue = candidate.source.replace('Other - ', '');
      } else {
        // Convert back to the original format
        source = candidate.source.toLowerCase().replace(/\s+/g, '-');
      }
    }
    
    // Find the job ID for the position
    const job = jobs.find(j => j.title === candidate.position);
    
    // Check if this is a custom position (not in jobs list)
    const isCustomPos = !job && candidate.position;
    
    setFormData({
      name: candidate.name || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
      jobId: isCustomPos ? 'custom' : (job?.id || ''),
      source: source,
      experience: candidate.experience?.toString() || '',
      monthlyYearly: candidate.monthlyYearly || 'monthly',
      expectedSalary: candidate.expectedSalary?.toString() || '',
      currentSalary: candidate.currentSalary?.toString() || '',
      remark: candidate.remark || '',
      noticePeriod: candidate.noticePeriod || '',
    });
    
    setCustomPosition(isCustomPos ? candidate.position : '');
    setIsCustomPosition(!!isCustomPos);
    setAgencyName(agencyNameValue);
    setOtherSource(otherSourceValue);
    
    setIsDialogOpen(true);
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

  // Export to Excel function
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(sortedCandidates);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    XLSX.writeFile(wb, 'candidates.xlsx');
  };

  // Export template function
  const handleExportTemplate = () => {
    const templateData = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91-9876543210',
        position: 'Software Engineer',
        department: 'Engineering',
        source: 'LinkedIn',
        experience: '3',
        monthly_yearly: 'monthly',
        current_salary: '65000',
        expected_salary: '75000',
        remark: 'Strong technical background',
        notice_period: '1-month',
        interview_status: 'applied',
        applied_date: '2024-01-15'
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidate Template');
    XLSX.writeFile(wb, 'candidate_import_template.xlsx');
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
        rowErrors.push(`Row ${rowNumber}: Name is required`);
      }
      
      // Email validation - only if provided
      if (row.email && row.email.trim() !== '') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          rowErrors.push(`Row ${rowNumber}: Invalid email format`);
        }
      }
      
      // Check for duplicate emails - only if email is provided
      if (row.email && row.email.trim() !== '') {
        const existingEmails = candidates.map(candidate => candidate.email?.toLowerCase()).filter(Boolean);
        if (existingEmails.includes(row.email.toLowerCase())) {
          rowErrors.push(`Row ${rowNumber}: Email already exists in database`);
        }
        
        // Check for duplicate emails within import data
        const importEmails = data.slice(0, index).map(r => r.email?.toLowerCase()).filter(Boolean);
        if (importEmails.includes(row.email.toLowerCase())) {
          rowErrors.push(`Row ${rowNumber}: Duplicate email within import file`);
        }
      }
      
      // Date validation and Excel date conversion
      if (row.applied_date) {
        let appliedDate: Date;
        
        // Check if it's an Excel date serial number (numeric value)
        if (typeof row.applied_date === 'number' || !isNaN(Number(row.applied_date))) {
          const excelDateNumber = Number(row.applied_date);
          
          // Excel date serial numbers start from 1 (January 1, 1900)
          // Valid range: 1 to 2958465 (December 31, 9999)
          if (excelDateNumber >= 1 && excelDateNumber <= 2958465) {
            // Convert Excel date serial number to JavaScript Date
            const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
            const daysToAdd = excelDateNumber - 1; // Subtract 1 because Excel day 1 is 1900-01-01
            
            // Adjust for Excel's leap year bug (it incorrectly treats 1900 as leap year)
            let adjustedDaysToAdd = daysToAdd;
            if (excelDateNumber > 60) {
              adjustedDaysToAdd -= 1;
            }
            
            appliedDate = new Date(excelEpoch.getTime() + adjustedDaysToAdd * 24 * 60 * 60 * 1000);
          } else {
            rowErrors.push(`Row ${rowNumber}: Invalid Excel date serial number`);
          }
        } else {
          // Try to parse as string date
          const parsedDate = new Date(row.applied_date);
          if (isNaN(parsedDate.getTime())) {
            rowErrors.push(`Row ${rowNumber}: Invalid date format. Use YYYY-MM-DD or Excel date`);
          }
        }
      }
      
      // Experience validation
      if (row.experience && isNaN(Number(row.experience))) {
        rowErrors.push(`Row ${rowNumber}: Experience must be a number`);
      }
      
      // Salary validation
      if (row.current_salary && isNaN(Number(row.current_salary))) {
        rowErrors.push(`Row ${rowNumber}: Current salary must be a number`);
      }
      
      if (row.expected_salary && isNaN(Number(row.expected_salary))) {
        rowErrors.push(`Row ${rowNumber}: Expected salary must be a number`);
      }
      
      // Monthly/Yearly validation
      if (row.monthly_yearly && !['monthly', 'yearly'].includes(row.monthly_yearly.toLowerCase())) {
        rowErrors.push(`Row ${rowNumber}: Monthly/Yearly must be 'monthly' or 'yearly'`);
      }
      
      // Notice period validation
      if (row.notice_period && !['immediate', '15-days', '1-month', '2-months', '3-months', 'negotiable'].includes(row.notice_period.toLowerCase())) {
        rowErrors.push(`Row ${rowNumber}: Notice period must be one of: immediate, 15-days, 1-month, 2-months, 3-months, negotiable`);
      }
      
      // Interview status validation
      if (row.interview_status && !['applied', 'shortlisted', 'selected', 'rejected'].includes(row.interview_status.toLowerCase())) {
        rowErrors.push(`Row ${rowNumber}: Interview status must be one of: applied, shortlisted, selected, rejected`);
      }
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
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
          position: row.position || row.Position || '',
          department: row.department || row.Department || '',
          source: row.source || row.Source || '',
          experience: row.experience || row.Experience || '',
          monthly_yearly: row.monthly_yearly || row['monthly_yearly'] || row['Monthly/Yearly'] || 'monthly',
          current_salary: row.current_salary || row['current_salary'] || row['Current Salary'] || '',
          expected_salary: row.expected_salary || row['expected_salary'] || row['Expected Salary'] || '',
          remark: row.remark || row.Remark || '',
          notice_period: row.notice_period || row['notice_period'] || row['Notice Period'] || '',
          interview_status: row.interview_status || row['interview_status'] || row['Interview Status'] || 'applied',
          applied_date: row.applied_date || row['applied_date'] || row['Applied Date'] || new Date().toISOString().split('T')[0]
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
    
    if (importData.length === 0) {
      toast({
        title: 'No data to import',
        description: 'Please upload a file with valid data',
        variant: 'destructive'
      });
      return;
    }
    
    setIsImporting(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const candidateData of importData) {
        try {
          // Insert candidate
          const { data, error } = await supabase
            .from('candidates')
            .insert([
              {
                name: candidateData.name,
                email: candidateData.email || null,
                phone: candidateData.phone || null,
                position: candidateData.position || null,
                department: candidateData.department || null,
                job_id: null, // Will need to be set manually or through job lookup
                source: candidateData.source || null,
                experience: candidateData.experience ? parseInt(candidateData.experience) : null,
                monthly_yearly: candidateData.monthly_yearly || 'monthly',
                expected_salary: candidateData.expected_salary ? parseInt(candidateData.expected_salary) : null,
                current_salary: candidateData.current_salary ? parseInt(candidateData.current_salary) : null,
                remark: candidateData.remark || null,
                notice_period: candidateData.notice_period || null,
                resume_uploaded: false,
                resume_url: null,
                interview_status: candidateData.interview_status || 'applied',
                applied_date: candidateData.applied_date || new Date().toISOString().split('T')[0],
              },
            ])
            .select();
          
          if (error) {
            console.error('Error inserting candidate:', error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Error processing candidate:', error);
          errorCount++;
        }
      }
      
      // Reset import state
      setImportFile(null);
      setImportData([]);
      setImportErrors([]);
      setImportPreview([]);
      setShowImportPreview(false);
      setIsImportDialogOpen(false);
      
      // Show results
      if (successCount > 0) {
        toast({
          title: 'Import completed',
          description: `Successfully imported ${successCount} candidates${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
          variant: 'default'
        });
        
        // Refresh the candidates list
        window.location.reload();
      } else {
        toast({
          title: 'Import failed',
          description: 'No candidates were imported successfully',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import error',
        description: 'An error occurred during import',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
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
              <DialogTitle className="text-slate-800 dark:text-white">
                {isEditMode ? 'Edit Candidate' : completingDraft ? 'Complete Draft' : 'Add New Candidate'}
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-300">
                {isEditMode ? 'Update the candidate\'s information below' : 
                 completingDraft ? 'Complete the draft and add to candidates' : 
                 'Enter candidate application details'}
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
                    onValueChange={(value) => {
                      setFormData({ ...formData, jobId: value });
                      setIsCustomPosition(value === 'custom');
                      if (value !== 'custom') {
                        setCustomPosition('');
                      }
                    }}
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
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {isCustomPosition && (
                    <Input
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value)}
                      placeholder="Enter custom job title"
                      required
                      className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  )}
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
                  <Label htmlFor="monthlyYearly" className="text-slate-700 dark:text-slate-200">Salary Type *</Label>
                  <Select
                    value={formData.monthlyYearly}
                    onValueChange={(value) => setFormData({ ...formData, monthlyYearly: value })}
                    required
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select salary type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
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
                  onClick={() => {
                    setIsDialogOpen(false);
                    setIsEditMode(false);
                    setEditingCandidate(null);
                    setCompletingDraft(null);
                  }}
                  className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSaveAsDraft}
                  disabled={isSavingDraft}
                  className="bg-slate-500 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isSavingDraft ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button type="submit" className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  {isEditMode ? 'Update Candidate' : completingDraft ? 'Complete Draft' : 'Add Candidate'}
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
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setIsDraftsDialogOpen(true)}
            className="px-4 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded shadow text-sm font-medium flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            Drafts ({drafts.length})
          </button>
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
        </div>
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
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Department</TableHead>
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Application Source</TableHead>
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Experience</TableHead>
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Monthly/Yearly</TableHead>
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Current Salary</TableHead>
                <TableHead className="border-r border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold">Remark</TableHead>
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
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{candidate.department || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{toProperCase(candidate.source) || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{candidate.experience || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white capitalize">{candidate.monthlyYearly || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{formatCurrency(candidate.currentSalary) || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{candidate.remark || 'N/A'}</TableCell>
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
                        onClick={() => openEditDialog(candidate)}
                        className="border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-700"
                        title="Edit Candidate"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openStatusDialog(candidate)}
                        className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                        title="Update Status"
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openHistoryDialog(candidate)}
                        className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                        title="View History"
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

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Candidates
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Download the template using the "Template" button above</li>
                <li>Fill in the candidate data following the template format</li>
                <li>Save the file as Excel (.xlsx or .xls)</li>
                <li>Upload the file here to import candidates</li>
                <li>Review any validation errors and fix them in your file</li>
                <li>Click "Import" to add the candidates to the database</li>
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
                        <TableHead>Position</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.name || '-'}</TableCell>
                          <TableCell>{row.email || '-'}</TableCell>
                          <TableCell>{row.position || '-'}</TableCell>
                          <TableCell>{row.department || '-'}</TableCell>
                          <TableCell>{row.experience || '-'}</TableCell>
                          <TableCell>{row.interview_status || 'applied'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {importData.length > 5 && (
                  <p className="text-sm text-gray-600">
                    Showing first 5 rows of {importData.length} total records
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetImport}
                className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Reset
              </Button>
              <Button
                type="button"
                onClick={handleProcessImport}
                disabled={importErrors.length > 0 || importData.length === 0 || isImporting}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? 'Importing...' : 'Import Candidates'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Drafts Dialog */}
      <Dialog open={isDraftsDialogOpen} onOpenChange={setIsDraftsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              Candidate Drafts
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Load or delete your saved candidate drafts
            </DialogDescription>
            <Button
              onClick={fetchDrafts}
              size="sm"
              variant="outline"
              className="w-fit"
            >
              Refresh Drafts
            </Button>
          </DialogHeader>
          
          {drafts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No drafts found</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                Start creating a candidate to save drafts
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {draft.name}
                        </h3>
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
                          Draft
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Position:</span>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {draft.custom_position || draft.position || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Email:</span>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {draft.email || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {draft.phone || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Experience:</span>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {draft.experience ? `${draft.experience} years` : 'Not specified'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Created: {new Date(draft.created_at).toLocaleDateString()} at {new Date(draft.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => loadDraft(draft)}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Load
                      </Button>
                      <Button
                        onClick={() => deleteDraft(draft.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateManagement;
