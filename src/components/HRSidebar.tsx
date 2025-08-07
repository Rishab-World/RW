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
import { 
  Users, 
  FileText, 
  Calendar, 
  User, 
  LogOut, 
  Coins, 
  Clock, 
  Target, 
  CalendarDays, 
  BarChart3, 
  Building2, 
  UserCheck, 
  FileSpreadsheet,
  Receipt
} from 'lucide-react';
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
    icon: BarChart3,
    id: 'dashboard',
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
  const [employeeOpen, setEmployeeOpen] = useState(false);
  return (
    <Sidebar className="border-r border-amber-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
              <SidebarHeader className="p-3 sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b border-amber-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-amber-600 dark:bg-slate-700 rounded-lg flex items-center justify-center shadow-lg">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white leading-none">RW HR Portal</h2>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-transparent dark:bg-transparent">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider px-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    className={`w-full justify-start transition-all duration-200 rounded-md dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white ${
                      activeSection === item.id 
                        ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 text-amber-800 dark:text-amber-300 border-r-2 border-amber-400 dark:border-amber-500' 
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
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
                  isActive={['jobs', 'candidates', 'interviews', 'draft'].includes(activeSection)}
                  className={`w-full justify-start transition-all duration-200 rounded-md dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white ${
                    ['jobs', 'candidates', 'interviews', 'draft'].includes(activeSection)
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 text-amber-800 dark:text-amber-300 border-r-2 border-amber-400 dark:border-amber-500'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Recruitment</span>
                  <span className="ml-auto">{recruitmentOpen ? '▾' : '▸'}</span>
                </SidebarMenuButton>
                {recruitmentOpen && (
                  <div className="ml-7 mt-1 space-y-1 relative">
                    {/* Vertical connective line for Recruitment */}
                    <div className="absolute left-[-12px] top-[-4px] bottom-[-4px] h-[calc(100%+8px)] w-0.5 bg-amber-400 dark:bg-amber-700 rounded" style={{ zIndex: 0 }} />
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'jobs' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('jobs')}
                    >
                      Job Management
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'candidates' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('candidates')}
                    >
                      Candidates
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'interviews' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('interviews')}
                    >
                      Interviews
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'draft' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('draft')}
                    >
                      Draft
                    </button>
                  </div>
                )}
              </SidebarMenuItem>
              {/* Employees expandable menu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setEmployeeOpen((open) => !open)}
                  isActive={['employees', 'confirmation', 'kyc-data', 'kyc-table'].includes(activeSection)}
                  className={`w-full justify-start transition-all duration-200 rounded-md dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white ${
                    ['employees', 'confirmation', 'kyc-data', 'kyc-table'].includes(activeSection)
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 text-amber-800 dark:text-amber-300 border-r-2 border-amber-400 dark:border-amber-500'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Employees</span>
                  <span className="ml-auto">{employeeOpen ? '▾' : '▸'}</span>
                </SidebarMenuButton>
                {employeeOpen && (
                  <div className="ml-7 mt-1 space-y-1 relative">
                    {/* Vertical connective line for Employees */}
                    <div className="absolute left-[-12px] top-[-4px] bottom-[-4px] h-[calc(100%+8px)] w-0.5 bg-amber-400 dark:bg-amber-700 rounded" style={{ zIndex: 0 }} />
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'employees' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('employees')}
                    >
                      Employee Data
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'confirmation' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('confirmation')}
                    >
                      Confirmation
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'kyc-data' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('kyc-data')}
                    >
                      KYC Data
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'kyc-table' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('kyc-table')}
                    >
                      KYC Table
                    </button>
                  </div>
                )}
              </SidebarMenuItem>
              {/* Attendance expandable menu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setAttendanceOpen((open) => !open)}
                  isActive={activeSection.startsWith('attendance-')}
                  className={`w-full justify-start transition-all duration-200 rounded-md dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white ${
                    activeSection.startsWith('attendance-')
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 text-amber-800 dark:text-amber-300 border-r-2 border-amber-400 dark:border-amber-500'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Attendance</span>
                  <span className="ml-auto">{attendanceOpen ? '▾' : '▸'}</span>
                </SidebarMenuButton>
                {attendanceOpen && (
                  <div className="ml-7 mt-1 space-y-1 relative">
                    {/* Vertical connective line - moved further left and taller */}
                    <div className="absolute left-[-12px] top-[-4px] bottom-[-4px] h-[calc(100%+8px)] w-0.5 bg-amber-400 dark:bg-amber-700 rounded" style={{ zIndex: 0 }} />
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'attendance-analysis' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('attendance-analysis')}
                    >
                      Attendance Analysis
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'attendance-weekly' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('attendance-weekly')}
                    >
                      Weekly Attendance
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'attendance-monthly' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('attendance-monthly')}
                    >
                      Monthly Attendance
                    </button>
                  </div>
                )}
              </SidebarMenuItem>
              {/* Leave menu item */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('leave')}
                  isActive={activeSection === 'leave'}
                  className={`w-full justify-start transition-all duration-200 rounded-md dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white ${
                    activeSection === 'leave'
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 text-amber-800 dark:text-amber-300 border-r-2 border-amber-400 dark:border-amber-500'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Leave</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Salary expandable menu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setSalaryOpen((open) => !open)}
                  isActive={activeSection.startsWith('salary')}
                  className={`w-full justify-start transition-all duration-200 rounded-md dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white ${
                    activeSection.startsWith('salary')
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 text-amber-800 dark:text-amber-300 border-r-2 border-amber-400 dark:border-amber-500'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Salary</span>
                  <span className="ml-auto">{salaryOpen ? '▾' : '▸'}</span>
                </SidebarMenuButton>
                {salaryOpen && (
                  <div className="ml-7 mt-1 space-y-1 relative">
                    {/* Vertical connective line for Salary */}
                    <div className="absolute left-[-12px] top-[-4px] bottom-[-4px] h-[calc(100%+8px)] w-0.5 bg-amber-400 dark:bg-amber-700 rounded" style={{ zIndex: 0 }} />
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'salary' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('salary')}
                    >
                      Salary Master
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'salarycalc' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('salarycalc')}
                    >
                      Salary Calculation
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'salarybreakup' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('salarybreakup')}
                    >
                      Salary Breakup
                    </button>
                  </div>
                )}
              </SidebarMenuItem>
              {/* PMS expandable menu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setPmsOpen((open) => !open)}
                  isActive={activeSection.startsWith('pms-')}
                  className={`w-full justify-start transition-all duration-200 rounded-md dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white ${
                    activeSection.startsWith('pms-')
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 text-amber-800 dark:text-amber-300 border-r-2 border-amber-400 dark:border-amber-500'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span>PMS</span>
                  <span className="ml-auto">{pmsOpen ? '▾' : '▸'}</span>
                </SidebarMenuButton>
                {pmsOpen && (
                  <div className="ml-7 mt-1 space-y-1 relative">
                    {/* Vertical connective line for PMS */}
                    <div className="absolute left-[-12px] top-[-4px] bottom-[-4px] h-[calc(100%+8px)] w-0.5 bg-amber-400 dark:bg-amber-700 rounded" style={{ zIndex: 0 }} />
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'pms-quarterly' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('pms-quarterly')}
                    >
                      Quarterly Report
                    </button>
                    <button
                      className={`relative block w-full text-left px-2 pl-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 ${activeSection === 'pms-yearly' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      style={{ zIndex: 1, borderRadius: 0 }}
                      onClick={() => onSectionChange('pms-yearly')}
                    >
                      Yearly Report
                    </button>
                  </div>
                )}
              </SidebarMenuItem>
              {/* Templates menu item after PMS */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('templates')}
                  isActive={activeSection === 'templates'}
                  className={`w-full justify-start transition-all duration-200 rounded-md dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white ${
                    activeSection === 'templates'
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 text-amber-800 dark:text-amber-300 border-r-2 border-amber-400 dark:border-amber-500'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Templates</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* FNF Settlement menu item after Templates */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('fnf')}
                  isActive={activeSection === 'fnf'}
                  className={`w-full justify-start transition-all duration-200 rounded-md dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white ${
                    activeSection === 'fnf'
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 text-amber-800 dark:text-amber-300 border-r-2 border-amber-400 dark:border-amber-500'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>FNF Settlement</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
              <SidebarFooter className="p-4 border-t border-amber-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
              {userEmail}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">HR Manager</p>
          </div>
          <button
            onClick={onLogout}
            className="ml-2 p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
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
