import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';

const SalaryBreakup: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [customPersonName, setCustomPersonName] = useState('');
  const [showCustomPersonInput, setShowCustomPersonInput] = useState(false);
  const [salary, setSalary] = useState<number | ''>('');
  const [breakup, setBreakup] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [salaryScales, setSalaryScales] = useState<any[]>([]);
  const [selectedScale, setSelectedScale] = useState<any>(null);
  const [savedBreakups, setSavedBreakups] = useState<any[]>([]);
  const [viewBreakup, setViewBreakup] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('join_date', { ascending: false });
      if (!error && data) setEmployees(data);
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchScales = async () => {
      const { data, error } = await supabase
        .from('salary_scales')
        .select('*')
        .order('min_salary', { ascending: true });
      if (!error && data) setSalaryScales(data);
    };
    fetchScales();
  }, []);

  const fetchSavedBreakups = async () => {
    const { data, error } = await supabase
      .from('employee_salary_breakups')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setSavedBreakups(data);
  };

  useEffect(() => { fetchSavedBreakups(); }, []);

  const getScale = (gross: number) => {
    return salaryScales.find((scale) => gross * 12 >= scale.min_salary && (scale.max_salary === null || gross * 12 <= scale.max_salary));
  };

  const handleCalculate = () => {
    if ((!selectedEmployee && !customPersonName) || !salary || typeof salary !== 'number') return;
    const scale = getScale(salary);
    setSelectedScale(scale);
    if (scale && Array.isArray(scale.components)) {
      let components = scale.components;
      if (typeof components === 'string') {
        try {
          components = JSON.parse(components);
        } catch {
          setBreakup(null);
          return;
        }
      }
      // If this is scale 2, override HRA percent to 17.5% in the values calculation
      const isScale2 = scale.name && scale.name.toLowerCase().includes('scale 2');
      const isScale3 = scale.name && scale.name.toLowerCase().includes('scale 3');
      if (isScale2) {
        console.log('Scale 2 Debug:', { scale, components, salary });
      }
      // Mutate components for scale 2 and scale 3 to ensure correct display and calculation
      if (isScale2) {
        components = components.map((comp: any) => {
          if (comp.key.toLowerCase() === 'hra') return { ...comp, value: 0.175 };
          if (comp.key.toLowerCase() === 'cea') return { ...comp, value: 200, type: 'fixed' };
          if (comp.key.toLowerCase() === 'conveyance') return { ...comp, value: 0.03, type: 'percent' };
          return comp;
        });
      }
      if (isScale3) {
        components = components.map((comp: any) => {
          if (comp.key.toLowerCase() === 'hra') return { ...comp, value: 0.24 };
          if (comp.key.toLowerCase() === 'cea') return { ...comp, value: 200, type: 'fixed' };
          if (comp.key.toLowerCase() === 'conveyance') return { ...comp, value: 2000, type: 'fixed' };
          if (comp.key.toLowerCase() === 'telephonic') return { ...comp, value: 1000, type: 'fixed' };
          return comp;
        });
      }
      const values: any = {};
      components.forEach((comp: any) => {
        if (comp.key.toLowerCase() === 'hra' && isScale2) {
          values[comp.key] = salary * 0.175;
        } else if (comp.key.toLowerCase() === 'cea' && (isScale2 || isScale3)) {
          values[comp.key] = 200;
        } else if (comp.key.toLowerCase() === 'conveyance' && isScale2) {
          values[comp.key] = salary * 0.03;
        } else if (comp.key.toLowerCase() === 'conveyance' && isScale3) {
          values[comp.key] = 2000;
        } else if (comp.key.toLowerCase() === 'telephonic' && isScale3) {
          values[comp.key] = 1000;
        } else if (comp.type === 'percent') {
          values[comp.key] = salary * comp.value;
        } else if (comp.type === 'fixed') {
          values[comp.key] = comp.value;
        } else if (comp.type === 'balance') {
          const sum = Object.keys(values).reduce((acc, key) => acc + (values[key] || 0), 0);
          values[comp.key] = salary - sum;
        }
      });
      if (isScale2) {
        console.log('Scale 2 Calculated Values:', values);
      }
      // Fixed values for deductions and bonus
      const pf = 1800;
      const pt = 200;
      const netPay = salary - pf - pt;
      const employerPf = 1800;
      const bonus = salary; // Bonus is monthly gross salary
      const pli = '5% - 7%';
      // CTC: Gross Salary + Employer PF + Bonus (monthly and annual)
      const ctc = salary + employerPf + bonus;
      const ctcAnnual = (salary + employerPf) * 12 + bonus * 12;
      setBreakup({
        components: values,
        gross_salary: salary,
        deductions: { PF: pf, PT: pt },
        net_pay: netPay,
        employer_contribution_pf: employerPf,
        bonus,
        pli,
        ctc,
        ctc_annual: ctcAnnual,
      });
    } else {
      setBreakup(null);
    }
  };

  const handleSave = async () => {
    if ((!selectedEmployee && !customPersonName) || !salary || !breakup) return;
    setSaving(true);
    
    const personData = {
      employee_id: selectedEmployee?.id || null,
      name: selectedEmployee?.name || customPersonName,
      designation: selectedEmployee?.position || 'Custom Person',
      date_of_joining: selectedEmployee?.join_date || null,
      salary_input: salary,
      breakup,
    };
    
    await supabase.from('employee_salary_breakups').insert([personData]);
    setSaving(false);
    fetchSavedBreakups();
    // Reset fields for next entry
    setSelectedEmployee(null);
    setCustomPersonName('');
    setShowCustomPersonInput(false);
    setSalary('');
    setBreakup(null);
    setSearch('');
  };

  const handleCustomPersonSelect = () => {
    setShowCustomPersonInput(true);
    setSelectedEmployee(null);
    setDropdownOpen(false);
  };

  const handleCustomPersonSubmit = () => {
    if (customPersonName.trim()) {
      setShowCustomPersonInput(false);
      setSearch(customPersonName);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    (emp.position && emp.position.toLowerCase().includes(search.toLowerCase()))
  );

  // Compute all unique component keys across all saved breakups for consistent headers
  const allComponentKeys = Array.from(new Set(
    savedBreakups.flatMap(entry => entry.breakup && entry.breakup.components ? Object.keys(entry.breakup.components) : [])
  ));

  // Utility function to format table headers
  const formatHeader = (key) => {
    const upperKeys = ['hra', 'pf', 'pt', 'ctc', 'doj', 'sa', 'pli', 'cea', 'basic'];
    if (upperKeys.includes(key.toLowerCase())) return key.toUpperCase();
    // Proper case for other keys
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="p-6 max-w-full mx-auto bg-slate-50 dark:bg-slate-900 min-h-screen">
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg">
        {/* <CardHeader>
          <CardTitle>Salary Breakup</CardTitle>
        </CardHeader> */}
        <CardContent>
          {/* Searchable Dropdown */}
          <div className="mb-1 flex flex-col md:flex-row md:items-end md:space-x-6" style={{ minHeight: 'unset', paddingTop: '6px', paddingBottom: 0 }}>
            <div className="flex-1 mb-2 md:mb-0" style={{ position: 'relative' }}>
              <label className="block mb-1 font-medium text-slate-800 dark:text-slate-200">Select Employee</label>
              <Input
                type="text"
                placeholder="Type to search employee..."
                value={search}
                onChange={e => { setSearch(e.target.value); setDropdownOpen(true); }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              {dropdownOpen && (
                <div className="border rounded bg-white dark:bg-slate-800 max-h-40 overflow-y-auto mt-1 shadow border-slate-200 dark:border-slate-700" style={{ position: 'absolute', width: '100%', top: '100%', left: 0, zIndex: 50 }}>
                  {/* Custom Person Option */}
                  <div
                    className="px-3 py-2 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900 border-b border-slate-200 dark:border-slate-700 font-semibold text-amber-600 dark:text-amber-400"
                    onMouseDown={handleCustomPersonSelect}
                  >
                    + Add Custom Person
                  </div>
                  {filteredEmployees.map(emp => (
                    <div
                      key={emp.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900 ${selectedEmployee && selectedEmployee.id === emp.id ? 'bg-amber-50 dark:bg-amber-900/30 font-semibold' : ''}`}
                      onMouseDown={() => { setSelectedEmployee(emp); setSearch(emp.name); setDropdownOpen(false); }}
                    >
                      {emp.name} <span className="text-xs text-slate-500 dark:text-slate-400">({emp.position})</span>
                    </div>
                  ))}
                  {filteredEmployees.length === 0 && <div className="px-3 py-2 text-slate-400 dark:text-slate-500">No employees found</div>}
                </div>
              )}
              
              {/* Custom Person Name Input */}
              {showCustomPersonInput && (
                <div className="mt-2 p-3 border rounded bg-amber-50 dark:bg-slate-800 border-amber-200 dark:border-slate-700">
                  <label className="block mb-1 font-medium text-sm text-slate-800 dark:text-slate-200">Enter Person Name</label>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      value={customPersonName}
                      onChange={e => setCustomPersonName(e.target.value)}
                      placeholder="Enter person name"
                      onKeyPress={e => e.key === 'Enter' && handleCustomPersonSubmit()}
                      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <Button 
                      onClick={handleCustomPersonSubmit}
                      disabled={!customPersonName.trim()}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      Add
                    </Button>
                    <Button 
                      onClick={() => { setShowCustomPersonInput(false); setCustomPersonName(''); }}
                      variant="outline"
                      className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {(selectedEmployee || customPersonName) && (
              <div className="flex-1">
                <label className="block mb-1 font-medium text-slate-800 dark:text-slate-200">Enter Gross Monthly Salary</label>
                <Input
                  type="number"
                  value={salary}
                  onChange={e => setSalary(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Enter gross monthly salary"
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            )}
            {(selectedEmployee || customPersonName) && (
              <div className="flex-1 flex items-end space-x-2">
                                 <Button onClick={handleCalculate} disabled={!salary || (!selectedEmployee && !customPersonName)} className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white">Calculate</Button>
                {breakup && (
                                      <Button onClick={handleSave} className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                )}
                                  <Button onClick={() => { setSelectedEmployee(null); setCustomPersonName(''); setShowCustomPersonInput(false); setSalary(''); setBreakup(null); setSearch(''); }} className="bg-amber-600 dark:bg-slate-700 hover:bg-amber-700 dark:hover:bg-slate-600 text-white">Clear</Button>
              </div>
            )}
          </div>

          {/* Show Employee Details and Breakup */}
          {(selectedEmployee || customPersonName) && breakup && (
            <div className="mt-8">
              <Card className="shadow-md max-w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" style={{ width: '100%' }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg text-slate-800 dark:text-white">{selectedEmployee?.name || customPersonName}</div>
                      <div className="text-slate-600 dark:text-slate-300 text-sm">{selectedEmployee?.position || 'Custom Person'}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs">DOJ: {selectedEmployee?.join_date ? new Date(selectedEmployee.join_date).toLocaleDateString() : '-'}</div>
                    </div>
                    <Button variant="ghost" onClick={() => setShowModal(true)}><Eye className="w-5 h-5" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                    <Table className="min-w-max border border-slate-200 dark:border-slate-700" style={{ minWidth: 900 }}>
                      <TableHeader className="bg-slate-100 dark:bg-slate-800">
                        <TableRow>
                          {selectedScale && Array.isArray(selectedScale.components) && selectedScale.components.map((comp: any) => (
                            <TableHead key={comp.key} className="text-slate-700 dark:text-slate-200">{comp.label}</TableHead>
                          ))}
                          <TableHead className="text-slate-700 dark:text-slate-200">Gross Salary</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-200">PF</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-200">PT</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-200">Net Pay</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-200">Employer PF</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-200">CTC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          {selectedScale && Array.isArray(selectedScale.components) && (() => {
                            const order = ['basic', 'hra', 'cea', 'conveyance', 'telephonic', 'sa', 'special allowance'];
                            const compMap = Object.fromEntries(selectedScale.components.map((c: any) => [c.key.toLowerCase(), c]));
                            const ordered = order
                              .map(key => compMap[key])
                              .filter(Boolean);
                            const rest = selectedScale.components.filter((c: any) => !order.includes(c.key.toLowerCase()));
                            return [...ordered, ...rest].map((comp: any) => (
                              <TableCell key={comp.key} className="text-slate-800 dark:text-white">{typeof breakup.components[comp.key] === 'number' ? formatCurrency(breakup.components[comp.key]) : '-'}</TableCell>
                            ));
                          })()}
                          <TableCell className="text-slate-800 dark:text-white">{formatCurrency(breakup.gross_salary)}</TableCell>
                          <TableCell className="text-slate-800 dark:text-white">{formatCurrency(breakup.deductions.PF)}</TableCell>
                          <TableCell className="text-slate-800 dark:text-white">{formatCurrency(breakup.deductions.PT)}</TableCell>
                          <TableCell className="text-slate-800 dark:text-white">{formatCurrency(breakup.net_pay)}</TableCell>
                          <TableCell className="text-slate-800 dark:text-white">{formatCurrency(breakup.employer_contribution_pf)}</TableCell>
                          <TableCell className="text-slate-800 dark:text-white">{formatCurrency(breakup.ctc)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List of all saved breakups */}
      <div className="mt-2">
        <Card className="max-w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg" style={{ width: '100%' }}>
          {/* <CardHeader>
            <CardTitle>All Saved Salary Breakups</CardTitle>
          </CardHeader> */}
          <CardContent style={{ paddingTop: '10px' }}>
            <div className="overflow-x-auto" style={{ maxWidth: '100%', maxHeight: '380px', overflowY: 'auto' }}>
              <Table className="w-full min-w-full border border-slate-200 dark:border-slate-700">
                <TableHeader className="sticky top-0 z-20 bg-white dark:bg-slate-900 shadow border-t border-slate-200 dark:border-slate-700">
                  <TableRow className="border-b border-slate-200 dark:border-slate-700">
                    <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-20 text-slate-700 dark:text-slate-200">Name</TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-20 text-slate-700 dark:text-slate-200">Designation</TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-20 text-slate-700 dark:text-slate-200">DOJ</TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-20 text-slate-700 dark:text-slate-200">Salary</TableHead>
                    {/* Show all unique breakup component keys as columns */}
                    {allComponentKeys.map((key: string) => (
                      <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-20 whitespace-nowrap text-slate-700 dark:text-slate-200" key={key}>{formatHeader(key)}</TableHead>
                    ))}
                    <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-20 text-slate-700 dark:text-slate-200">Gross Salary</TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-20 text-slate-700 dark:text-slate-200">PF</TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-20 text-slate-700 dark:text-slate-200">PT</TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-20 text-slate-700 dark:text-slate-200">Net Pay</TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-20 text-slate-700 dark:text-slate-200">Employer PF</TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-20 text-slate-700 dark:text-slate-200">CTC</TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-900 z-20 text-slate-700 dark:text-slate-200">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedBreakups.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="border-r border-slate-200 dark:border-slate-700 whitespace-nowrap text-slate-800 dark:text-white">{entry.name}</TableCell>
                      <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{entry.designation}</TableCell>
                      <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">{entry.date_of_joining ? new Date(entry.date_of_joining).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{formatCurrency(entry.salary_input)}</TableCell>
                      {/* Show all component columns, align by key, blank if missing */}
                      {allComponentKeys.map((key: string) => (
                        <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
                          {entry.breakup && entry.breakup.components && typeof entry.breakup.components[key] === 'number'
                            ? formatCurrency(entry.breakup.components[key])
                            : (entry.breakup && entry.breakup.components && typeof entry.breakup.components[key] === 'string')
                              ? entry.breakup.components[key]
                              : ''}
                        </TableCell>
                      ))}
                      <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{formatCurrency(entry.breakup?.gross_salary)}</TableCell>
                      <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{formatCurrency(entry.breakup?.deductions?.PF)}</TableCell>
                      <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{formatCurrency(entry.breakup?.deductions?.PT)}</TableCell>
                      <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{formatCurrency(entry.breakup?.net_pay)}</TableCell>
                      <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{formatCurrency(entry.breakup?.employer_contribution_pf)}</TableCell>
                      <TableCell className="border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{(entry.breakup?.gross_salary && entry.breakup?.employer_contribution_pf) ? formatCurrency(entry.breakup.gross_salary + entry.breakup.employer_contribution_pf) : ''}</TableCell>
                      <TableCell className="border-r border-slate-200 dark:border-slate-700">
                        <Button variant="ghost" onClick={() => setViewBreakup(entry)}><Eye className="w-5 h-5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {savedBreakups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={21} className="text-center text-slate-400 dark:text-slate-500">No breakups saved yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal for detailed format (for both current and saved breakups) */}
      <Dialog open={showModal || !!viewBreakup} onOpenChange={() => { setShowModal(false); setViewBreakup(null); }}>
        <DialogContent className="max-w-2xl w-full p-0 bg-slate-900 border border-slate-700 shadow-xl rounded-2xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-slate-100 text-xl font-bold">Salary Breakup Format</DialogTitle>
          </DialogHeader>
          {(selectedEmployee || customPersonName) && breakup && showModal && (
            <div style={{ fontFamily: 'inherit', fontSize: '15px', maxHeight: '80vh', overflowY: 'auto', padding: 24, minWidth: 600 }}>
              <div className="flex flex-col gap-0.5 mb-2">
                <div className="flex border-b border-slate-700 font-semibold text-slate-200">
                  <div className="w-2/5 px-2 py-2">Name</div>
                  <div className="w-3/5 px-2 py-2">{selectedEmployee?.name || customPersonName}</div>
                </div>
                <div className="flex border-b border-slate-700">
                  <div className="w-2/5 px-2 py-2 font-semibold text-slate-200">Designation</div>
                  <div className="w-3/5 px-2 py-2 text-slate-300">{selectedEmployee?.position || 'Custom Person'}</div>
                </div>
                <div className="flex border-b border-slate-700">
                  <div className="w-2/5 px-2 py-2 font-semibold text-slate-200">Date of Joining</div>
                  <div className="w-3/5 px-2 py-2 text-slate-300">{selectedEmployee?.join_date ? new Date(selectedEmployee.join_date).toLocaleDateString() : '-'}</div>
                </div>
              </div>
              <div className="overflow-x-auto mt-4">
                <table className="w-full min-w-[500px] border-collapse table-fixed rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-800 border-b-2 border-slate-700">
                      <th className="text-left px-3 py-2 border border-slate-700 text-slate-200 font-bold w-2/5">Components</th>
                      <th className="text-right px-3 py-2 border border-slate-700 text-slate-200 font-bold w-1/5">Monthly</th>
                      <th className="text-right px-3 py-2 border border-slate-700 text-slate-200 font-bold w-1/5">Annually</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Salary Break-up Section */}
                    <tr>
                      <td colSpan={3} className="text-center border border-slate-700 bg-slate-900 text-amber-300 font-bold py-2">Salary Break-up</td>
                    </tr>
                    {selectedScale && Array.isArray(selectedScale.components) && (() => {
                      const order = ['basic', 'hra', 'cea', 'conveyance', 'telephonic', 'sa', 'special allowance'];
                      const compMap = Object.fromEntries(selectedScale.components.map((c: any) => [c.key.toLowerCase(), c]));
                      const ordered = order
                        .map(key => compMap[key])
                        .filter(Boolean);
                      const rest = selectedScale.components.filter((c: any) => !order.includes(c.key.toLowerCase()));
                      return [...ordered, ...rest].map((comp: any) => (
                        <tr key={comp.key} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/80 transition-colors">
                          <td className="px-3 py-2 border border-slate-700 text-slate-200">{formatHeader(comp.key)}</td>
                          <td className="px-3 py-2 border border-slate-700 text-right text-slate-100">{typeof breakup.components[comp.key] === 'number' ? formatCurrency(breakup.components[comp.key]) : '-'}</td>
                          <td className="px-3 py-2 border border-slate-700 text-right text-slate-100">{typeof breakup.components[comp.key] === 'number' ? formatCurrency(breakup.components[comp.key] * 12) : '-'}</td>
                        </tr>
                      ));
                    })()}
                    <tr className="bg-slate-900 border-t-2 border-slate-700">
                      <td className="px-3 py-2 border border-slate-700 font-bold text-amber-200">Gross Salary</td>
                      <td className="px-3 py-2 border border-slate-700 text-right font-bold text-slate-100">{formatCurrency(breakup.gross_salary)}</td>
                      <td className="px-3 py-2 border border-slate-700 text-right font-bold text-slate-100">{formatCurrency(breakup.gross_salary * 12)}</td>
                    </tr>
                    {/* Deduction Section */}
                    <tr>
                      <td colSpan={3} className="text-center border border-slate-700 bg-slate-900 text-amber-300 font-bold py-2">Deduction</td>
                    </tr>
                    <tr className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/80 transition-colors">
                      <td className="px-3 py-2 border border-slate-700 text-slate-200">PF</td>
                      <td className="px-3 py-2 border border-slate-700 text-right text-slate-100">{formatCurrency(breakup.deductions.PF)}</td>
                      <td className="px-3 py-2 border border-slate-700 text-right text-slate-100">{formatCurrency(breakup.deductions.PF * 12)}</td>
                    </tr>
                    <tr className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/80 transition-colors">
                      <td className="px-3 py-2 border border-slate-700 text-slate-200">PT</td>
                      <td className="px-3 py-2 border border-slate-700 text-right text-slate-100">{formatCurrency(breakup.deductions.PT)}</td>
                      <td className="px-3 py-2 border border-slate-700 text-right text-slate-100">{formatCurrency(breakup.deductions.PT * 12)}</td>
                    </tr>
                    <tr className="bg-slate-900 border-t-2 border-slate-700">
                      <td className="px-3 py-2 border border-slate-700 font-bold text-amber-200">Net Pay</td>
                      <td className="px-3 py-2 border border-slate-700 text-right font-bold text-slate-100">{formatCurrency(breakup.net_pay)}</td>
                      <td className="px-3 py-2 border border-slate-700 text-right font-bold text-slate-100">{formatCurrency(breakup.net_pay * 12)}</td>
                    </tr>
                    {/* Summary Section */}
                    <tr>
                      <td colSpan={3} className="text-center border border-slate-700 bg-slate-900 text-amber-300 font-bold py-2">Employer Contribution</td>
                    </tr>
                    <tr className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/80 transition-colors">
                      <td className="px-3 py-2 border border-slate-700 font-semibold text-slate-200">Employer Contribution PF</td>
                      <td className="px-3 py-2 border border-slate-700 text-right text-slate-100">{formatCurrency(breakup.employer_contribution_pf)}</td>
                      <td className="px-3 py-2 border border-slate-700 text-right text-slate-100">{formatCurrency(breakup.employer_contribution_pf * 12)}</td>
                    </tr>
                    <tr className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/80 transition-colors">
                      <td className="px-3 py-2 border border-slate-700 font-semibold text-slate-200">Bonus</td>
                      <td className="px-3 py-2 border border-slate-700 text-right text-slate-100"></td>
                      <td className="px-3 py-2 border border-slate-700 text-right text-slate-100">{formatCurrency(breakup.bonus)}</td>
                    </tr>
                    <tr className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/80 transition-colors">
                      <td className="px-3 py-2 border border-slate-700 font-semibold text-slate-200">PLI</td>
                      <td className="px-3 py-2 border border-slate-700 text-right text-slate-100"></td>
                      <td className="px-3 py-2 border border-slate-700 text-right text-slate-100">{breakup.pli}</td>
                    </tr>
                    <tr className="bg-slate-900 border-t-2 border-slate-700">
                      <td className="px-3 py-2 border border-slate-700 font-bold text-amber-200">CTC</td>
                      <td className="px-3 py-2 border border-slate-700 text-right font-bold text-slate-100">{formatCurrency(breakup.gross_salary + breakup.employer_contribution_pf)}</td>
                      <td className="px-3 py-2 border border-slate-700 text-right font-bold text-slate-100">{formatCurrency(breakup.gross_salary * 12 + breakup.employer_contribution_pf * 12 + breakup.bonus)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* View for saved breakups */}
          {viewBreakup && (
            <div style={{ fontFamily: 'inherit', fontSize: '15px', maxHeight: '80vh', overflowY: 'auto', padding: 24, minWidth: 600 }}>
              <div style={{ display: 'flex', borderBottom: '2px solid #000', fontWeight: 600 }}>
                <div style={{ width: '40%', padding: '4px 8px' }}>Name</div>
                <div style={{ width: '60%', padding: '4px 8px' }}>{viewBreakup.name}</div>
              </div>
              <div style={{ display: 'flex', borderBottom: '2px solid #000' }}>
                <div style={{ width: '40%', padding: '4px 8px', fontWeight: 600 }}>Designation</div>
                <div style={{ width: '60%', padding: '4px 8px' }}>{viewBreakup.designation}</div>
              </div>
              <div style={{ display: 'flex', borderBottom: '2px solid #000' }}>
                <div style={{ width: '40%', padding: '4px 8px', fontWeight: 600 }}>Date of Joining</div>
                <div style={{ width: '60%', padding: '4px 8px' }}>{viewBreakup.date_of_joining ? new Date(viewBreakup.date_of_joining).toLocaleDateString() : '-'}</div>
              </div>
              <div style={{ overflowX: 'auto', marginTop: 16 }}>
                <table style={{ width: '100%', minWidth: 500, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #000' }}>
                      <th style={{ textAlign: 'left', padding: '4px 8px', border: '1px solid #000', fontWeight: 700, width: '40%' }}>Components</th>
                      <th style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', fontWeight: 700, width: '30%' }}>Monthly</th>
                      <th style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', fontWeight: 700, width: '30%' }}>Annually</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Salary Break-up Section */}
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 700, textAlign: 'center', border: '1px solid #000', borderBottom: '2px solid #000', background: '#fff', padding: '6px 0' }}>Salary Break-up</td>
                    </tr>
                    {Object.entries(viewBreakup.breakup.components).map(([key, value]: [string, any]) => (
                      <tr key={key}>
                        <td style={{ padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{formatHeader(key)}</td>
                        <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{typeof value === 'number' ? formatCurrency(value) : value}</td>
                        <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{typeof value === 'number' ? formatCurrency(value * 12) : value}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid #000', fontWeight: 600 }}>
                      <td style={{ padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>Gross Salary</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{formatCurrency(viewBreakup.breakup.gross_salary)}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{formatCurrency(viewBreakup.breakup.gross_salary * 12)}</td>
                    </tr>
                    {/* Deduction Section */}
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 700, textAlign: 'center', border: '1px solid #000', borderBottom: '2px solid #000', background: '#fff', padding: '6px 0', borderTop: '2px solid #000' }}>Deduction</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000' }}>PF</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{formatCurrency(viewBreakup.breakup.deductions.PF)}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{formatCurrency(viewBreakup.breakup.deductions.PF * 12)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000' }}>PT</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{formatCurrency(viewBreakup.breakup.deductions.PT)}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{formatCurrency(viewBreakup.breakup.deductions.PT * 12)}</td>
                    </tr>
                    <tr style={{ fontWeight: 600 }}>
                      <td style={{ padding: '4px 8px', border: '1px solid #000' }}>Net Pay</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{formatCurrency(viewBreakup.breakup.net_pay)}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{formatCurrency(viewBreakup.breakup.net_pay * 12)}</td>
                    </tr>
                    {/* Summary Section */}
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 700, textAlign: 'center', border: '1px solid #000', borderBottom: '2px solid #000', background: '#fff', padding: '6px 0', borderTop: '2px solid #000' }}>Employer Contribution</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000', fontWeight: 600 }}>Employer Contribution PF</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{formatCurrency(viewBreakup.breakup.employer_contribution_pf)}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{formatCurrency(viewBreakup.breakup.employer_contribution_pf * 12)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000', fontWeight: 600 }}>Bonus</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}></td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{formatCurrency(viewBreakup.breakup.bonus)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000', fontWeight: 600 }}>PLI</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}></td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{viewBreakup.breakup.pli}</td>
                    </tr>
                    <tr style={{ fontWeight: 700 }}>
                      <td style={{ padding: '4px 8px', border: '1px solid #000' }}>CTC</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{formatCurrency(viewBreakup.breakup.gross_salary + viewBreakup.breakup.employer_contribution_pf)}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{formatCurrency(viewBreakup.breakup.gross_salary * 12 + viewBreakup.breakup.employer_contribution_pf * 12 + viewBreakup.breakup.bonus)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryBreakup; 