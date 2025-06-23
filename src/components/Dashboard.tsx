import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Calendar, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  jobs: any[];
  candidates: any[];
  employees: any[];
  interviews: any[];
  onNavigateToSection: (section: string) => void;
  onHighlightCandidate: (candidateId: string) => void;
  onHighlightInterview: (interviewId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  jobs, 
  candidates, 
  employees, 
  interviews,
  onNavigateToSection,
  onHighlightCandidate,
  onHighlightInterview
}) => {
  const activeJobs = jobs.filter(job => job.status === 'active').length;
  const pendingInterviews = candidates.filter(candidate => 
    candidate.interviewStatus === 'shortlisted'
  ).length;
  const totalEmployees = employees.length;
  const newHires = employees.filter(emp => emp.status === 'pre-joining').length;

  // Get candidates with scheduled interviews
  const candidatesWithInterviews = candidates.filter(candidate => {
    return interviews.some(interview => 
      interview.candidate_id === candidate.id && 
      interview.status !== 'cancelled'
    );
  });

  // Create a map of candidate interviews for easy lookup
  const candidateInterviews = new Map();
  interviews.forEach(interview => {
    if (interview.status !== 'cancelled') {
      candidateInterviews.set(interview.candidate_id, interview);
    }
  });

  const stats = [
    {
      title: 'Active Jobs',
      value: activeJobs,
      icon: FileText,
      color: 'bg-blue-500',
      description: 'Open positions',
    },
    {
      title: 'Pending Interviews',
      value: pendingInterviews,
      icon: Calendar,
      color: 'bg-yellow-500',
      description: 'Awaiting scheduling',
    },
    {
      title: 'Total Employees',
      value: totalEmployees,
      icon: Users,
      color: 'bg-green-500',
      description: 'Active workforce',
    },
    {
      title: 'New Hires',
      value: newHires,
      icon: User,
      color: 'bg-purple-500',
      description: 'In pre-joining',
    },
  ];

  const handleCandidateClick = (candidateId: string) => {
    onHighlightCandidate(candidateId);
    onNavigateToSection('candidates');
  };

  const handleInterviewClick = (interviewId: string) => {
    onHighlightInterview(interviewId);
    onNavigateToSection('interviews');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <CardDescription className="text-xs text-gray-500">
                {stat.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Job Postings</CardTitle>
            <CardDescription>Latest job openings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-600">{job.department}</p>
                  </div>
                  <span className={`status-badge ${
                    job.status === 'active' ? 'status-active' : 'status-pending'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview Pipeline</CardTitle>
            <CardDescription>Scheduled interviews with date and time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {candidatesWithInterviews.slice(0, 5).map((candidate, index) => {
                const interview = candidateInterviews.get(candidate.id);
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <button
                        onClick={() => handleCandidateClick(candidate.id)}
                        className="text-left hover:text-blue-600 transition-colors"
                      >
                        <p className="font-medium text-gray-900 hover:underline">
                          {candidate.name}
                        </p>
                        <p className="text-sm text-gray-600">{candidate.position}</p>
                      </button>
                      {interview && (
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <button
                            onClick={() => handleInterviewClick(interview.id)}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                          >
                            <Calendar className="w-3 h-3" />
                            <span className="hover:underline">
                              {format(new Date(interview.interview_date), 'MMM dd, yyyy')}
                            </span>
                          </button>
                          <button
                            onClick={() => handleInterviewClick(interview.id)}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                          >
                            <Clock className="w-3 h-3" />
                            <span className="hover:underline">
                              {interview.interview_time ? 
                                format(new Date(`2000-01-01T${interview.interview_time}`), 'hh:mm a') : 
                                'TBD'
                              }
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className={`status-badge ${
                      candidate.interviewStatus === 'shortlisted' ? 'status-pending' :
                      candidate.interviewStatus === 'selected' ? 'status-active' : 'status-rejected'
                    }`}>
                      {candidate.interviewStatus}
                    </span>
                  </div>
                );
              })}
              {candidatesWithInterviews.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>No scheduled interviews</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
