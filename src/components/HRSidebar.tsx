import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Users, FileText, Calendar, User, LogOut, Coins, Clock, Target } from 'lucide-react';
import { useState } from 'react';

interface HRSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  userEmail: string;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: FileText,
    id: 'dashboard',
  },
  {
    title: 'Employees',
    icon: User,
    id: 'employees',
  },
];

const HRSidebar: React.FC<HRSidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  onLogout, 
  userEmail 
}) => {
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [pmsOpen, setPmsOpen] = useState(false);
  const [recruitmentOpen, setRecruitmentOpen] = useState(false);
  return (
    <Sidebar className="border-r border-amber-200 bg-gradient-to-b from-slate-50 to-blue-50">
      <SidebarHeader className="p-3 sticky top-0 z-30 bg-gradient-to-b from-slate-50 to-blue-50 border-b border-amber-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-base font-bold text-slate-800 leading-none">RW HR Portal</h2>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    className={`w-full justify-start transition-all duration-200 ${
                      activeSection === item.id 
                        ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-r-2 border-amber-400' 
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Recruitment expandable menu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setRecruitmentOpen((open) => !open)}
                  isActive={['jobs', 'candidates', 'interviews'].includes(activeSection)}
                  className={`w-full justify-start transition-all duration-200 ${
                    ['jobs', 'candidates', 'interviews'].includes(activeSection)
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-r-2 border-amber-400'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Recruitment</span>
                  <span className="ml-auto">{recruitmentOpen ? '▾' : '▸'}</span>
                </SidebarMenuButton>
                {recruitmentOpen && (
                  <div className="ml-7 mt-1 space-y-1 relative">
                    {/* Vertical connective line for Recruitment */}
                    <div className="absolute left-[-12px] top-[-4px] bottom-[-4px] h-[calc(100%+8px)] w-0.5 bg-amber-400 rounded" style={{ zIndex: 0 }} />
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 ${activeSection === 'jobs' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-700'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('jobs')}
                    >
                      Job Management
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 ${activeSection === 'candidates' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-700'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('candidates')}
                    >
                      Candidates
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 ${activeSection === 'interviews' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-700'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('interviews')}
                    >
                      Interviews
                    </button>
                  </div>
                )}
              </SidebarMenuItem>
              {/* PMS expandable menu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setPmsOpen((open) => !open)}
                  isActive={activeSection.startsWith('pms-')}
                  className={`w-full justify-start transition-all duration-200 ${
                    activeSection.startsWith('pms-')
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-r-2 border-amber-400'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span>PMS</span>
                  <span className="ml-auto">{pmsOpen ? '▾' : '▸'}</span>
                </SidebarMenuButton>
                {pmsOpen && (
                  <div className="ml-7 mt-1 space-y-1 relative">
                    {/* Vertical connective line for PMS */}
                    <div className="absolute left-[-12px] top-[-4px] bottom-[-4px] h-[calc(100%+8px)] w-0.5 bg-amber-400 rounded" style={{ zIndex: 0 }} />
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 ${activeSection === 'pms-quarterly' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-700'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('pms-quarterly')}
                    >
                      Quarterly Report
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 ${activeSection === 'pms-yearly' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-700'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('pms-yearly')}
                    >
                      Yearly Report
                    </button>
                  </div>
                )}
              </SidebarMenuItem>
              {/* Attendance expandable menu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setAttendanceOpen((open) => !open)}
                  isActive={activeSection.startsWith('attendance-')}
                  className={`w-full justify-start transition-all duration-200 ${
                    activeSection.startsWith('attendance-')
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-r-2 border-amber-400'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Attendance</span>
                  <span className="ml-auto">{attendanceOpen ? '▾' : '▸'}</span>
                </SidebarMenuButton>
                {attendanceOpen && (
                  <div className="ml-7 mt-1 space-y-1 relative">
                    {/* Vertical connective line - moved further left and taller */}
                    <div className="absolute left-[-12px] top-[-4px] bottom-[-4px] h-[calc(100%+8px)] w-0.5 bg-amber-400 rounded" style={{ zIndex: 0 }} />
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 ${activeSection === 'attendance-analysis' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-700'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('attendance-analysis')}
                    >
                      Attendance Analysis
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 ${activeSection === 'attendance-weekly' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-700'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('attendance-weekly')}
                    >
                      Weekly Attendance
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 ${activeSection === 'attendance-monthly' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-700'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('attendance-monthly')}
                    >
                      Monthly Attendance
                    </button>
                  </div>
                )}
              </SidebarMenuItem>
              {/* Salary expandable menu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setSalaryOpen((open) => !open)}
                  isActive={activeSection.startsWith('salary')}
                  className={`w-full justify-start transition-all duration-200 ${
                    activeSection.startsWith('salary')
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-r-2 border-amber-400'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Salary</span>
                  <span className="ml-auto">{salaryOpen ? '▾' : '▸'}</span>
                </SidebarMenuButton>
                {salaryOpen && (
                  <div className="ml-7 mt-1 space-y-1 relative">
                    {/* Vertical connective line for Salary */}
                    <div className="absolute left-[-12px] top-[-4px] bottom-[-4px] h-[calc(100%+8px)] w-0.5 bg-amber-400 rounded" style={{ zIndex: 0 }} />
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 ${activeSection === 'salary' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-700'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('salary')}
                    >
                      Salary Master
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 ${activeSection === 'salarycalc' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-700'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('salarycalc')}
                    >
                      Salary Calculation
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 ${activeSection === 'salarybreakup' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-700'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('salarybreakup')}
                    >
                      Salary Breakup
                    </button>
                  </div>
                )}
              </SidebarMenuItem>
              {/* FNF Settlement menu item after Salary */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('fnf')}
                  isActive={activeSection === 'fnf'}
                  className={`w-full justify-start transition-all duration-200 ${
                    activeSection === 'fnf'
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-r-2 border-amber-400'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>FNF Settlement</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-amber-200 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {userEmail}
            </p>
            <p className="text-xs text-slate-600">HR Manager</p>
          </div>
          <button
            onClick={onLogout}
            className="ml-2 p-2 text-slate-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default HRSidebar;
