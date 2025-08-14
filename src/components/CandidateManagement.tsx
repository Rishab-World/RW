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
import { formatCurrency, formatSalary, formatSalaryRange } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Candidate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  source?: string;
  experience?: number;
  cu_monthly_yearly?: string;
  current_salary?: number;
  ex_monthly_yearly?: string;
  expected_salary?: number;
  remark?: string;
  notice_period?: string;
  interview_status: string;
  applied_date: string;
  created_at?: string;
  // Legacy fields for backward compatibility
  jobId?: string;
  monthlyYearly?: string;
  expectedSalary?: number;
  currentSalary?: number;
  noticePeriod?: string;
  interviewStatus?: string;
  appliedDate?: string;
  resumeUploaded?: boolean;
  resumeFile?: File | null;
  resume_url?: string;
  isDraft?: boolean;
  draftId?: string | null;
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
  refreshCandidates?: () => void;
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
  onClearHighlight,
  refreshCandidates
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [statusFormData, setStatusFormData] = useState({
    newStatus: '',
    reason: '',
  });
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobId: '',
    source: '',
    experience: '',
    cuMonthlyYearly: 'monthly',
    exMonthlyYearly: 'monthly',
    department: '',
    appliedDate: new Date().toISOString().split('T')[0],
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

  // New state variables for dropdown options
  const [cuMonthlyYearlyOptions, setCuMonthlyYearlyOptions] = useState([]);
  const [exMonthlyYearlyOptions, setExMonthlyYearlyOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');

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

  // Fetch dropdown options when component mounts
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        // Fetch CU Monthly/Yearly options
        const { data: cuOptions } = await supabase
          .from('cu_monthly_yearly_options')
          .select('*')
          .order('id');
        if (cuOptions) setCuMonthlyYearlyOptions(cuOptions);

        // Fetch EX Monthly/Yearly options
        const { data: exOptions } = await supabase
          .from('ex_monthly_yearly_options')
          .select('*')
          .order('id');
        if (exOptions) setExMonthlyYearlyOptions(exOptions);

        // Fetch department options
        const { data: deptOptions } = await supabase
          .from('departments')
          .select('*')
          .eq('is_active', true)
          .order('department_name');
        if (deptOptions) setDepartmentOptions(deptOptions);
      } catch (error) {
        console.error('Error fetching dropdown options:', error);
      }
    };

    fetchDropdownOptions();
  }, []);

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
          cuMonthlyYearly: draft.cu_monthly_yearly || 'monthly',
          exMonthlyYearly: draft.ex_monthly_yearly || 'monthly',
          department: draft.department || '',
          appliedDate: draft.applied_date || new Date().toISOString().split('T')[0],
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
          cuMonthlyYearly: 'monthly',
          exMonthlyYearly: 'monthly',
          department: '',
          appliedDate: new Date().toISOString().split('T')[0],
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
    
    // Subscribe to real-time changes for candidates
    const candidatesSubscription = supabase
      .channel('candidates_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'candidates' 
        }, 
        (payload) => {
          console.log('Candidates change received:', payload);
          // Refresh candidates list when changes occur
          if (refreshCandidates) {
            refreshCandidates();
          }
        }
      )
      .subscribe();

    // Subscribe to real-time changes for candidate drafts
    const draftsSubscription = supabase
      .channel('candidate_drafts_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'candidate_drafts' 
        }, 
        (payload) => {
          console.log('Candidate drafts change received:', payload);
          fetchDrafts();
        }
      )
      .subscribe();

    // Subscribe to real-time changes for candidate status history
    const statusHistorySubscription = supabase
      .channel('candidate_status_history_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'candidate_status_history' 
        }, 
        (payload) => {
          console.log('Candidate status history change received:', payload);
          // Refresh candidates list when status changes occur
          if (refreshCandidates) {
            refreshCandidates();
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      candidatesSubscription.unsubscribe();
      draftsSubscription.unsubscribe();
      statusHistorySubscription.unsubscribe();
    };
  }, [refreshCandidates]);

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
        // Refresh candidates list to show the new draft
        if (refreshCandidates) {
          refreshCandidates();
        }
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
        // Refresh both drafts and candidates list
        fetchDrafts();
        if (refreshCandidates) {
          refreshCandidates();
        }
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const deleteDraftFromTable = async (draftId: string) => {
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
        // Refresh the candidates list to remove the draft from the table
        if (refreshCandidates) {
          refreshCandidates();
        }
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const loadDraftFromTable = (candidate: Candidate) => {
    // Fetch the actual draft data from the database
    const fetchDraftData = async () => {
      try {
        const { data, error } = await supabase
          .from('candidate_drafts')
          .select('*')
          .eq('id', candidate.draftId)
          .single();

        if (error) {
          console.error('Error fetching draft:', error);
          toast({
            title: "Error",
            description: "Failed to load draft",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          // Store the draft data to load in ref
          draftDataRef.current = data;
          
          // Set completing draft to track which draft we're completing
          setCompletingDraft(data);
          
          // Set edit mode to false since we're loading a draft (not editing existing candidate)
          setIsEditMode(false);
          setEditingCandidate(null);
          
          // Open form dialog after a small delay to ensure state is set
          setTimeout(() => {
            setIsDialogOpen(true);
          }, 50);
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    };

    fetchDraftData();
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

      // Refresh the candidates list to remove the draft from the table
      if (refreshCandidates) {
        refreshCandidates();
      }

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
        source: sourceValue,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        cu_monthly_yearly: formData.cuMonthlyYearly,
        current_salary: formData.currentSalary ? parseInt(formData.currentSalary) : undefined,
        ex_monthly_yearly: formData.exMonthlyYearly,
        expected_salary: formData.expectedSalary ? parseInt(formData.expectedSalary) : undefined,
        remark: formData.remark,
        notice_period: formData.noticePeriod,
        interview_status: editingCandidate.interview_status || editingCandidate.interviewStatus || 'applied',
        applied_date: formData.appliedDate || editingCandidate.applied_date || editingCandidate.appliedDate || new Date().toISOString().split('T')[0],
        // Legacy fields for backward compatibility
        jobId: formData.jobId,
        monthlyYearly: formData.cuMonthlyYearly,
        expectedSalary: formData.expectedSalary ? parseInt(formData.expectedSalary) : undefined,
        currentSalary: formData.currentSalary ? parseInt(formData.currentSalary) : undefined,
        noticePeriod: formData.noticePeriod,
        interviewStatus: editingCandidate.interview_status || editingCandidate.interviewStatus,
        appliedDate: editingCandidate.applied_date || editingCandidate.appliedDate,
        resumeUploaded: selectedFile !== null,
        resumeFile: selectedFile,
        resume_url: editingCandidate.resume_url
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
        department: formData.department || selectedJob?.department || '',
        source: sourceValue,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        cu_monthly_yearly: formData.cuMonthlyYearly,
        current_salary: formData.currentSalary ? parseInt(formData.currentSalary) : undefined,
        ex_monthly_yearly: formData.exMonthlyYearly,
        expected_salary: formData.expectedSalary ? parseInt(formData.expectedSalary) : undefined,
        remark: formData.remark,
        notice_period: formData.noticePeriod,
        interview_status: 'applied',
        applied_date: formData.appliedDate || new Date().toISOString().split('T')[0],
        // Legacy fields for backward compatibility
        jobId: formData.jobId,
        monthlyYearly: formData.cuMonthlyYearly,
        expectedSalary: formData.expectedSalary ? parseInt(formData.expectedSalary) : undefined,
        currentSalary: formData.currentSalary ? parseInt(formData.currentSalary) : undefined,
        noticePeriod: formData.noticePeriod,
        interviewStatus: 'applied',
        appliedDate: new Date().toISOString().split('T')[0],
        resumeUploaded: selectedFile !== null,
        resumeFile: selectedFile,
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
        source: sourceValue,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        cu_monthly_yearly: formData.cuMonthlyYearly,
        current_salary: formData.currentSalary ? parseInt(formData.currentSalary) : undefined,
        ex_monthly_yearly: formData.exMonthlyYearly,
        expected_salary: formData.expectedSalary ? parseInt(formData.expectedSalary) : undefined,
        remark: formData.remark,
        notice_period: formData.noticePeriod,
        interview_status: 'applied',
        applied_date: formData.appliedDate || new Date().toISOString().split('T')[0],
        // Legacy fields for backward compatibility
        jobId: formData.jobId,
        monthlyYearly: formData.cuMonthlyYearly,
        expectedSalary: formData.expectedSalary ? parseInt(formData.expectedSalary) : undefined,
        currentSalary: formData.currentSalary ? parseInt(formData.currentSalary) : undefined,
        noticePeriod: formData.noticePeriod,
        interviewStatus: 'applied',
        appliedDate: new Date().toISOString().split('T')[0],
        resumeUploaded: selectedFile !== null,
        resumeFile: selectedFile,
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
          cuMonthlyYearly: 'monthly',
          exMonthlyYearly: 'monthly',
          department: '',
          appliedDate: new Date().toISOString().split('T')[0],
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
    setCompletingDraft(null);
    
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
      cuMonthlyYearly: candidate.cu_monthly_yearly || 'monthly',
      exMonthlyYearly: candidate.ex_monthly_yearly || 'monthly',
      department: candidate.department || '',
      appliedDate: candidate.applied_date || new Date().toISOString().split('T')[0],
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
    const matchesSearch = (candidate.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (candidate.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (candidate.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (candidate.position || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || (candidate.interview_status || candidate.interviewStatus) === filterStatus;
    const matchesPosition = filterPosition === 'all' || candidate.position === filterPosition;
    const matchesDepartment = filterDepartment === 'all' || candidate.department === filterDepartment;
    const matchesSource = filterSource === 'all' || (candidate.source || '').toLowerCase().includes(filterSource.toLowerCase());
    const matchesDate = !filterDate || (candidate.applied_date || candidate.appliedDate) === filterDate;
    
    return matchesSearch && matchesStatus && matchesPosition && matchesDepartment && matchesSource && matchesDate;
  });
  // Sort by appliedDate descending (newest to oldest)
  const sortedCandidates = filteredCandidates.sort((a, b) => {
    const dateA = a.applied_date || a.appliedDate;
    const dateB = b.applied_date || b.appliedDate;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  // Pagination logic
  const totalItems = sortedCandidates.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCandidates = sortedCandidates.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPosition, filterDepartment, filterSource, filterDate]);

  // Context-aware filter options based on sortedCandidates
  const statusOptionsFiltered = Array.from(new Set(sortedCandidates.map(c => c.interview_status || c.interviewStatus).filter(Boolean)));
  const positionOptionsFiltered = Array.from(new Set(sortedCandidates.map(c => c.position).filter(Boolean)));
  const departmentOptionsFiltered = Array.from(new Set(sortedCandidates.map(c => c.department).filter(Boolean)));
  const sourceOptionsFiltered = Array.from(new Set(sortedCandidates.map(c => c.source).filter(Boolean)));

  // Helper to capitalize each word
  const toProperCase = (str) => str ? str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : '';

  // Helper to convert Excel date to proper format
  const convertExcelDate = (dateValue: any): string => {
    if (!dateValue) return new Date().toISOString().split('T')[0];
    
    // If it's already a string that looks like a date, return as is
    if (typeof dateValue === 'string') {
      // Check if it's already in a date format
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/) || dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/) || dateValue.match(/^\d{2}-\d{2}-\d{4}$/)) {
        return dateValue;
      }
    }
    
    // If it's a number (Excel serial date), convert it
    if (typeof dateValue === 'number') {
      // Excel dates are number of days since 1900-01-01
      // But Excel incorrectly treats 1900 as a leap year, so we need to adjust
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // If it's a Date object, convert to string
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
    
    // Try to parse as a date string
    try {
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
    } catch (e) {
      // If parsing fails, return current date
    }
    
    // Default fallback
    return new Date().toISOString().split('T')[0];
  };

  // Helper to format date for display (dd-mmm-yy format)
  const formatDateForDisplay = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      
      // Format as dd-mmm-yy
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear().toString().slice(-2);
      
      return `${day}-${month}-${year}`;
    } catch (e) {
      return 'N/A';
    }
  };

  // Helper to format candidate contact info (name, email, phone)
  const formatCandidateContact = (candidate: Candidate): string => {
    const name = candidate.name || 'N/A';
    const email = candidate.email || '';
    const phone = candidate.phone || '';
    
    let contactInfo = name;
    
    if (email) {
      contactInfo += `\n${email}`;
    }
    
    if (phone) {
      contactInfo += `\n${phone}`;
    }
    
    return contactInfo;
  };

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
        cu_monthly_yearly: 'monthly',
        current_salary: '65000',
        ex_monthly_yearly: 'monthly',
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
      
      // Only validate that name is present - all other fields are optional and accept any value
      if (!row.name || String(row.name).trim() === '') {
        rowErrors.push(`Row ${rowNumber}: Name is required`);
      }
      
      // No other validations - accept any data type and format
      // This allows maximum flexibility for importing vast datasets
      
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
        
        // Process data with maximum flexibility - only name is required
        const processedData = jsonData.map((row: any) => ({
          name: String(row.name || row.Name || row.NAME || ''),
          email: row.email || row.Email || row.EMAIL || '',
          phone: row.phone || row.Phone || row.PHONE || '',
          position: row.position || row.Position || row.POSITION || '',
          department: row.department || row.Department || row.DEPARTMENT || '',
          source: row.source || row.Source || row.SOURCE || '',
          experience: row.experience || row.Experience || row.EXPERIENCE || '',
          cu_monthly_yearly: row.cu_monthly_yearly || row['cu_monthly_yearly'] || row['CU Monthly/Yearly'] || row['CU_MONTHLY_YEARLY'] || 'monthly',
          current_salary: row.current_salary || row['current_salary'] || row['Current Salary'] || row['CURRENT_SALARY'] || '',
          ex_monthly_yearly: row.ex_monthly_yearly || row['ex_monthly_yearly'] || row['EX Monthly/Yearly'] || row['EX_MONTHLY_YEARLY'] || 'monthly',
          expected_salary: row.expected_salary || row['expected_salary'] || row['Expected Salary'] || row['EXPECTED_SALARY'] || '',
          remark: row.remark || row.Remark || row.REMARK || '',
          notice_period: row.notice_period || row['notice_period'] || row['Notice Period'] || row['NOTICE_PERIOD'] || '',
          interview_status: row.interview_status || row['interview_status'] || row['Interview Status'] || row['INTERVIEW_STATUS'] || 'applied',
          applied_date: convertExcelDate(row.applied_date || row['applied_date'] || row['Applied Date'] || row['APPLIED_DATE'])
        }));
        
        setImportData(processedData);
        setImportPreview(processedData.slice(0, 5)); // Show first 5 rows as preview
        setShowImportPreview(true);
        
        // Validate the data
        const { valid, errors } = validateImportData(processedData);
        setImportErrors(errors);
        
        if (errors.length > 0) {
          toast({
            title: 'Validation Errors Found',
            description: `Found ${errors.length} validation errors. Please review and fix them.`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'File Uploaded Successfully',
            description: `Found ${valid.length} valid candidates to import.`,
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
          // Insert candidate with maximum flexibility - accept any data type
          const { data, error } = await supabase
            .from('candidates')
            .insert([
              {
                name: String(candidateData.name || ''),
                email: candidateData.email || null,
                phone: candidateData.phone || null,
                position: candidateData.position || null,
                department: candidateData.department || null,
                source: candidateData.source || null,
                experience: candidateData.experience ? String(candidateData.experience) : null,
                cu_monthly_yearly: candidateData.cu_monthly_yearly || 'monthly',
                current_salary: candidateData.current_salary ? String(candidateData.current_salary) : null,
                ex_monthly_yearly: candidateData.ex_monthly_yearly || 'monthly',
                expected_salary: candidateData.expected_salary ? String(candidateData.expected_salary) : null,
                remark: candidateData.remark || null,
                notice_period: candidateData.notice_period || null,
                interview_status: candidateData.interview_status || 'applied',
                applied_date: candidateData.applied_date ? String(candidateData.applied_date) : new Date().toISOString().split('T')[0],
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
            <Button className="flex items-center space-x-2 bg-slate-600 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
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
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 dark:text-slate-200">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jobId" className="text-slate-700 dark:text-slate-200">Applied Position</Label>
                  <Select
                    value={formData.jobId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, jobId: value });
                      setIsCustomPosition(value === 'custom');
                      if (value !== 'custom') {
                        setCustomPosition('');
                      }
                    }}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select job position" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto">
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {toProperCase(job.title)} - {toProperCase(job.department)}
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
                  <Label htmlFor="department" className="text-slate-700 dark:text-slate-200">Department</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value })}
                    >
                      <SelectTrigger className="flex-1 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto">
                        {departmentOptions.map((dept) => (
                          <SelectItem key={dept.id} value={dept.department_name}>
                            {toProperCase(dept.department_name)}
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
                  <Label htmlFor="source" className="text-slate-700 dark:text-slate-200">Application Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={value => {
                      setFormData({ ...formData, source: value });
                      setAgencyName('');
                      setOtherSource('');
                    }}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto">
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
                  <Label htmlFor="experience" className="text-slate-700 dark:text-slate-200">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="3"
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cuMonthlyYearly" className="text-slate-700 dark:text-slate-200">CU Monthly/Yearly</Label>
                  <Select
                    value={formData.cuMonthlyYearly}
                    onValueChange={(value) => setFormData({ ...formData, cuMonthlyYearly: value })}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select CU salary type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto">
                      {cuMonthlyYearlyOptions.map((option) => (
                        <SelectItem key={option.id} value={option.option_value}>
                          {toProperCase(option.display_name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentSalary" className="text-slate-700 dark:text-slate-200">Current Salary</Label>
                  <Input
                    id="currentSalary"
                    type="number"
                    value={formData.currentSalary}
                    onChange={(e) => setFormData({ ...formData, currentSalary: e.target.value })}
                    placeholder="65000"
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exMonthlyYearly" className="text-slate-700 dark:text-slate-200">EX Monthly/Yearly</Label>
                  <Select
                    value={formData.exMonthlyYearly}
                    onValueChange={(value) => setFormData({ ...formData, exMonthlyYearly: value })}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select EX salary type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto">
                      {exMonthlyYearlyOptions.map((option) => (
                        <SelectItem key={option.id} value={option.option_value}>
                          {toProperCase(option.display_name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedSalary" className="text-slate-700 dark:text-slate-200">Expected Salary</Label>
                  <Input
                    id="expectedSalary"
                    type="number"
                    value={formData.expectedSalary}
                    onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                    placeholder="75000"
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="noticePeriod" className="text-slate-700 dark:text-slate-200">Notice Period</Label>
                  <Select
                    value={formData.noticePeriod}
                    onValueChange={(value) => setFormData({ ...formData, noticePeriod: value })}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select notice period" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto">
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="15-days">15 Days</SelectItem>
                      <SelectItem value="1-month">1 Month</SelectItem>
                      <SelectItem value="2-months">2 Months</SelectItem>
                      <SelectItem value="3-months">3 Months</SelectItem>
                      <SelectItem value="negotiable">Negotiable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appliedDate" className="text-slate-700 dark:text-slate-200">Applied Date</Label>
                  <Input
                    id="appliedDate"
                    type="date"
                    value={formData.appliedDate}
                    onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
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
                <Button type="submit" className="bg-slate-600 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  {isEditMode ? 'Update Candidate' : completingDraft ? 'Complete Draft' : 'Add Candidate'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Department Dialog */}
        <Dialog open={isAddingDepartment} onOpenChange={setIsAddingDepartment}>
          <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-slate-100">Add New Department</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Enter the name of the new department to add to the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newDepartmentName.trim()) return;
              
              try {
                const { data, error } = await supabase.rpc('add_department', {
                  new_department_name: newDepartmentName.trim()
                });
                
                if (error) throw error;
                
                toast({
                  title: "Success",
                  description: data || "Department added successfully",
                });
                
                // Refresh department options
                const { data: deptOptions } = await supabase
                  .from('departments')
                  .select('*')
                  .eq('is_active', true)
                  .order('department_name');
                if (deptOptions) setDepartmentOptions(deptOptions);
                
                setNewDepartmentName('');
                setIsAddingDepartment(false);
              } catch (error) {
                console.error('Error adding department:', error);
                toast({
                  title: "Error",
                  description: "Failed to add department",
                  variant: "destructive",
                });
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newDepartmentName" className="text-slate-700 dark:text-slate-200">Department Name</Label>
                <Input
                  id="newDepartmentName"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="Enter department name"
                  required
                  className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
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
                <Button type="submit" className="bg-slate-600 hover:bg-slate-700 text-white">
                  Add Department
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Input
          type="text"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search candidates..."
          className="border border-slate-200 dark:border-slate-600 rounded px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-400 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm bg-white dark:bg-slate-700"
        />
        <button
          onClick={() => {
            setFilterStatus('all');
            setFilterPosition('all');
            setFilterDepartment('all');
            setFilterSource('all');
            setFilterDate('');
            setSearchTerm('');
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded shadow text-sm font-medium border border-slate-300 dark:border-slate-600 transition-colors"
        >
          Clear Filters
        </button>
        <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-sm font-medium border border-blue-200 dark:border-blue-800">
          Candidates: {candidates.length}
        </span>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setIsDraftsDialogOpen(true)}
            className="px-4 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded shadow text-sm font-medium flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            Drafts ({drafts.length})
          </button>
          <button
            onClick={handleExportTemplate}
            className="px-4 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded shadow text-sm font-medium flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Template
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded shadow text-sm font-medium flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setIsImportDialogOpen(true)}
            className="px-4 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded shadow text-sm font-medium flex items-center gap-1"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
        </div>
      </div>

      {/* Table and controls container */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg dark:shadow-xl">
        <div className="w-full flex justify-between items-center mb-4 px-1">
          <Select value={filterStatus} onValueChange={(value) => {
            setFilterStatus(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-44 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <SelectValue>
                {filterStatus === 'all' ? 'All Status' : filterStatus}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto w-44">
              <SelectItem value="all">All Status</SelectItem>
              {statusOptionsFiltered.map(status => (
                <SelectItem key={status} value={status}>{toProperCase(status)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPosition} onValueChange={(value) => {
            setFilterPosition(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-44 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <SelectValue placeholder="All Positions" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto w-44">
              <SelectItem value="all">All Positions</SelectItem>
              {positionOptionsFiltered.map(position => (
                <SelectItem key={position} value={position}>{toProperCase(position)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDepartment} onValueChange={(value) => {
            setFilterDepartment(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-44 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <SelectValue>
                {filterDepartment === 'all' ? 'All Departments' : filterDepartment}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto w-44">
              <SelectItem value="all">All Departments</SelectItem>
              {departmentOptionsFiltered.map(department => (
                <SelectItem key={department} value={department}>{toProperCase(department)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSource} onValueChange={(value) => {
            setFilterSource(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-44 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <SelectValue>
                {filterSource === 'all' ? 'All Sources' : toProperCase(filterSource)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto w-44">
              <SelectItem value="all">All Sources</SelectItem>
              {sourceOptionsFiltered.map(source => (
                <SelectItem key={source} value={source}>{toProperCase(source)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filterDate}
            onChange={e => {
              setFilterDate(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="dd-----yyyy"
            className="w-44 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
        <div className="mt-4 w-full overflow-x-auto overflow-y-auto max-h-[60vh] border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
          <Table className="w-full min-w-[1700px] border border-gray-200 dark:border-slate-700">
            <TableHeader className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 shadow-sm dark:shadow-slate-900/50 border-t border-slate-200 dark:border-slate-600">
              <TableRow>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 min-w-[200px] border-r border-slate-200 dark:border-slate-600 whitespace-nowrap text-sm font-semibold text-slate-700 dark:text-slate-200">Name & Contact</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[150px] min-w-[150px] max-w-[150px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Position</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[150px] min-w-[150px] max-w-[150px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Department</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Source</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Experience</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[140px] min-w-[140px] max-w-[140px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">CU Monthly/Yearly</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Current Salary</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[140px] min-w-[140px] max-w-[140px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">EX Monthly/Yearly</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Expected Salary</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Remark</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Notice Period</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Interview Status</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">Applied Date</TableHead>
                <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 w-[120px] min-w-[120px] max-w-[120px] text-sm font-semibold text-slate-700 dark:text-slate-200">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white dark:bg-slate-800">
              {paginatedCandidates.map((candidate, index) => (
                <TableRow 
                  key={candidate.id} 
                  data-candidate-id={candidate.id}
                  className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300"
                >
                  <TableCell className="min-w-[200px] border-r border-slate-200 dark:border-slate-700 text-sm font-medium break-words leading-tight text-slate-900 dark:text-white">
                    <div className="font-semibold">{candidate.name}</div>
                    {candidate.email && <div className="text-sm text-slate-600 dark:text-slate-400">{candidate.email}</div>}
                    {candidate.phone && <div className="text-sm text-slate-600 dark:text-slate-400">{candidate.phone}</div>}
                  </TableCell>
                  <TableCell className="w-[150px] min-w-[150px] max-w-[150px] border-r border-slate-200 dark:border-slate-700 text-sm break-words leading-tight text-slate-900 dark:text-white">{candidate.position || 'N/A'}</TableCell>
                  <TableCell className="w-[150px] min-w-[150px] max-w-[150px] border-r border-slate-200 dark:border-slate-700 text-sm break-words leading-tight text-slate-900 dark:text-white">{candidate.department || 'N/A'}</TableCell>
                  <TableCell className="w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-700 text-sm break-words leading-tight text-slate-900 dark:text-white">{toProperCase(candidate.source) || 'N/A'}</TableCell>
                  <TableCell className="w-[120px] min-w-[120px] max-w-[120px] border-r border-slate-200 dark:border-slate-600 text-sm break-words leading-tight text-slate-900 dark:text-white">{candidate.experience || 'N/A'}</TableCell>
                  <TableCell className="w-[140px] min-w-[140px] max-w-[140px] border-r border-slate-200 dark:border-slate-600 text-sm break-words leading-tight text-slate-900 dark:text-white capitalize">{candidate.cu_monthly_yearly || candidate.monthlyYearly || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{formatSalary(candidate.current_salary || candidate.currentSalary) || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white capitalize">{candidate.ex_monthly_yearly || candidate.monthlyYearly || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{formatSalaryRange((candidate.expected_salary || candidate.expectedSalary)?.toString()) || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{candidate.remark || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 capitalize text-slate-900 dark:text-white">{candidate.notice_period || candidate.noticePeriod || 'N/A'}</TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700">
                    <span className={`status-badge ${
                      candidate.isDraft ? 'status-draft' :
                      (candidate.interview_status || candidate.interviewStatus) === 'applied' ? 'status-pending' :
                      (candidate.interview_status || candidate.interviewStatus) === 'shortlisted' ? 'status-pending' :
                      (candidate.interview_status || candidate.interviewStatus) === 'selected' ? 'status-active' : 'status-rejected'
                    }`}>
                      {candidate.isDraft ? 'Draft' : (candidate.interview_status || candidate.interviewStatus)}
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    {formatDateForDisplay(candidate.applied_date || candidate.appliedDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      {candidate.isDraft ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadDraftFromTable(candidate)}
                          className="border-amber-200 dark:border-amber-600 text-amber-700 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-700"
                          title="Complete Draft"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      ) : (
                        <>
                          <div className="flex space-x-1">
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
                          </div>
                          <div className="flex space-x-1">
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
                        </>
                      )}
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
            <p className="text-gray-600 dark:text-slate-300">No candidates found matching the current filters</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between mt-4 px-4 py-3 bg-slate-50 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {totalItems > 0 ? `Showing ${startIndex + 1} to ${Math.min(endIndex, totalItems)} of ${totalItems} candidates` : 'No candidates to display'}
              </span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value) || 10);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20 h-8 text-xs border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-slate-700 dark:text-slate-300">per page</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || totalItems === 0}
                className="h-8 px-2 text-xs border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || totalItems === 0}
                className="h-8 px-2 text-xs border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50"
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 text-xs ${
                        currentPage === pageNum 
                          ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                          : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalItems === 0}
                className="h-8 px-2 text-xs border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50"
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalItems === 0}
                className="h-8 px-2 text-xs border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50"
              >
                Last
              </Button>
            </div>
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
              <Button type="submit" className="bg-slate-600 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                Update Status
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">Status History - {selectedCandidate?.name}</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="max-h-[60vh] overflow-y-auto">
              <CandidateStatusHistory 
                candidateId={selectedCandidate.id}
                statusHistory={historyRecords}
              />
            </div>
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
                  className="bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="min-w-0">
                          <span className="text-slate-500 dark:text-slate-400">Position:</span>
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {draft.custom_position || draft.position || 'Not specified'}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-slate-500 dark:text-slate-400">Email:</span>
                          <p className="font-medium text-slate-900 dark:text-white break-all">
                            {draft.email || 'Not specified'}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {draft.phone || 'Not specified'}
                          </p>
                        </div>
                        <div className="min-w-0">
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
                        className="bg-slate-600 hover:bg-slate-700 text-white"
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
