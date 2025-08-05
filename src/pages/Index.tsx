import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Login from '@/components/Login';
import Register from '@/pages/Register';
import HRSidebar from '@/components/HRSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import Dashboard from '@/components/Dashboard';
import JobManagement from '@/components/JobManagement';
import CandidateManagement from '@/components/CandidateManagement';
import InterviewScheduling from '@/components/InterviewScheduling';
import EmployeeManagement from '@/components/EmployeeManagement';
import SalaryMaster from '@/components/SalaryMaster';
import SalaryCalculation from '@/pages/SalaryCalculation';
import AttendanceAnalysis from '@/components/AttendanceAnalysis';
import WeeklyAttendanceAnalysis from '@/components/WeeklyAttendanceAnalysis';
import MonthlyAttendance from '@/components/MonthlyAttendance';
import SalaryBreakup from '@/pages/SalaryBreakup';
import PMSQuarterlyReport from '@/components/PMSQuarterlyReport';
import KYCDataSection from '@/components/KYCDataSection';
import Templates from '@/components/Templates';
import { supabase } from '@/lib/supabaseClient';

interface StatusChange {
  id: string;
  candidateId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showRegister, setShowRegister] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  
  // Sample data - in a real app, this would come from an API
  const [employees, setEmployees] = useState([]);

  const [statusHistory, setStatusHistory] = useState<StatusChange[]>([]);
  
  // Navigation state for highlighting
  const [highlightedCandidate, setHighlightedCandidate] = useState<string | null>(null);
  const [highlightedInterview, setHighlightedInterview] = useState<string | null>(null);

  // Fetch status history from Supabase
  const fetchStatusHistory = async () => {
    const { data, error } = await supabase
      .from('candidate_status_history')
      .select('*')
      .order('changed_at', { ascending: false });
    if (!error && data) {
      setStatusHistory(data.map(record => ({
        id: record.id,
        candidateId: record.candidate_id,
        oldStatus: record.old_status,
        newStatus: record.new_status,
        changedBy: record.changed_by,
        changedAt: record.changed_at,
        reason: record.reason,
      })));
    }
  };

  // Fetch status history on mount
  useEffect(() => { fetchStatusHistory(); }, []);

  // Fetch jobs from Supabase
  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setJobs(data.map(job => ({
        id: job.id,
        title: job.title,
        department: job.department,
        designation: job.designation,
        vacancies: job.vacancies,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        openDate: job.open_date,
        status: job.status,
        description: job.description,
        location: job.location,
        roleType: job.role_type,
        applications: job.applications,
      })));
    }
  };

  // Fetch jobs on mount
  useEffect(() => { fetchJobs(); }, []);

  // Fetch candidates from Supabase
  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('applied_date', { ascending: false });
    if (!error && data) {
      setCandidates(data.map(candidate => ({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        position: candidate.position,
        department: candidate.department,
        jobId: candidate.job_id,
        source: candidate.source,
        experience: candidate.experience,
        monthlyYearly: candidate.monthly_yearly,
        expectedSalary: candidate.expected_salary,
        currentSalary: candidate.current_salary,
        remark: candidate.remark,
        noticePeriod: candidate.notice_period,
        resumeUploaded: candidate.resume_uploaded,
        resumeFile: null,
        resume_url: candidate.resume_url,
        interviewStatus: candidate.interview_status,
        appliedDate: candidate.applied_date,
      })));
    }
  };

  // Fetch candidates on mount
  useEffect(() => { fetchCandidates(); }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('join_date', { ascending: false });
    if (!error && data) {
      setEmployees(data.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        department: emp.department,
        position: emp.position,
        joinDate: emp.join_date,
        status: emp.status,
        reportingManager: emp.reporting_manager,
        employeeId: emp.employee_id,
        salary: emp.salary,
        costToHire: emp.cost_to_hire,
        probationStatus: emp.probation_status,
        availableDays: emp.available_days,
        pendingRequests: emp.pending_requests,
        usedDaysThisYear: emp.used_days_this_year,
        lastReview: emp.last_review,
        goalCompletion: emp.goal_completion,
        performanceRating: emp.performance_rating,
        grade: emp.grade,
        source: emp.source,
      })));
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  // Add real-time subscription for employees table
  useEffect(() => {
    const channel = supabase
      .channel('public:employees')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        () => {
          fetchEmployees();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch interviews from Supabase
  const fetchInterviews = async () => {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .order('interview_date', { ascending: true });
    if (!error && data) {
      setInterviews(data || []);
    }
  };

  // Fetch interviews on mount
  useEffect(() => { fetchInterviews(); }, []);

  const handleLogin = async (email: string, password: string) => {
    // After successful login, fetch the username from the users table
    if (email && password) {
      // Get the current user from Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      let displayName = email;
      if (user) {
        // Fetch username from users table
        const { data, error } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single();
        if (!error && data?.username) {
          displayName = data.username;
        }
      }
      setUserEmail(displayName);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setActiveSection('dashboard');
  };

  const handleAddJob = async (job: any) => {
    // Insert job into Supabase
    const { data, error } = await supabase
      .from('jobs')
      .insert([
        {
          title: job.title,
          department: job.department,
          designation: job.designation,
          vacancies: job.vacancies,
          salary_min: job.salaryMin,
          salary_max: job.salaryMax,
          open_date: job.openDate,
          status: job.status,
          description: job.description,
          location: job.location,
          role_type: job.roleType,
          applications: job.applications || 0,
        },
      ])
      .select();
    if (!error) {
      await fetchJobs();
    }
  };

  const handleJobUpdated = async () => {
    await fetchJobs();
  };

  const handleAddCandidate = async (candidate: any) => {
    let resumeUrl = null;

    // 1. Upload resume file if present and is a File
    if (candidate.resumeFile instanceof File) {
      const fileName = `candidate_${Date.now()}_${candidate.resumeFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('resumes')
        .upload(fileName, candidate.resumeFile);

      if (uploadError) {
        alert('Resume upload failed: ' + uploadError.message);
        console.error('Resume upload error:', uploadError);
      } else if (uploadData) {
        // 2. Get public URL
        const { data: publicUrlData } = await supabase
          .storage
          .from('resumes')
          .getPublicUrl(uploadData.path);
        resumeUrl = publicUrlData.publicUrl;
      }
    }

    // 3. Insert candidate with resume_url
    const { data, error } = await supabase
      .from('candidates')
      .insert([
        {
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          position: candidate.position,
          department: candidate.department,
          job_id: candidate.jobId === 'custom' ? null : candidate.jobId, // Don't save "custom" as job_id
          source: candidate.source,
          experience: candidate.experience,
          monthly_yearly: candidate.monthlyYearly,
          expected_salary: candidate.expectedSalary,
          current_salary: candidate.currentSalary,
          remark: candidate.remark,
          notice_period: candidate.noticePeriod,
          resume_uploaded: candidate.resumeUploaded,
          resume_url: resumeUrl,
          interview_status: candidate.interviewStatus,
          applied_date: candidate.appliedDate,
        },
      ])
      .select();

    if (error) {
      alert('Candidate save failed: ' + error.message);
      console.error('Candidate insert error:', error);
      return;
    }

    // 4. Update applications count in jobs table (only if job_id exists and is not custom)
    if (candidate.jobId && candidate.jobId !== 'custom') {
      // First, get the current applications count
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('applications')
        .eq('id', candidate.jobId)
        .single();

      if (!jobError && jobData) {
        // Then update with the incremented count
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ applications: (jobData.applications || 0) + 1 })
          .eq('id', candidate.jobId);

        if (updateError) {
          console.error('Failed to update applications count:', updateError);
        }
      }
    }

    let candidateId = data && data[0] ? data[0].id : null;

    // Fallback: fetch by email and applied_date if ID is not returned
    if (!candidateId) {
      const { data: found, error: findError } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', candidate.email)
        .eq('applied_date', candidate.appliedDate)
        .order('created_at', { ascending: false })
        .limit(1);
      if (!findError && found && found[0]) {
        candidateId = found[0].id;
      }
    }

    // Only insert history if we have a candidateId
    if (candidateId) {
      const { error: historyError } = await supabase.from('candidate_status_history').insert([
        {
          candidate_id: candidateId,
          old_status: null,
          new_status: candidate.interviewStatus,
          changed_by: userEmail,
          changed_at: new Date().toISOString(),
          reason: 'Initial application',
        },
      ]);
      if (historyError) {
        console.error('Failed to insert candidate status history:', historyError);
      }
      await fetchCandidates();
      await fetchStatusHistory(); // Fetch updated status history
      await fetchJobs(); // Refresh jobs to get updated applications count
    } else {
      console.error('Could not determine candidate ID after insert!');
    }
  };

  const handleUpdateCandidateStatus = async (candidateId: string, newStatus: string, reason?: string) => {
    // Get the candidate's old status
    const candidate = candidates.find(c => c.id === candidateId);
    const oldStatus = candidate ? candidate.interviewStatus : null;

    // Update candidate status in Supabase
    const { data, error } = await supabase
      .from('candidates')
      .update({ interview_status: newStatus })
      .eq('id', candidateId);
    if (!error) {
      await fetchCandidates();
    }
    // Insert into candidate_status_history table
    if (oldStatus) {
      await supabase.from('candidate_status_history').insert([
        {
          candidate_id: candidateId,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: userEmail,
          changed_at: new Date().toISOString(),
          reason: reason || null,
        },
      ]);
      await fetchStatusHistory(); // Fetch updated status history
    }
    if (oldStatus && newStatus === 'selected') {
      const candidate = candidates.find(c => c.id === candidateId);
      if (candidate) {
        // Get department from job
        let department = '';
        if (candidate.jobId && jobs && jobs.length > 0) {
          const job = jobs.find(j => j.id === candidate.jobId);
          if (job && job.department) department = job.department;
        }
        // Check if employee already exists (by email)
        const { data: existingEmployees } = await supabase
          .from('employees')
          .select('id')
          .eq('email', candidate.email);
        if (!existingEmployees || existingEmployees.length === 0) {
          await supabase.from('employees').insert([
            {
              name: candidate.name,
              email: candidate.email,
              phone: candidate.phone || null,
              department: department,
              position: candidate.position || '',
              employee_id: null,
              source: candidate.source || null,
            },
          ]);
          await fetchEmployees();
        }
      }
    }
  };

  const handleUpdateCandidate = async (updatedCandidate: any) => {
    try {
      // Update candidate in Supabase
      const { error } = await supabase
        .from('candidates')
        .update({
          name: updatedCandidate.name,
          email: updatedCandidate.email,
          phone: updatedCandidate.phone,
          position: updatedCandidate.position,
          department: updatedCandidate.department,
          job_id: updatedCandidate.jobId === 'custom' || updatedCandidate.jobId === '' ? null : updatedCandidate.jobId,
          source: updatedCandidate.source,
          experience: updatedCandidate.experience,
          monthly_yearly: updatedCandidate.monthlyYearly,
          expected_salary: updatedCandidate.expectedSalary,
          current_salary: updatedCandidate.currentSalary,
          remark: updatedCandidate.remark,
          notice_period: updatedCandidate.noticePeriod,
        })
        .eq('id', updatedCandidate.id);

      if (error) {
        console.error('Error updating candidate:', error);
        throw new Error('Failed to update candidate: ' + error.message);
      }

      // Refresh data
      await fetchCandidates();
      await fetchStatusHistory();
    } catch (error) {
      console.error('Error in handleUpdateCandidate:', error);
      throw error;
    }
  };

  if (!isAuthenticated) {
    return showRegister ? <Register onToggleLogin={() => setShowRegister(false)} /> : <Login onLogin={handleLogin} onToggleRegister={() => setShowRegister(true)} />;
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard 
          jobs={jobs} 
          candidates={candidates} 
          employees={employees} 
          interviews={interviews}
          onNavigateToSection={setActiveSection}
          onHighlightCandidate={setHighlightedCandidate}
          onHighlightInterview={setHighlightedInterview}
        />;
      case 'jobs':
        return <JobManagement jobs={jobs} onAddJob={handleAddJob} onJobUpdated={handleJobUpdated} />;
      case 'candidates':
        return <CandidateManagement 
          candidates={candidates} 
          jobs={jobs} 
          onAddCandidate={handleAddCandidate}
          onUpdateCandidate={handleUpdateCandidate}
          onUpdateCandidateStatus={handleUpdateCandidateStatus}
          statusHistory={statusHistory}
          userEmail={userEmail}
          highlightedCandidate={highlightedCandidate}
          onClearHighlight={() => setHighlightedCandidate(null)}
        />;
      case 'interviews':
        return <InterviewScheduling 
          candidates={candidates} 
          refreshCandidates={fetchCandidates}
          highlightedInterview={highlightedInterview}
          onClearHighlight={() => setHighlightedInterview(null)}
        />;
      case 'employees':
        return <EmployeeManagement employees={employees} refreshEmployees={fetchEmployees} />;
      case 'kyc-data':
        return <KYCDataSection />;
      case 'confirmation':
        return (
          <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Employee Confirmation</h2>
                <p className="text-slate-600 dark:text-slate-300">Employee confirmation functionality will be implemented here.</p>
              </div>
            </div>
          </div>
        );
      case 'leave':
        return (
          <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Leave Management</h2>
                <p className="text-slate-600 dark:text-slate-300">Leave management functionality will be implemented here.</p>
              </div>
            </div>
          </div>
        );
      case 'salary':
        return <SalaryMaster isManagement={true} />;
      case 'salarycalc':
        return <SalaryCalculation />;
      case 'fnf':
        return (
          <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">FNF Settlement</h2>
                <p className="text-slate-600 dark:text-slate-300">FNF (Full and Final) settlement functionality will be implemented here.</p>
              </div>
            </div>
          </div>
        );
      case 'attendance-analysis':
        return <AttendanceAnalysis />;
      case 'attendance-weekly':
        return <WeeklyAttendanceAnalysis />;
      case 'attendance-monthly':
        return <MonthlyAttendance />;
      case 'salarybreakup':
        return <SalaryBreakup />;
      case 'pms-quarterly':
        return <PMSQuarterlyReport />;
      case 'pms-yearly':
        return (
          <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Yearly PMS Report</h2>
                <p className="text-slate-600 dark:text-slate-300">Yearly PMS report functionality will be implemented here.</p>
              </div>
            </div>
          </div>
        );
      case 'templates':
        return <Templates />;
      default:
        return <Dashboard 
          jobs={jobs} 
          candidates={candidates} 
          employees={employees} 
          interviews={interviews}
          onNavigateToSection={setActiveSection}
          onHighlightCandidate={setHighlightedCandidate}
          onHighlightInterview={setHighlightedInterview}
        />;
    }
  };

  // Add a mapping for section titles
  const sectionTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    jobs: 'Job Management',
    candidates: 'Candidate Management',
    interviews: 'Interview Scheduling',
    employees: 'All Employees',
    'kyc-data': 'KYC Data Management',
    confirmation: 'Employee Confirmation',
    leave: 'Leave Management',
    salary: 'Salary Master',
    fnf: 'FNF Settlement',
    salarycalc: 'Salary Calculation',
    'attendance-analysis': 'Attendance Analysis',
    'attendance-weekly': 'Weekly Attendance',
    'attendance-monthly': 'Monthly Attendance',
    salarybreakup: 'Salary Breakup',
    'pms-quarterly': 'Quarterly PMS Report',
    'pms-yearly': 'Yearly PMS Report',
  };

  let sectionTitle = '';
  switch (activeSection) {
    case 'dashboard':
      sectionTitle = 'Dashboard'; break;
    case 'jobs':
      sectionTitle = 'Job Management'; break;
    case 'candidates':
      sectionTitle = 'Candidate Management'; break;
    case 'interviews':
      sectionTitle = 'Interview Scheduling'; break;
    case 'employees':
      sectionTitle = 'Employee Management'; break;
    case 'kyc-data':
      sectionTitle = 'KYC Data'; break;
    case 'confirmation':
      sectionTitle = 'Employee Confirmation'; break;
    case 'leave':
      sectionTitle = 'Leave Management'; break;
    case 'salary':
      sectionTitle = 'Salary Master'; break;
    case 'salarycalc':
      sectionTitle = 'Salary Calculation'; break;
    case 'fnf':
      sectionTitle = 'FNF Settlement'; break;
    case 'attendance-analysis':
      sectionTitle = 'Attendance Analysis'; break;
    case 'attendance-weekly':
      sectionTitle = 'Weekly Attendance'; break;
    case 'attendance-monthly':
      sectionTitle = 'Monthly Attendance'; break;
    case 'salarybreakup':
      sectionTitle = 'Salary Breakup'; break;
    case 'pms-quarterly':
      sectionTitle = 'Quarterly PMS Report'; break;
    case 'pms-yearly':
      sectionTitle = 'Yearly PMS Report'; break;
    case 'templates':
      sectionTitle = 'Document Templates'; break;
    default:
      sectionTitle = '';
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full max-w-screen overflow-x-hidden bg-slate-50 dark:bg-slate-900">
        <HRSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
          userEmail={userEmail}
        />
        <div className="flex-1 flex flex-col h-screen min-w-0 ml-[13rem] md:ml-0 transition-all duration-200">
          <div className="border-b border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 flex items-center gap-4 sticky top-0 z-40">
            <SidebarTrigger className="text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white truncate mr-4">{sectionTitle}</h1>
            <ThemeToggle />
          </div>
          <main className="flex-1 flex flex-col overflow-y-auto min-w-0 bg-slate-50 dark:bg-slate-900">
            {renderActiveSection()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
