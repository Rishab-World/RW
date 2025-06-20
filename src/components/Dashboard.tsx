import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Calendar, User } from 'lucide-react';

interface DashboardProps {
  jobs: any[];
  candidates: any[];
  employees: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ jobs, candidates, employees }) => {
  const activeJobs = jobs.filter(job => job.status === 'active').length;
  const pendingInterviews = candidates.filter(candidate => 
    candidate.interviewStatus === 'shortlisted'
  ).length;
  const totalEmployees = employees.length;
  const newHires = employees.filter(emp => emp.status === 'pre-joining').length;

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
            <CardDescription>Upcoming interviews and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {candidates.slice(0, 5).map((candidate, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{candidate.name}</p>
                    <p className="text-sm text-gray-600">{candidate.position}</p>
                  </div>
                  <span className={`status-badge ${
                    candidate.interviewStatus === 'shortlisted' ? 'status-pending' :
                    candidate.interviewStatus === 'selected' ? 'status-active' : 'status-rejected'
                  }`}>
                    {candidate.interviewStatus}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
