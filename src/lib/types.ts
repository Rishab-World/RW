// PMS Quarterly Report Types
export interface PMSQuarterlyReport {
  id: string;
  quarter: string;
  department: string;
  employee_name: string;
  employee_code: string;
  kra_score: number;
  max_kra: number;
  goal_score: number;
  max_goal: number;
  total_score: number;
  max_total: number;
  percentage_out_of_10: number;
  remark?: string;
  file_name?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface PMSQuarterlyDetail {
  id: string;
  report_id: string;
  type: 'KRA' | 'GOAL';
  name: string;
  score: number;
  max_score: number;
  created_at: string;
}

export interface PMSReportWithDetails extends PMSQuarterlyReport {
  details: PMSQuarterlyDetail[];
}

// Frontend data structure for parsed Excel data
export interface ParsedPMSData {
  quarter: string;
  department: string;
  employeeName: string;
  employeeCode: string;
  kraScore: number;
  maxKRA: number;
  goalScore: number;
  maxGoal: number;
  totalScore: number;
  maxTotal: number;
  percentageOutOf10: number;
  remark?: string;
  kraDetails: Array<{ name: string; score: number; maxScore: number; selfComment?: string; pms1Comment?: string; hrComment?: string }>;
  goalDetails: Array<{ name: string; score: number; maxScore: number; selfComment?: string; pms1Comment?: string; hrComment?: string }>;
} 