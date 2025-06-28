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
  kraDetails: { name: string; score: number }[];
  goalDetails: { name: string; score: number }[];
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
            .map((d: any) => ({ name: d.name, score: d.score }));
          
          const goalDetails = saved.details
            .filter((d: any) => d.type === 'GOAL')
            .map((d: any) => ({ name: d.name, score: d.score }));

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
        }));

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
        }));

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
      const empRaw = (rows[3]?.[0] || '').toString().trim();
      if (!empRaw) return;
      let employeeName = empRaw;
      let employeeCode = '';
      if (empRaw.includes(' - ')) {
        const parts = empRaw.split(' - ');
        employeeName = parts[0].trim();
        employeeCode = parts[1]?.trim() || '';
      }
      let kraDetails: { name: string; score: number }[] = [];
      let goalDetails: { name: string; score: number }[] = [];
      let i = 5;
      while (i < rows.length) {
        const row = rows[i];
        const goalKraRaw = row[0] || '';
        const goalKra = goalKraRaw.toString().trim().toLowerCase();
        const score = parseFloat(row[2]) || 0;
        const isValidName = goalKra && goalKra !== 'default' && !goalKra.startsWith('self') && !goalKra.startsWith('hr') && goalKra.replace(/['"\s]/g, '') !== '' && !goalKra.includes('total');
        if (isValidName) {
          if (KRA_LIST.includes(goalKra)) {
            kraDetails.push({ name: row[0], score });
          } else {
            goalDetails.push({ name: row[0], score });
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
    const sheetData = [
      ['Goals/KSA/KRA', 'Score'],
      ...report.goalDetails.map(g => [g.name, g.score]),
      ['KRA', 'Score'],
      ...report.kraDetails.map(k => [k.name, k.score]),
      [],
      ['KRA Total', report.kraScore],
      ['Goal Total', report.goalScore],
      ['Overall Total', report.totalScore],
      ['Out Of', report.maxTotal],
      ['Score (/10)', report.percentageOutOf10],
    ];
    const ws = XLSXUtils.aoa_to_sheet(sheetData);
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, ws, 'Details');
    XLSXWriteFile(wb, `${report.employeeName.replace(/\s+/g, '_')}_${report.employeeCode}.xlsx`);
  };

  // Download all/department data as Excel
  const handleDownloadAll = () => {
    setShowDeptDialog(true);
  };

  const handleConfirmDownload = () => {
    let filteredReports = reports;
    if (selectedDept !== 'all') {
      filteredReports = reports.filter(r => r.department === selectedDept);
    }
    const wb = XLSXUtils.book_new();
    // Summary sheet
    const summarySheet = [
      ['Department', 'Employee Name', 'Employee Code', 'KRA Score', 'Goal Score', 'Total Score', 'Out Of', 'Score (/10)'],
      ...filteredReports.map(r => [r.department, r.employeeName, r.employeeCode, r.kraScore, r.goalScore, r.totalScore, r.maxTotal, r.percentageOutOf10])
    ];
    XLSXUtils.book_append_sheet(wb, XLSXUtils.aoa_to_sheet(summarySheet), 'Summary');
    // Employee sheets
    filteredReports.forEach(r => {
      const sheetData = [
        ['Goals/KSA/KRA', 'Score'],
        ...r.goalDetails.map(g => [g.name, g.score]),
        ['KRA', 'Score'],
        ...r.kraDetails.map(k => [k.name, k.score]),
        [],
        ['KRA Total', r.kraScore],
        ['Goal Total', r.goalScore],
        ['Overall Total', r.totalScore],
        ['Out Of', r.maxTotal],
        ['Score (/10)', r.percentageOutOf10],
      ];
      XLSXUtils.book_append_sheet(wb, XLSXUtils.aoa_to_sheet(sheetData), `${r.employeeName.replace(/\s+/g, '_')}_${r.employeeCode}`);
    });
    XLSXWriteFile(wb, selectedDept === 'all' ? 'All_Departments_PMS_Report.xlsx' : `${selectedDept}_PMS_Report.xlsx`);
    setShowDeptDialog(false);
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
    <div className="p-6 relative">
      {/* Full-screen loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            <p className="text-lg font-semibold text-gray-700">Processing...</p>
            <p className="text-sm text-gray-500">Please wait while we generate your report</p>
          </div>
        </div>
      )}

      {/* Upload and Download Row */}
      <div className="flex flex-row items-center bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm mb-6">
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
            className="professional-button h-10"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={loading}
          >
            Choose File
          </Button>
          {file && <span className="ml-2 truncate">{fileName}</span>}
          <Button
            className="professional-button h-10"
            onClick={handleGenerateReport}
            disabled={!file || loading}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
        {reports.length > 0 && (
          <div className="flex flex-row items-center gap-2 ml-4">
            <span className="inline-block bg-yellow-400 text-white text-xs font-semibold px-2 py-1 rounded-full h-7 flex items-center">
              {reports.length}
            </span>
            <Button
              className="flex items-center space-x-2 professional-button h-10"
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
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="overflow-x-auto overflow-y-auto max-h-[61vh] w-full block" style={{ WebkitOverflowScrolling: 'touch' }}>
            <Table className="min-w-[900px] border border-gray-200">
              <TableHeader className="sticky top-0 z-20 bg-white shadow border-t border-gray-200">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="whitespace-nowrap border-r border-gray-200">Quarter</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-gray-200">Department</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-gray-200">Employee Name</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-gray-200">Employee Code</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-gray-200">KRA Score</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-gray-200">Goal Score</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-gray-200">Total Score</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-gray-200">Total Out Of</TableHead>
                  <TableHead className="whitespace-nowrap border-r border-gray-200">Percentage</TableHead>
                  <TableHead className="whitespace-nowrap">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r, idx) => (
                  <TableRow key={idx} className="border-b border-gray-200">
                    <TableCell className="whitespace-nowrap border-r border-gray-200">{r.quarter}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-gray-200">{r.department}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-gray-200">{r.employeeName}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-gray-200">{r.employeeCode}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-gray-200">{r.kraScore} / {r.maxKRA}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-gray-200">{r.goalScore} / {r.maxGoal}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-gray-200">{r.totalScore}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-gray-200">{r.maxTotal}</TableCell>
                    <TableCell className="whitespace-nowrap border-r border-gray-200">{r.percentageOutOf10} / 10</TableCell>
                    <TableCell className="whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => handleShowDetails(r)} className="hover:text-amber-600">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDownloadEmployee(r)} className="hover:text-green-600">
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
        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Available</h3>
          <p className="text-gray-500 mb-4">
            {file 
              ? "Click 'Generate Report' to process your uploaded file and add reports to the database."
              : "Upload an Excel file and click 'Generate Report' to create quarterly PMS reports."
            }
          </p>
        </div>
      )}

      {/* Modal for details */}
      {showModal && modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl relative">
            <div className="sticky top-0 z-10 bg-white p-6 pb-2 flex items-center justify-between rounded-t-lg border-b">
              <h3 className="text-lg font-bold">
                {modalData.employeeName} {modalData.employeeCode && (<span className="text-gray-500">- {modalData.employeeCode}</span>)} - Details
              </h3>
              <button
                className="text-gray-500 hover:text-red-500 text-2xl ml-4"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-6 pt-2 max-h-[70vh] overflow-y-auto">
              <div className="mb-4">
                <strong>KRA Scores</strong>
                <Table className="w-full border mt-2 mb-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="border">KRA</TableHead>
                      <TableHead className="border">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modalData.kraDetails.map((k, i) => (
                      <TableRow key={i}>
                        <TableCell className="border">{toProperCaseWithQuotes(k.name)}</TableCell>
                        <TableCell className="border">{k.score}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="border font-semibold">Total</TableCell>
                      <TableCell className="border font-semibold">{modalData.kraScore} / {modalData.maxKRA}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div>
                <strong>Goal Scores</strong>
                <Table className="w-full border mt-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="border">Goal</TableHead>
                      <TableHead className="border">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modalData.goalDetails.map((g, i) => (
                      <TableRow key={i}>
                        <TableCell className="border">{toProperCaseWithQuotes(g.name)}</TableCell>
                        <TableCell className="border">{g.score}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="border font-semibold">Total</TableCell>
                      <TableCell className="border font-semibold">{modalData.goalScore} / {modalData.maxGoal}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 p-3 border rounded bg-slate-50 flex flex-col items-end">
                <span className="font-semibold">Overall Total: {modalData.totalScore} / {modalData.maxTotal}</span>
                <span className="font-semibold">Score: {modalData.percentageOutOf10} / 10</span>
                {editingRemark === modalData.employeeCode ? (
                  <div className="flex items-center space-x-2 mt-2 w-full justify-end">
                    <input
                      className="border rounded px-2 py-1 text-sm"
                      value={remarkInput}
                      onChange={e => setRemarkInput(e.target.value)}
                      autoFocus
                    />
                    <Button size="sm" className="px-2 py-1" onClick={() => handleSaveRemark(modalData.employeeCode)}>Save</Button>
                    <Button size="sm" variant="outline" className="px-2 py-1" onClick={handleCancelRemark}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 mt-2 w-full justify-end">
                    {modalData.remark && <span className="font-semibold">Remark: {modalData.remark}</span>}
                    <button onClick={() => handleEditRemark(modalData.employeeCode, modalData.remark || '')} className="hover:text-amber-600">
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
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <h3 className="text-lg font-bold mb-4">Download PMS Report</h3>
            <label className="block mb-2 font-semibold">Select Department</label>
            <select
              className="border p-2 rounded w-full mb-4"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
            >
              <option value="all">All Departments</option>
              {Array.from(new Set(reports.map(r => r.department))).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowDeptDialog(false)}>Cancel</button>
              <button className="px-4 py-2 bg-amber-500 text-white rounded" onClick={handleConfirmDownload}>Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PMSQuarterlyReport; 