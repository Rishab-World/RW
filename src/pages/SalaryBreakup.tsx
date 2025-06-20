import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const SalaryBreakup: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
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
    if (!selectedEmployee || !salary || typeof salary !== 'number') return;
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
    if (!selectedEmployee || !salary || !breakup) return;
    setSaving(true);
    await supabase.from('employee_salary_breakups').insert([
      {
        employee_id: selectedEmployee.id,
        name: selectedEmployee.name,
        designation: selectedEmployee.position,
        date_of_joining: selectedEmployee.join_date,
        salary_input: salary,
        breakup,
      },
    ]);
    setSaving(false);
    fetchSavedBreakups();
    // Reset fields for next entry
    setSelectedEmployee(null);
    setSalary('');
    setBreakup(null);
    setSearch('');
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
    <div className="p-6 max-w-full mx-auto">
      <Card className="">
        {/* <CardHeader>
          <CardTitle>Salary Breakup</CardTitle>
        </CardHeader> */}
        <CardContent>
          {/* Searchable Dropdown */}
          <div className="mb-2 flex flex-col md:flex-row md:items-end md:space-x-6" style={{ minHeight: 'unset', paddingTop: '10px', paddingBottom: 0 }}>
            <div className="flex-1 mb-2 md:mb-0" style={{ position: 'relative' }}>
              <label className="block mb-1 font-medium">Select Employee</label>
              <Input
                type="text"
                placeholder="Type to search employee..."
                value={search}
                onChange={e => { setSearch(e.target.value); setDropdownOpen(true); }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
              />
              {dropdownOpen && (
                <div className="border rounded bg-white max-h-40 overflow-y-auto mt-1 shadow" style={{ position: 'absolute', width: '100%', top: '100%', left: 0, zIndex: 50 }}>
                  {filteredEmployees.map(emp => (
                    <div
                      key={emp.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-amber-100 ${selectedEmployee && selectedEmployee.id === emp.id ? 'bg-amber-50 font-semibold' : ''}`}
                      onMouseDown={() => { setSelectedEmployee(emp); setSearch(emp.name); setDropdownOpen(false); }}
                    >
                      {emp.name} <span className="text-xs text-slate-500">({emp.position})</span>
                    </div>
                  ))}
                  {filteredEmployees.length === 0 && <div className="px-3 py-2 text-slate-400">No employees found</div>}
                </div>
              )}
            </div>
            {selectedEmployee && (
              <div className="flex-1">
                <label className="block mb-1 font-medium">Enter Gross Monthly Salary</label>
                <Input
                  type="number"
                  value={salary}
                  onChange={e => setSalary(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Enter gross monthly salary"
                />
              </div>
            )}
            {selectedEmployee && (
              <div className="flex-1 flex items-end space-x-2">
                <Button onClick={handleCalculate} disabled={!salary || !selectedEmployee} className="bg-amber-500 hover:bg-amber-600">Calculate</Button>
                {breakup && (
                  <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                )}
                <Button onClick={() => { setSelectedEmployee(null); setSalary(''); setBreakup(null); setSearch(''); }} className="bg-amber-500 hover:bg-amber-600 text-white">Clear</Button>
              </div>
            )}
          </div>

          {/* Show Employee Details and Breakup */}
          {selectedEmployee && breakup && (
            <div className="mt-8">
              <Card className="shadow-md max-w-full" style={{ width: '100%' }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">{selectedEmployee.name}</div>
                      <div className="text-slate-600 text-sm">{selectedEmployee.position}</div>
                      <div className="text-slate-500 text-xs">DOJ: {selectedEmployee.join_date ? new Date(selectedEmployee.join_date).toLocaleDateString() : '-'}</div>
                    </div>
                    <Button variant="ghost" onClick={() => setShowModal(true)}><Eye className="w-5 h-5" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                    <Table className="min-w-max" style={{ minWidth: 900 }}>
                      <TableHeader>
                        <TableRow>
                          {selectedScale && Array.isArray(selectedScale.components) && selectedScale.components.map((comp: any) => (
                            <TableHead key={comp.key}>{comp.label}</TableHead>
                          ))}
                          <TableHead>Gross Salary</TableHead>
                          <TableHead>PF</TableHead>
                          <TableHead>PT</TableHead>
                          <TableHead>Net Pay</TableHead>
                          <TableHead>Employer PF</TableHead>
                          <TableHead>CTC</TableHead>
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
                              <TableCell key={comp.key}>{typeof breakup.components[comp.key] === 'number' ? breakup.components[comp.key].toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}</TableCell>
                            ));
                          })()}
                          <TableCell>{breakup.gross_salary?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>{breakup.deductions.PF?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>{breakup.deductions.PT?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>{breakup.net_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>{breakup.employer_contribution_pf?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>{breakup.ctc?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
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
      <div className="mt-4">
        <Card className="max-w-full" style={{ width: '100%' }}>
          {/* <CardHeader>
            <CardTitle>All Saved Salary Breakups</CardTitle>
          </CardHeader> */}
          <CardContent style={{ paddingTop: '10px' }}>
            <div className="overflow-x-auto" style={{ maxWidth: '100%', maxHeight: '400px', overflowY: 'auto' }}>
              <Table className="w-full min-w-full border border-gray-200">
                <TableHeader className="sticky top-0 z-20 bg-white shadow border-t border-gray-200">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="border-r border-gray-200 sticky left-0 bg-white z-20">Name</TableHead>
                    <TableHead className="border-r border-gray-200 sticky left-0 bg-white z-20">Designation</TableHead>
                    <TableHead className="border-r border-gray-200 sticky left-0 bg-white z-20">DOJ</TableHead>
                    <TableHead className="border-r border-gray-200 sticky left-0 bg-white z-20">Salary</TableHead>
                    {/* Show all unique breakup component keys as columns */}
                    {allComponentKeys.map((key: string) => (
                      <TableHead className="border-r border-gray-200 sticky left-0 bg-white z-20 whitespace-nowrap" key={key}>{formatHeader(key)}</TableHead>
                    ))}
                    <TableHead className="border-r border-gray-200 sticky left-0 bg-white z-20">Gross Salary</TableHead>
                    <TableHead className="border-r border-gray-200 sticky left-0 bg-white z-20">PF</TableHead>
                    <TableHead className="border-r border-gray-200 sticky left-0 bg-white z-20">PT</TableHead>
                    <TableHead className="border-r border-gray-200 sticky left-0 bg-white z-20">Net Pay</TableHead>
                    <TableHead className="border-r border-gray-200 sticky left-0 bg-white z-20">Employer PF</TableHead>
                    <TableHead className="border-r border-gray-200 sticky left-0 bg-white z-20">CTC</TableHead>
                    <TableHead className="border-r border-gray-200 sticky left-0 bg-white z-20">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedBreakups.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="border-r border-gray-200 whitespace-nowrap">{entry.name}</TableCell>
                      <TableCell className="border-r border-gray-200">{entry.designation}</TableCell>
                      <TableCell className="border-r border-gray-200">{entry.date_of_joining ? new Date(entry.date_of_joining).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="border-r border-gray-200">{entry.salary_input?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      {/* Show all component columns, align by key, blank if missing */}
                      {allComponentKeys.map((key: string) => (
                        <TableCell className="border-r border-gray-200">
                          {entry.breakup && entry.breakup.components && typeof entry.breakup.components[key] === 'number'
                            ? entry.breakup.components[key].toLocaleString(undefined, { maximumFractionDigits: 2 })
                            : (entry.breakup && entry.breakup.components && typeof entry.breakup.components[key] === 'string')
                              ? entry.breakup.components[key]
                              : ''}
                        </TableCell>
                      ))}
                      <TableCell className="border-r border-gray-200">{entry.breakup?.gross_salary?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="border-r border-gray-200">{entry.breakup?.deductions?.PF?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="border-r border-gray-200">{entry.breakup?.deductions?.PT?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="border-r border-gray-200">{entry.breakup?.net_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="border-r border-gray-200">{entry.breakup?.employer_contribution_pf?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="border-r border-gray-200">{(entry.breakup?.gross_salary && entry.breakup?.employer_contribution_pf) ? (entry.breakup.gross_salary + entry.breakup.employer_contribution_pf).toLocaleString(undefined, { maximumFractionDigits: 2 }) : ''}</TableCell>
                      <TableCell className="border-r border-gray-200">
                        <Button variant="ghost" onClick={() => setViewBreakup(entry)}><Eye className="w-5 h-5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {savedBreakups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={21} className="text-center text-slate-400">No breakups saved yet.</TableCell>
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
        <DialogContent className="max-w-2xl w-full p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Salary Breakup Format</DialogTitle>
          </DialogHeader>
          {(selectedEmployee && breakup && showModal) && (
            <div style={{ fontFamily: 'inherit', fontSize: '15px', maxHeight: '80vh', overflowY: 'auto', padding: 24, minWidth: 600 }}>
              <div style={{ display: 'flex', borderBottom: '2px solid #000', fontWeight: 600 }}>
                <div style={{ width: '40%', padding: '4px 8px' }}>Name</div>
                <div style={{ width: '60%', padding: '4px 8px' }}>{selectedEmployee.name}</div>
              </div>
              <div style={{ display: 'flex', borderBottom: '2px solid #000' }}>
                <div style={{ width: '40%', padding: '4px 8px', fontWeight: 600 }}>Designation</div>
                <div style={{ width: '60%', padding: '4px 8px' }}>{selectedEmployee.position}</div>
              </div>
              <div style={{ display: 'flex', borderBottom: '2px solid #000' }}>
                <div style={{ width: '40%', padding: '4px 8px', fontWeight: 600 }}>Date of Joining</div>
                <div style={{ width: '60%', padding: '4px 8px' }}>{selectedEmployee.join_date ? new Date(selectedEmployee.join_date).toLocaleDateString() : '-'}</div>
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
                    {selectedScale && Array.isArray(selectedScale.components) && (() => {
                      const order = ['basic', 'hra', 'cea', 'conveyance', 'telephonic', 'sa', 'special allowance'];
                      const compMap = Object.fromEntries(selectedScale.components.map((c: any) => [c.key.toLowerCase(), c]));
                      const ordered = order
                        .map(key => compMap[key])
                        .filter(Boolean);
                      const rest = selectedScale.components.filter((c: any) => !order.includes(c.key.toLowerCase()));
                      return [...ordered, ...rest].map((comp: any) => (
                        <tr key={comp.key}>
                          <td style={{ padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{formatHeader(comp.key)}</td>
                          <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{typeof breakup.components[comp.key] === 'number' ? `₹${breakup.components[comp.key].toLocaleString('en-IN')}` : '-'}</td>
                          <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{typeof breakup.components[comp.key] === 'number' ? `₹${(breakup.components[comp.key] * 12).toLocaleString('en-IN')}` : '-'}</td>
                        </tr>
                      ));
                    })()}
                    <tr style={{ borderTop: '2px solid #000', fontWeight: 600 }}>
                      <td style={{ padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>Gross Salary</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{`₹${breakup.gross_salary?.toLocaleString('en-IN')}`}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{`₹${(breakup.gross_salary * 12)?.toLocaleString('en-IN')}`}</td>
                    </tr>
                    {/* Deduction Section */}
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 700, textAlign: 'center', border: '1px solid #000', borderBottom: '2px solid #000', background: '#fff', padding: '6px 0', borderTop: '2px solid #000' }}>Deduction</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000' }}>PF</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${breakup.deductions.PF?.toLocaleString('en-IN')}`}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${(breakup.deductions.PF * 12)?.toLocaleString('en-IN')}`}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000' }}>PT</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${breakup.deductions.PT?.toLocaleString('en-IN')}`}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${(breakup.deductions.PT * 12)?.toLocaleString('en-IN')}`}</td>
                    </tr>
                    <tr style={{ fontWeight: 600 }}>
                      <td style={{ padding: '4px 8px', border: '1px solid #000' }}>Net Pay</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${breakup.net_pay?.toLocaleString('en-IN')}`}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${(breakup.net_pay * 12)?.toLocaleString('en-IN')}`}</td>
                    </tr>
                    {/* Summary Section */}
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 700, textAlign: 'center', border: '1px solid #000', borderBottom: '2px solid #000', background: '#fff', padding: '6px 0', borderTop: '2px solid #000' }}>Employer Contribution</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000', fontWeight: 600 }}>Employer Contribution PF</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${breakup.employer_contribution_pf?.toLocaleString('en-IN')}`}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${(breakup.employer_contribution_pf * 12)?.toLocaleString('en-IN')}`}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000', fontWeight: 600 }}>Bonus</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}></td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${breakup.bonus?.toLocaleString('en-IN')}`}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000', fontWeight: 600 }}>PLI</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}></td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{breakup.pli}</td>
                    </tr>
                    <tr style={{ fontWeight: 700 }}>
                      <td style={{ padding: '4px 8px', border: '1px solid #000' }}>CTC</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${(breakup.gross_salary + breakup.employer_contribution_pf).toLocaleString('en-IN')}`}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${(breakup.gross_salary * 12 + breakup.employer_contribution_pf * 12 + breakup.bonus).toLocaleString('en-IN')}`}</td>
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
                        <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value}</td>
                        <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{typeof value === 'number' ? `₹${(value * 12).toLocaleString('en-IN')}` : value}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid #000', fontWeight: 600 }}>
                      <td style={{ padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>Gross Salary</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{`₹${viewBreakup.breakup.gross_salary?.toLocaleString('en-IN')}`}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000', verticalAlign: 'middle' }}>{`₹${(viewBreakup.breakup.gross_salary * 12)?.toLocaleString('en-IN')}`}</td>
                    </tr>
                    {/* Deduction Section */}
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 700, textAlign: 'center', border: '1px solid #000', borderBottom: '2px solid #000', background: '#fff', padding: '6px 0', borderTop: '2px solid #000' }}>Deduction</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000' }}>PF</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${viewBreakup.breakup.deductions.PF?.toLocaleString('en-IN')}`}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${(viewBreakup.breakup.deductions.PF * 12)?.toLocaleString('en-IN')}`}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000' }}>PT</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${viewBreakup.breakup.deductions.PT?.toLocaleString('en-IN')}`}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${(viewBreakup.breakup.deductions.PT * 12)?.toLocaleString('en-IN')}`}</td>
                    </tr>
                    <tr style={{ fontWeight: 600 }}>
                      <td style={{ padding: '4px 8px', border: '1px solid #000' }}>Net Pay</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${viewBreakup.breakup.net_pay?.toLocaleString('en-IN')}`}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${(viewBreakup.breakup.net_pay * 12)?.toLocaleString('en-IN')}`}</td>
                    </tr>
                    {/* Summary Section */}
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 700, textAlign: 'center', border: '1px solid #000', borderBottom: '2px solid #000', background: '#fff', padding: '6px 0', borderTop: '2px solid #000' }}>Employer Contribution</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000', fontWeight: 600 }}>Employer Contribution PF</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${viewBreakup.breakup.employer_contribution_pf?.toLocaleString('en-IN')}`}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${(viewBreakup.breakup.employer_contribution_pf * 12)?.toLocaleString('en-IN')}`}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000', fontWeight: 600 }}>Bonus</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}></td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${viewBreakup.breakup.bonus?.toLocaleString('en-IN')}`}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #000', fontWeight: 600 }}>PLI</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}></td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{viewBreakup.breakup.pli}</td>
                    </tr>
                    <tr style={{ fontWeight: 700 }}>
                      <td style={{ padding: '4px 8px', border: '1px solid #000' }}>CTC</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${(viewBreakup.breakup.gross_salary + viewBreakup.breakup.employer_contribution_pf).toLocaleString('en-IN')}`}</td>
                      <td style={{ textAlign: 'right', padding: '4px 8px', border: '1px solid #000' }}>{`₹${(viewBreakup.breakup.gross_salary * 12 + viewBreakup.breakup.employer_contribution_pf * 12 + viewBreakup.breakup.bonus).toLocaleString('en-IN')}`}</td>
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