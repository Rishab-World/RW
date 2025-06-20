import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabaseClient';

const calculationTypes = [
  'Monthly Salary Breakup',
  'Yearly Salary Breakup (Inc. PLI & Bonus)',
  'Yearly Salary Breakup (Excl. PLI & Bonus)',
];

const SalaryCalculation: React.FC = () => {
  const [calculationType, setCalculationType] = useState('Monthly Salary Breakup');
  const [gross, setGross] = useState<number | ''>('');
  const [result, setResult] = useState<any>(null);
  const [salaryScales, setSalaryScales] = useState<any[]>([]);
  const [selectedScale, setSelectedScale] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchScales = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('salary_scales')
        .select('*')
        .order('min_salary', { ascending: true });
      if (!error && data) {
        setSalaryScales(data);
      }
      setLoading(false);
    };
    fetchScales();
  }, []);

  // Find scale based on gross
  const getScale = (gross: number) => {
    return salaryScales.find((scale) => gross * 12 >= scale.min_salary && (scale.max_salary === null || gross * 12 <= scale.max_salary));
  };

  const handleCalculate = () => {
    if (calculationType === 'Monthly Salary Breakup' && gross && typeof gross === 'number') {
      const scale = getScale(gross);
      setSelectedScale(scale);
      if (scale && Array.isArray(scale.components)) {
        let components = scale.components;
        // If components is a string (from Supabase), parse it
        if (typeof components === 'string') {
          try {
            components = JSON.parse(components);
          } catch {
            setResult(null);
            return;
          }
        }
        // If this is scale 2, override HRA percent to 17.5%
        const isScale2 = scale.name && scale.name.toLowerCase().includes('scale 2');
        if (isScale2) {
          components = components.map((comp: any) => {
            if (comp.key.toLowerCase() === 'hra') return { ...comp, value: 0.175 };
            return comp;
          });
        }
        const values: any = {};
        components.forEach((comp: any) => {
          if (comp.key.toLowerCase() === 'hra' && isScale2) {
            values[comp.key] = gross * 0.175;
          } else if (comp.type === 'percent') {
            values[comp.key] = gross * comp.value;
          } else if (comp.type === 'fixed') {
            values[comp.key] = comp.value;
          } else if (comp.type === 'balance') {
            // sum all other components
            const sum = Object.keys(values).reduce((acc, key) => acc + (values[key] || 0), 0);
            values[comp.key] = gross - sum;
          }
        });
        setResult(values);
        setSelectedScale({ ...scale, components });
      } else {
        setResult(null);
      }
    } else {
      setResult(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Make both columns flexible and wide */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Left: Salary Calculation Form */}
          <Card>
            <CardHeader>
              {/* Removed CardTitle here */}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-end md:space-x-4 mb-4">
                <div className="flex-1 mb-2 md:mb-0">
                  <label className="block mb-1 font-medium">Select Calculation Type</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={calculationType}
                    onChange={e => {
                      setCalculationType(e.target.value);
                      setResult(null);
                      setGross('');
                    }}
                  >
                    {calculationTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                {calculationType === 'Monthly Salary Breakup' && (
                  <div className="flex-1">
                    <label className="block mb-1 font-medium">Gross Monthly Salary</label>
                    <Input
                      type="number"
                      value={gross}
                      onChange={e => setGross(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Enter gross monthly salary"
                      disabled={loading}
                    />
                  </div>
                )}
              </div>
              {calculationType === 'Monthly Salary Breakup' && (
                <div className="mt-2">
                  <Button onClick={handleCalculate} disabled={loading || salaryScales.length === 0}>Calculate</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          {result && selectedScale && Array.isArray(selectedScale.components) && (
            <Card className="min-h-[220px]">
              <CardHeader>
                <CardTitle>{selectedScale.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {selectedScale.components.map((comp: any) => (
                          <TableHead key={comp.key}>{comp.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        {selectedScale.components.map((comp: any) => (
                          <TableCell key={comp.key} className="font-semibold">
                            {typeof result[comp.key] === 'number'
                              ? result[comp.key].toLocaleString(undefined, { maximumFractionDigits: 2 })
                              : '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          {(!salaryScales || salaryScales.length === 0) && !loading && (
            <div className="text-center text-red-600 mt-6">No salary scales found. Please check your Supabase table.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryCalculation; 