import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Eye, Download, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { utils as XLSXUtils, writeFile as XLSXWriteFile, BookType } from 'xlsx';
import { supabase } from '@/lib/supabaseClient';
import { ParsedPMSData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface EmployeeReport {
  employeeName: string;
  employeeCode: string;
  kraScore: number;
  goalScore: number;
  totalScore: number;
  maxKRA: number;
  maxGoal: number;
  maxTotal: number;
  percentage: number;
  percentageOutOf10: number;
  kraDetails: { name: string; score: number; selfComment?: string; pms1Comment?: string; hrComment?: string }[];
  goalDetails: { name: string; score: number; selfComment?: string; pms1Comment?: string; hrComment?: string }[];
  quarter: string;
  department: string;
  remark?: string;
}

const KRA_LIST = [
  'job knowledge',
  'productivity',
  'technical skills',
  'attitude',
  'flexibility',
  'initiative',
  'punctuality and attendance',
  'communication skills',
];

function getDepartmentNameFromFileName(fileName: string) {
  // Remove extension and return as department name
  return fileName.replace(/\.[^/.]+$/, '');
}

// Helper to capitalize each word, removing leading/trailing quotes
function toProperCaseWithQuotes(str: string) {
  if (!str) return '';
  // Remove leading/trailing quotes
  const cleaned = str.replace(/^['"]+|['"]+$/g, '');
  return cleaned.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

const PMSQuarterlyReport: React.FC = () => {
  const { toast } = useToast();
  const [fileName, setFileName] = useState('');
  const [department, setDepartment] = useState('');
  const [reports, setReports] = useState<EmployeeReport[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<EmployeeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedQuarter, setSelectedQuarter] = useState('all');
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
  const [editingRemark, setEditingRemark] = useState<string | null>(null);
  const [remarkInput, setRemarkInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load reports from database (used internally)
  const loadReportsFromDatabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: savedReports, error } = await supabase
        .from('pms_quarterly_reports')
        .select(`
          *,
          details: pms_quarterly_details(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reports:', error);
        return;
      }

      if (savedReports && savedReports.length > 0) {
        const convertedReports: EmployeeReport[] = savedReports.map((saved: any) => {
          const kraDetails = saved.details
            .filter((d: any) => d.type === 'KRA')
            .map((d: any) => ({ 
              name: d.name, 
              score: d.score, 
              selfComment: d.self_comment || null,
              pms1Comment: d.pms1_comment || null,
              hrComment: d.hr_comment || null
            }));

          // Debug: Log what we're loading for KRAs
          console.log('Loading KRA details from DB:', kraDetails.map(k => ({ name: k.name, pms1Comment: k.pms1Comment })));
          
          const goalDetails = saved.details
            .filter((d: any) => d.type === 'GOAL')
            .map((d: any) => ({ 
              name: d.name, 
              score: d.score, 
              selfComment: d.self_comment || null,
              pms1Comment: d.pms1_comment || null,
              hrComment: d.hr_comment || null
            }));

          return {
            employeeName: saved.employee_name,
            employeeCode: saved.employee_code,
            kraScore: saved.kra_score,
            goalScore: saved.goal_score,
            totalScore: saved.total_score,
            maxKRA: saved.max_kra,
            maxGoal: saved.max_goal,
            maxTotal: saved.max_total,
            percentage: (saved.total_score / saved.max_total) * 100,
            percentageOutOf10: saved.percentage_out_of_10,
            kraDetails,
            goalDetails,
            quarter: saved.quarter,
            department: saved.department,
            remark: saved.remark || '',
          };
        });

        setReports(convertedReports);
        // Don't override department if it's already set
        if (!department && savedReports[0].department) {
          setDepartment(savedReports[0].department);
        }
      }
    } catch (error) {
      console.error('Error loading from database:', error);
    }
  };

  // Save reports to database
  const saveReportsToDatabase = async (employeeReports: EmployeeReport[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save reports.",
          variant: "destructive",
        });
        return false;
      }

      // Save each report
      for (const report of employeeReports) {
        // Insert main report
        const { data: reportData, error: reportError } = await supabase
          .from('pms_quarterly_reports')
          .insert({
            quarter: report.quarter,
            department: report.department,
            employee_name: report.employeeName,
            employee_code: report.employeeCode,
            kra_score: report.kraScore,
            max_kra: report.maxKRA,
            goal_score: report.goalScore,
            max_goal: report.maxGoal,
            total_score: report.totalScore,
            max_total: report.maxTotal,
            percentage_out_of_10: report.percentageOutOf10,
            remark: report.remark || null,
            file_name: fileName,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (reportError) {
          console.error('Error saving report:', reportError);
          toast({
            title: "Error saving report",
            description: `Failed to save report for ${report.employeeName}`,
            variant: "destructive",
          });
          return false;
        }

        // Insert KRA details
        const kraDetails = report.kraDetails.map(detail => ({
          report_id: reportData.id,
          type: 'KRA' as const,
          name: detail.name,
          score: detail.score,
          max_score: 10, // Assuming each KRA is out of 10
          self_comment: detail.selfComment || null,
          pms1_comment: detail.pms1Comment || null,
          hr_comment: detail.hrComment || null,
        }));

        // Debug: Log what we're saving for KRAs
        console.log('Saving KRA details:', kraDetails.map(k => ({ name: k.name, pms1_comment: k.pms1_comment })));

        if (kraDetails.length > 0) {
          const { error: kraError } = await supabase
            .from('pms_quarterly_details')
            .insert(kraDetails);

          if (kraError) {
            console.error('Error saving KRA details:', kraError);
          }
        }

        // Insert Goal details
        const goalDetails = report.goalDetails.map(detail => ({
          report_id: reportData.id,
          type: 'GOAL' as const,
          name: detail.name,
          score: detail.score,
          max_score: 10, // Assuming each goal is out of 10
          self_comment: detail.selfComment || null,
          pms1_comment: detail.pms1Comment || null,
          hr_comment: detail.hrComment || null,
        }));

        // Debug: Log what we're saving for Goals
        console.log('Saving Goal details:', goalDetails.map(g => ({ name: g.name, pms1_comment: g.pms1_comment })));

        if (goalDetails.length > 0) {
          const { error: goalError } = await supabase
            .from('pms_quarterly_details')
            .insert(goalDetails);

          if (goalError) {
            console.error('Error saving goal details:', goalError);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving to backend:', error);
      toast({
        title: "Error",
        description: "Failed to save reports to the database.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFileName(selectedFile.name);
    setDepartment(getDepartmentNameFromFileName(selectedFile.name));
    setFile(selectedFile);
    // Removed setReports([]) to prevent clearing table data on file upload
  };

  const handleGenerateReport = async () => {
    if (!file) return;
    setLoading(true);
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const employeeReports: EmployeeReport[] = [];
    let quarter = '';
    if (workbook.SheetNames.length > 0) {
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
      if (rows.length > 1 && typeof rows[1][0] === 'string') {
        const match = rows[1][0].match(/Appraisal Form Report - ([^\s]+)_([^\s]+)_([0-9]{4})/);
        if (match) {
          quarter = match[1] + '_' + match[2] + '_' + match[3];
        } else {
          // fallback: try to extract the part between 'Report - ' and ' for the period'
          const altMatch = rows[1][0].match(/Report - (.*?) for the period/);
          if (altMatch) quarter = altMatch[1].replace(/\s/g, '');
        }
      }
    }
    workbook.SheetNames.forEach((sheetName) => {
      const ws = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
      if (rows.length < 6) return;
      
      // Debug: Log the first 10 rows to understand file structure
      console.log('First 10 rows of file:', rows.slice(0, 10));
      
      const empRaw = (rows[3]?.[0] || '').toString().trim();
      if (!empRaw) return;
      let employeeName = empRaw;
      let employeeCode = '';
      if (empRaw.includes(' - ')) {
        const parts = empRaw.split(' - ');
        employeeName = parts[0].trim();
        employeeCode = parts[1]?.trim() || '';
      }
      let kraDetails: { name: string; score: number; selfComment?: string; pms1Comment?: string; hrComment?: string }[] = [];
      let goalDetails: { name: string; score: number; selfComment?: string; pms1Comment?: string; hrComment?: string }[] = [];
      
      // Track the current KRA/Goal being processed
      let currentKRA: string | null = null;
      let currentGoal: string | null = null;
      let pendingPms1Comment: string = '';
      let pendingHrComment: string = '';
      
      let i = 5;
      while (i < rows.length) {
        const row = rows[i];
        const goalKraRaw = row[0] || '';
        const goalKra = goalKraRaw.toString().trim().toLowerCase();
        
        // Try different column indices for score - the pms_1 column might be at different index
        const scoreFromCol1 = parseFloat(row[1]) || 0;
        const scoreFromCol2 = parseFloat(row[2]) || 0;
        const scoreFromCol3 = parseFloat(row[3]) || 0;
        
        // Use the pms_1 column (column 2 based on the image)
        const score = scoreFromCol2;
        
        // Debug: Log every row being processed
        console.log(`Row ${i}:`, { 
          raw: goalKraRaw, 
          processed: goalKra, 
          score: score,
          scoreCol1: scoreFromCol1,
          scoreCol2: scoreFromCol2,
          scoreCol3: scoreFromCol3,
          row: row 
        });
        
        const isValidName = goalKra && 
                           goalKra !== 'default' && 
                           !goalKra.startsWith('self') && 
                           !goalKra.startsWith('hr') && 
                           !goalKra.startsWith('pms_1') &&
                           goalKra.replace(/['"\s]/g, '') !== '' && 
                           !goalKra.includes('total') &&
                           goalKra.length > 1; // Reduced minimum length requirement
        
        // Debug: Log validation result
        console.log(`Row ${i} isValidName:`, isValidName, 'for:', goalKraRaw);
        
        // Debug: Check if this row contains pms_1 content
        if (goalKraRaw.includes('pms_1 :')) {
          console.log(`Row ${i} contains pms_1 content:`, goalKraRaw);
          
          // Extract pms_1 comment from this row
          const pms1Match = goalKraRaw.match(/pms_1 : ([^\n]*)/);
          if (pms1Match && pms1Match[1]) {
            const extractedComment = pms1Match[1].trim();
            console.log(`Extracted pms_1 comment: "${extractedComment}" for current KRA: "${currentKRA}" or Goal: "${currentGoal}"`);
            
            // Store this comment to be used with the next KRA/Goal
            pendingPms1Comment = extractedComment;
          }
        }
        
        // Fallback: If validation fails but we have meaningful content, still capture it
        const hasMeaningfulContent = goalKraRaw && 
                                   goalKraRaw.length > 3 && 
                                   !goalKraRaw.toLowerCase().includes('total') &&
                                   !goalKraRaw.toLowerCase().startsWith('self') &&
                                   !goalKraRaw.toLowerCase().startsWith('hr') &&
                                   !goalKraRaw.toLowerCase().startsWith('pms_1');
        
                if (isValidName || hasMeaningfulContent) {
          // This is a KRA or Goal row - store it as current
          if (KRA_LIST.includes(goalKra)) {
            currentKRA = goalKraRaw;
            currentGoal = null;
          } else {
            currentGoal = goalKraRaw;
            currentKRA = null;
          }
          
          // Look for self-appraisal comments in the next rows
          let selfComment = '';
          let pms1Comment = '';
          let hrComment = '';
          
          // Check if the current row contains combined data (Self, pms_1, HR in one row)
          const currentRowText = goalKraRaw;
          if (currentRowText.includes('Self :') && currentRowText.includes('pms_1 :')) {
            // Extract Self comment
            const selfMatch = currentRowText.match(/Self : \[Auto Self Appraisal By HR\]/);
            if (selfMatch) {
              selfComment = selfMatch[0];
            }
            
            // Extract pms_1 comment
            const pms1Match = currentRowText.match(/pms_1 : ([^\n]*)/);
            if (pms1Match && pms1Match[1]) {
              pms1Comment = pms1Match[1].trim();
            }
            
            // Extract HR comment
            const hrMatch = currentRowText.match(/HR : ([^\n]*)/);
            if (hrMatch && hrMatch[1]) {
              hrComment = hrMatch[1].trim();
            }
            
            // Debug: Log what we captured from combined row
            console.log(`Captured from combined row for ${goalKraRaw}:`, {
              selfComment,
              pms1Comment,
              hrComment
            });
          } else {
            // Check next row for Self comment
            if (i + 1 < rows.length) {
              const nextRow = rows[i + 1];
              const nextRowText = (nextRow[0] || '').toString().trim();
              if (nextRowText.startsWith('Self :') && nextRowText.includes('[Auto Self Appraisal By HR]')) {
                selfComment = nextRowText;
              }
            }
            
            // Check next+1 row for pms_1 comment
            if (i + 2 < rows.length) {
              const pmsRow = rows[i + 2];
              const pmsRowText = (pmsRow[0] || '').toString().trim();
              
              // Debug: Log the pms row to see its structure
              console.log(`PMS Row for ${goalKraRaw}:`, pmsRow);
              
              if (pmsRowText.startsWith('pms_1 :')) {
                // Extract the comment text that comes after "pms_1 :"
                const commentText = pmsRowText.replace('pms_1 :', '').trim();
                
                // Also check other columns for additional comment text
                const additionalComment = (pmsRow[1] || '').toString().trim() || 
                                        (pmsRow[2] || '').toString().trim() || 
                                        (pmsRow[3] || '').toString().trim();
                
                // Check all columns in the pms row for any comment content
                let allColumnComments = '';
                for (let col = 0; col < pmsRow.length; col++) {
                  const colText = (pmsRow[col] || '').toString().trim();
                  if (colText && colText !== 'pms_1 :') {
                    allColumnComments += (allColumnComments ? ' ' : '') + colText;
                  }
                }
                // Remove the "pms_1 :" prefix if it's in the combined text
                allColumnComments = allColumnComments.replace('pms_1 :', '').trim();
                
                // Check if there are additional rows with more comments
                let extraComments = '';
                if (i + 3 < rows.length) {
                  const extraRow = rows[i + 3];
                  const extraRowText = (extraRow[0] || '').toString().trim();
                  // If the next row doesn't start with "HR :", it might be additional comment
                  if (!extraRowText.startsWith('HR :') && extraRowText) {
                    extraComments = extraRowText;
                  }
                }
                
                // Also check the next few rows for any additional comment content
                let additionalRowComments = '';
                for (let j = i + 3; j < Math.min(i + 6, rows.length); j++) {
                  const checkRow = rows[j];
                  const checkRowText = (checkRow[0] || '').toString().trim();
                  if (checkRowText && !checkRowText.startsWith('HR :') && !checkRowText.startsWith('Self :') && !checkRowText.startsWith('pms_1 :')) {
                    additionalRowComments += (additionalRowComments ? ' ' : '') + checkRowText;
                  }
                }
                
                // Combine all possible comment sources
                const fullComment = commentText || additionalComment || extraComments || additionalRowComments || allColumnComments;
                pms1Comment = fullComment || '';
                
                // Debug: Log what we captured
                console.log(`Captured pms_1 comment for ${goalKraRaw}:`, {
                  original: pmsRowText,
                  extracted: commentText,
                  additional: additionalComment,
                  extra: extraComments,
                  final: pms1Comment
                });
              }
            }
            
            // Check next+2 row for HR comment
            if (i + 3 < rows.length) {
              const hrRow = rows[i + 3];
              const hrRowText = (hrRow[0] || '').toString().trim();
              if (hrRowText.startsWith('HR :')) {
                // Extract the comment text that comes after "HR :"
                const commentText = hrRowText.replace('HR :', '').trim();
                // Also check other columns for additional comment text
                const additionalComment = (hrRow[1] || '').toString().trim() || 
                                        (hrRow[2] || '').toString().trim() || 
                                        (hrRow[3] || '').toString().trim();
                const fullComment = commentText || additionalComment;
                hrComment = fullComment || '';
              }
            }
          }
          
          // Additional check: Look for pms_1 content in the current row itself
          if (!pms1Comment && currentRowText.includes('pms_1 :')) {
            const pms1Match = currentRowText.match(/pms_1 : ([^\n]*)/);
            if (pms1Match && pms1Match[1]) {
              pms1Comment = pms1Match[1].trim();
              console.log(`Found pms_1 in current row for ${goalKraRaw}:`, pms1Comment);
            }
          }
          
          // Use pending pms_1 comment if we have one and current pms1Comment is empty
          if (!pms1Comment && pendingPms1Comment) {
            pms1Comment = pendingPms1Comment;
            console.log(`Using pending pms_1 comment for ${goalKraRaw}:`, pms1Comment);
            pendingPms1Comment = ''; // Clear after using
          }
          
          // Debug: Log what we're about to add
          console.log(`Adding ${KRA_LIST.includes(goalKra) ? 'KRA' : 'Goal'}:`, {
            name: row[0],
            score,
            selfComment,
            pms1Comment,
            hrComment
          });

          if (KRA_LIST.includes(goalKra)) {
            kraDetails.push({ name: row[0], score, selfComment, pms1Comment, hrComment });
          } else {
            // If it's not in KRA_LIST, it's a goal (including DEFAULT section goals)
            goalDetails.push({ name: row[0], score, selfComment, pms1Comment, hrComment });
          }
        }
        i++;
      }
      const kraScore = kraDetails.reduce((sum, k) => sum + k.score, 0);
      const goalScore = goalDetails.reduce((sum, g) => sum + g.score, 0);
      const maxKRA = kraDetails.length * 10;
      const maxGoal = goalDetails.length * 10;
      const maxTotal = maxKRA + maxGoal;
      const totalScore = kraScore + goalScore;
      const percentage = maxTotal ? parseFloat(((totalScore / maxTotal) * 100).toFixed(1)) : 0;
      const percentageOutOf10 = maxTotal ? parseFloat(((totalScore / maxTotal) * 10).toFixed(1)) : 0;
      
      // Debug logging
      console.log(`Employee: ${employeeName}`, {
        goals: goalDetails.map(g => ({ name: g.name, score: g.score, pms1Comment: g.pms1Comment })),
        kras: kraDetails.map(k => ({ name: k.name, score: k.score, pms1Comment: k.pms1Comment }))
      });
      
      employeeReports.push({
        employeeName,
        employeeCode,
        kraScore,
        goalScore,
        totalScore,
        maxKRA,
        maxGoal,
        maxTotal,
        percentage,
        percentageOutOf10,
        kraDetails,
        goalDetails,
        quarter,
        department,
        remark: remarks[employeeCode] || '',
      });
    });

    // Save to database
    const saveSuccess = await saveReportsToDatabase(employeeReports);
    
    if (saveSuccess) {
      // Always reload all data from the database after saving
      await loadReportsFromDatabase();
      toast({
        title: "Success",
        description: `Successfully generated and saved ${employeeReports.length} reports to the database.`,
      });
      // Clear upload section for new file
      setFile(null);
      setFileName('');
      setDepartment('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      toast({
        title: "Warning",
        description: "Reports generated but failed to save to database. Data will not persist.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  // Load existing data on component mount
  useEffect(() => {
    setLoading(true);
    loadReportsFromDatabase().finally(() => {
      setLoading(false);
    });
  }, []);

  const handleShowDetails = (report: EmployeeReport) => {
    setModalData(report);
    setShowModal(true);
  };

  // Download single employee data as Excel
  const handleDownloadEmployee = (report: EmployeeReport) => {
    // Helper function to create combined description cell with proper line breaks
    const createCombinedDescription = (item: { name: string; score: number; selfComment?: string; pms1Comment?: string; hrComment?: string }) => {
      const selfText = item.selfComment || 'Self : [Auto Self Appraisal By HR]';
      const pms1Text = item.pms1Comment ? `pms_1 : ${item.pms1Comment}` : 'pms_1 :';
      const hrText = item.hrComment ? `HR : ${item.hrComment}` : 'HR :';
      
      // Combine all three fields with proper line breaks
      return `${selfText}\n${pms1Text}\n${hrText}`;
    };

    // Build sheet data with 3-row structure per KRA/Goal
    const sheetData = [
      ['Goals/KSA/KRA', 'Out of', 'Manager Rating', '']
    ];

    // Add Goals with 3-row structure
    report.goalDetails.forEach(g => {
      // Row 1: Goal name with score
      sheetData.push([g.name, 10.00, g.score.toFixed(2), '']);
      // Row 2: Blank row for spacing
      sheetData.push(['', '', '', '']);
      // Row 3: Combined Self/pms_1/HR description
      sheetData.push([createCombinedDescription(g), '', '', '']);
    });

    // Add KRAs with 3-row structure
    report.kraDetails.forEach(k => {
      // Row 1: KRA name with score
      sheetData.push([k.name, 10.00, k.score.toFixed(2), '']);
      // Row 2: Blank row for spacing
      sheetData.push(['', '', '', '']);
      // Row 3: Combined Self/pms_1/HR description
      sheetData.push([createCombinedDescription(k), '', '', '']);
    });

    // Add totals
    sheetData.push([]);
    sheetData.push(['Total :', report.maxTotal.toFixed(2), report.totalScore.toFixed(2), '']);
    sheetData.push(['Total :', '100%', `${((report.totalScore / report.maxTotal) * 100).toFixed(0)}%`, '']);
    
    const ws = XLSXUtils.aoa_to_sheet(sheetData);
    
    // Set cell formatting for description cells (rows with combined content)
    const range = XLSXUtils.decode_range(ws['!ref'] || 'A1');
    for (let row = 1; row <= range.e.r; row++) {
      const cellRef = XLSXUtils.encode_cell({ r: row, c: 0 });
      if (ws[cellRef] && ws[cellRef].v && typeof ws[cellRef].v === 'string' && ws[cellRef].v.includes('\n')) {
        // Set text wrapping for cells with line breaks
        if (!ws[cellRef].s) ws[cellRef].s = {};
        ws[cellRef].s.alignment = { wrapText: true, vertical: 'top' };
      }
    }
    
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, ws, 'Details');
    // Use employee name for filename
    const fileName = `${report.employeeName.replace(/\s+/g, '_')}.xlsx`;
    XLSXWriteFile(wb, fileName);
  };

  // Download all/department data as Excel
  const handleDownloadAll = () => {
    setSelectedQuarter('all'); // Reset quarter selection
    setShowDeptDialog(true);
  };

  const handleConfirmDownload = () => {
    let filteredReports = reports;
    
    // Filter by department
    if (selectedDept !== 'all') {
      filteredReports = filteredReports.filter(r => r.department === selectedDept);
    }
    
    // Filter by quarter
    if (selectedQuarter !== 'all') {
      filteredReports = filteredReports.filter(r => r.quarter === selectedQuarter);
    }

    if (filteredReports.length === 0) {
      toast({
        title: "No data found",
        description: "No reports match the selected criteria.",
        variant: "destructive",
      });
      setShowDeptDialog(false);
      return;
    }

    const wb = XLSXUtils.book_new();
    
    // Summary sheet
    const summarySheet = [
      ['Quarter', 'Department', 'Employee Name', 'Employee Code', 'KRA Score', 'Goal Score', 'Total Score', 'Out Of', 'Score (/10)'],
      ...filteredReports.map(r => [r.quarter, r.department, r.employeeName, r.employeeCode, r.kraScore, r.goalScore, r.totalScore, r.maxTotal, r.percentageOutOf10])
    ];
    XLSXUtils.book_append_sheet(wb, XLSXUtils.aoa_to_sheet(summarySheet), 'Summary');
    
    // Employee sheets - use employee name only for worksheet name
    filteredReports.forEach((r, index) => {
      // Helper function to create combined description cell with proper line breaks
      const createCombinedDescription = (item: { name: string; score: number; selfComment?: string; pms1Comment?: string; hrComment?: string }) => {
        const selfText = item.selfComment || 'Self : [Auto Self Appraisal By HR]';
        const pms1Text = item.pms1Comment ? `pms_1 : ${item.pms1Comment}` : 'pms_1 :';
        const hrText = item.hrComment ? `HR : ${item.hrComment}` : 'HR :';
        
        // Combine all three fields with proper line breaks
        return `${selfText}\n${pms1Text}\n${hrText}`;
      };

      // Build sheet data with 3-row structure per KRA/Goal
      const sheetData = [
        ['Goals/KSA/KRA', 'Out of', 'Manager Rating', '']
      ];

      // Add Goals with 3-row structure
      r.goalDetails.forEach(g => {
        // Row 1: Goal name with score
        sheetData.push([g.name, 10.00, g.score.toFixed(2), '']);
        // Row 2: Blank row for spacing
        sheetData.push(['', '', '', '']);
        // Row 3: Combined Self/pms_1/HR description
        sheetData.push([createCombinedDescription(g), '', '', '']);
      });

      // Add KRAs with 3-row structure
      r.kraDetails.forEach(k => {
        // Row 1: KRA name with score
        sheetData.push([k.name, 10.00, k.score.toFixed(2), '']);
        // Row 2: Blank row for spacing
        sheetData.push(['', '', '', '']);
        // Row 3: Combined Self/pms_1/HR description
        sheetData.push([createCombinedDescription(k), '', '', '']);
      });

      // Add totals
      sheetData.push([]);
      sheetData.push(['Total :', r.maxTotal.toFixed(2), r.totalScore.toFixed(2), '']);
      sheetData.push(['Total :', '100%', `${((r.totalScore / r.maxTotal) * 100).toFixed(0)}%`, '']);
      
      const ws = XLSXUtils.aoa_to_sheet(sheetData);
      
      // Set cell formatting for description cells (rows with combined content)
      const range = XLSXUtils.decode_range(ws['!ref'] || 'A1');
      for (let row = 1; row <= range.e.r; row++) {
        const cellRef = XLSXUtils.encode_cell({ r: row, c: 0 });
        if (ws[cellRef] && ws[cellRef].v && typeof ws[cellRef].v === 'string' && ws[cellRef].v.includes('\n')) {
          // Set text wrapping for cells with line breaks
          if (!ws[cellRef].s) ws[cellRef].s = {};
          ws[cellRef].s.alignment = { wrapText: true, vertical: 'top' };
          // Set row height to accommodate multiple lines
          if (!ws['!rows']) ws['!rows'] = [];
          ws['!rows'][row] = { hpt: '60' }; // Set row height to 60 points
        }
      }
      
      // Use employee name only for worksheet name
      const worksheetName = r.employeeName.replace(/\s+/g, '_');
      
      XLSXUtils.book_append_sheet(wb, ws, worksheetName);
    });

    // Generate filename based on quarter name
    let filename = 'PMS_Report';
    if (selectedQuarter !== 'all') {
      filename = `${selectedQuarter.replace(/\s+/g, '_')}_PMS_Report`;
    }
    if (selectedDept !== 'all') {
      filename += `_${selectedDept}`;
    }
    filename += '.xlsx';

    XLSXWriteFile(wb, filename);
    setShowDeptDialog(false);
    
    toast({
      title: "Download successful",
      description: `Report downloaded with ${filteredReports.length} employee(s).`,
    });
  };

  // Edit remark handlers
  const handleEditRemark = (employeeCode: string, currentRemark: string) => {
    setEditingRemark(employeeCode);
    setRemarkInput(currentRemark || '');
  };

  // Update remark in database
  const updateRemarkInDatabase = async (employeeCode: string, remark: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('pms_quarterly_reports')
        .update({ remark })
        .eq('employee_code', employeeCode)
        .eq('uploaded_by', user.id);

      if (error) {
        console.error('Error updating remark:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating remark in database:', error);
      return false;
    }
  };

  const handleSaveRemark = async (employeeCode: string) => {
    setRemarks(prev => ({ ...prev, [employeeCode]: remarkInput }));
    setEditingRemark(null);
    setReports(reports.map(r => r.employeeCode === employeeCode ? { ...r, remark: remarkInput } : r));
    if (modalData && modalData.employeeCode === employeeCode) {
      setModalData({ ...modalData, remark: remarkInput });
    }

    // Save to database
    const success = await updateRemarkInDatabase(employeeCode, remarkInput);
    if (success) {
      toast({
        title: "Success",
        description: "Remark saved successfully.",
      });
    } else {
      toast({
        title: "Warning",
        description: "Remark updated locally but failed to save to database.",
        variant: "destructive",
      });
    }
  };

  const handleCancelRemark = () => {
    setEditingRemark(null);
    setRemarkInput('');
  };

  return (
    <div className="p-6 relative bg-slate-50 dark:bg-slate-900 h-screen overflow-hidden">
      {/* Full-screen loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-8 flex flex-col items-center space-y-4 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            <p className="text-lg font-semibold text-gray-700 dark:text-slate-200">Processing...</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">Please wait while we generate your report</p>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex flex-col h-full">
        {/* Upload and Download Row */}
        <div className="flex flex-row items-center bg-white dark:bg-slate-900 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mb-6 flex-shrink-0">
        <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            ref={fileInputRef}
            id="pms-file-upload"
          />
          <Button
            type="button"
            className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white h-10"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={loading}
          >
            Choose File
          </Button>
          {file && <span className="ml-2 truncate text-slate-800 dark:text-slate-200">{fileName}</span>}
          <Button
            className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white h-10"
            onClick={handleGenerateReport}
            disabled={!file || loading}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
        {reports.length > 0 && (
          <div className="flex flex-row items-center gap-2 ml-4">
            <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-semibold px-2 py-1 rounded-full h-7 flex items-center border border-blue-200 dark:border-blue-800">
              {reports.length}
            </span>
            <Button
              className="flex items-center space-x-2 bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white h-10"
              onClick={handleDownloadAll}
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
          </div>
        )}
      </div>

      {/* Reports Table Section */}
      {reports.length > 0 && !loading && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex-1 overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto h-full w-full block" style={{ WebkitOverflowScrolling: 'touch' }}>
            <Table className="min-w-[900px] border border-slate-200 dark:border-slate-700">
              <TableHeader className="sticky top-0 z-20 bg-white dark:bg-slate-800 shadow border-t border-slate-200 dark:border-slate-700">
                <TableRow className="border-b border-slate-200 dark:border-slate-700">
                  <TableHead className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">Quarter</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">Department</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">Employee Name</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">Employee Code</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">KRA Score</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">Goal Score</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">Total Score</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">Total Out Of</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">Percentage</TableHead>
                  <TableHead className="whitespace-nowrap text-slate-700 dark:text-slate-200">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r, idx) => (
                  <TableRow key={idx} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/60 transition-colors">
                    <TableCell className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{r.quarter}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{r.department}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{r.employeeName}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{r.employeeCode}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{r.kraScore} / {r.maxKRA}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{r.goalScore} / {r.maxGoal}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{r.totalScore}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{r.maxTotal}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{r.percentageOutOf10} / 10</TableCell>
                    <TableCell className="whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => handleShowDetails(r)} className="hover:text-amber-400 dark:hover:text-amber-300">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDownloadEmployee(r)} className="hover:text-green-600 dark:hover:text-green-400">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* No Reports Message */}
      {reports.length === 0 && !loading && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-center flex-1 flex items-center justify-center">
          <div>
            <div className="text-gray-500 dark:text-slate-400 mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">No Reports Available</h3>
            <p className="text-gray-500 dark:text-slate-400 mb-4">
              {file 
                ? "Click 'Generate Report' to process your uploaded file and add reports to the database."
                : "Upload an Excel file and click 'Generate Report' to create quarterly PMS reports."
              }
            </p>
          </div>
        </div>
      )}
        </div>

      {/* Modal for details */}
      {showModal && modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-lg w-full max-w-2xl relative border border-slate-700">
            <div className="sticky top-0 z-10 bg-slate-900 p-6 pb-2 flex items-center justify-between rounded-t-lg border-b border-slate-700">
              <h3 className="text-lg font-bold text-slate-100">
                {modalData.employeeName} {modalData.employeeCode && (<span className="text-slate-400">- {modalData.employeeCode}</span>)} - Details
              </h3>
              <button
                className="text-slate-400 hover:text-red-400 text-2xl ml-4"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-6 pt-2 max-h-[70vh] overflow-y-auto">
              <div className="mb-4">
                <strong className="text-slate-200">KRA Scores</strong>
                <Table className="w-full border mt-2 mb-4 border-slate-700">
                  <TableHeader className="bg-slate-800">
                    <TableRow>
                      <TableHead className="border border-slate-700 text-slate-200">KRA</TableHead>
                      <TableHead className="border border-slate-700 text-slate-200">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modalData.kraDetails.map((k, i) => (
                      <TableRow key={i} className="bg-slate-900 hover:bg-slate-800 transition-colors">
                        <TableCell className="border border-slate-700 text-slate-100">{toProperCaseWithQuotes(k.name)}</TableCell>
                        <TableCell className="border border-slate-700 text-slate-100">{k.score}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="border border-slate-700 font-semibold text-amber-200">Total</TableCell>
                      <TableCell className="border border-slate-700 font-semibold text-amber-200">{modalData.kraScore} / {modalData.maxKRA}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div>
                <strong className="text-slate-200">Goal Scores</strong>
                <Table className="w-full border mt-2 border-slate-700">
                  <TableHeader className="bg-slate-800">
                    <TableRow>
                      <TableHead className="border border-slate-700 text-slate-200">Goal</TableHead>
                      <TableHead className="border border-slate-700 text-slate-200">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modalData.goalDetails.map((g, i) => (
                      <TableRow key={i} className="bg-slate-900 hover:bg-slate-800 transition-colors">
                        <TableCell className="border border-slate-700 text-slate-100">{toProperCaseWithQuotes(g.name)}</TableCell>
                        <TableCell className="border border-slate-700 text-slate-100">{g.score}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="border border-slate-700 font-semibold text-amber-200">Total</TableCell>
                      <TableCell className="border border-slate-700 font-semibold text-amber-200">{modalData.goalScore} / {modalData.maxGoal}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 p-3 border rounded bg-slate-800 border-slate-700 flex flex-col items-end">
                <span className="font-semibold text-slate-200">Overall Total: {modalData.totalScore} / {modalData.maxTotal}</span>
                <span className="font-semibold text-slate-200">Score: {modalData.percentageOutOf10} / 10</span>
                {editingRemark === modalData.employeeCode ? (
                  <div className="flex items-center space-x-2 mt-2 w-full justify-end">
                    <input
                      className="border border-slate-700 rounded px-2 py-1 text-sm bg-slate-900 text-slate-100"
                      value={remarkInput}
                      onChange={e => setRemarkInput(e.target.value)}
                      autoFocus
                    />
                    <Button size="sm" className="px-2 py-1 bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white" onClick={() => handleSaveRemark(modalData.employeeCode)}>Save</Button>
                    <Button size="sm" variant="outline" className="px-2 py-1 border-slate-700 text-slate-200 bg-slate-800 hover:bg-slate-700" onClick={handleCancelRemark}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 mt-2 w-full justify-end">
                    {modalData.remark && <span className="font-semibold text-slate-200">Remark: {modalData.remark}</span>}
                    <button onClick={() => handleEditRemark(modalData.employeeCode, modalData.remark || '')} className="hover:text-amber-400">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Department selection dialog */}
      {showDeptDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-lg p-6 w-full max-w-md relative border border-slate-700">
            <h3 className="text-lg font-bold mb-4 text-slate-100">Download PMS Report</h3>
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-slate-200">Select Department</label>
              <select
                className="border border-slate-700 p-2 rounded w-full bg-slate-800 text-slate-100"
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
              >
                <option value="all">All Departments</option>
                {Array.from(new Set(reports.map(r => r.department))).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-slate-200">Select Quarter</label>
              <select
                className="border border-slate-700 p-2 rounded w-full bg-slate-800 text-slate-100"
                value={selectedQuarter}
                onChange={e => setSelectedQuarter(e.target.value)}
              >
                <option value="all">All Quarters</option>
                {Array.from(new Set(reports.map(r => r.quarter))).sort().map(quarter => (
                  <option key={quarter} value={quarter}>{quarter}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-slate-400 mb-4 p-3 bg-slate-800 rounded">
              <strong>Tip:</strong> Select a specific quarter to avoid worksheet name conflicts and get a more focused report.
            </div>
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 bg-slate-700 text-slate-200 rounded hover:bg-slate-800" 
                onClick={() => setShowDeptDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-amber-600 dark:bg-slate-700 text-white rounded hover:bg-amber-700 dark:hover:bg-slate-600" 
                onClick={handleConfirmDownload}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PMSQuarterlyReport; 