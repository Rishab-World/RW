-- Create leave_entitlements table to store default leave entitlements
CREATE TABLE IF NOT EXISTS leave_entitlements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year INTEGER NOT NULL,
    pl_days INTEGER DEFAULT 25,
    cl_days INTEGER DEFAULT 12,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(year)
);

-- Create employee_leave_balances table to track individual employee leave balances
CREATE TABLE IF NOT EXISTS employee_leave_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    pl_opening_balance DECIMAL(5,2) DEFAULT 0,
    cl_opening_balance DECIMAL(5,2) DEFAULT 0,
    pl_taken DECIMAL(5,2) DEFAULT 0,
    cl_taken DECIMAL(5,2) DEFAULT 0,
    pl_closing_balance DECIMAL(5,2) DEFAULT 0,
    cl_closing_balance DECIMAL(5,2) DEFAULT 0,
    is_manually_updated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, year, month)
);

-- Create leave_records table to track individual leave applications
CREATE TABLE IF NOT EXISTS leave_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('CL', 'PL', 'SL', 'ML', 'OTHER')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_taken DECIMAL(5,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_leave_balances_employee_year ON employee_leave_balances(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_employee_leave_balances_year_month ON employee_leave_balances(year, month);
CREATE INDEX IF NOT EXISTS idx_leave_records_employee_id ON leave_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_records_date_range ON leave_records(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_records_status ON leave_records(status);

-- Enable Row Level Security
ALTER TABLE leave_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for authenticated users on leave_entitlements" ON leave_entitlements
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on employee_leave_balances" ON employee_leave_balances
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on leave_records" ON leave_records
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert default leave entitlements for current year and next year
INSERT INTO leave_entitlements (year, pl_days, cl_days) VALUES 
    (EXTRACT(YEAR FROM CURRENT_DATE), 25, 12),
    (EXTRACT(YEAR FROM CURRENT_DATE) + 1, 25, 12)
ON CONFLICT (year) DO NOTHING;

-- Create function to automatically calculate closing balance
CREATE OR REPLACE FUNCTION calculate_leave_closing_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate closing balance based on opening balance and leave taken
    NEW.pl_closing_balance = NEW.pl_opening_balance - NEW.pl_taken;
    NEW.cl_closing_balance = NEW.cl_opening_balance - NEW.cl_taken;
    
    -- Ensure closing balance doesn't go below 0
    IF NEW.pl_closing_balance < 0 THEN
        NEW.pl_closing_balance = 0;
    END IF;
    
    IF NEW.cl_closing_balance < 0 THEN
        NEW.cl_closing_balance = 0;
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate closing balance
CREATE TRIGGER trigger_calculate_leave_closing_balance
    BEFORE INSERT OR UPDATE ON employee_leave_balances
    FOR EACH ROW
    EXECUTE FUNCTION calculate_leave_closing_balance();

-- Create function to automatically create leave balance records for new employees
CREATE OR REPLACE FUNCTION create_employee_leave_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_year INTEGER;
    current_month INTEGER;
    i INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    
    -- Create leave balance records for current year from current month onwards
    FOR i IN current_month..12 LOOP
        INSERT INTO employee_leave_balances (employee_id, year, month, pl_opening_balance, cl_opening_balance)
        VALUES (NEW.id, current_year, i, 25, 12)
        ON CONFLICT (employee_id, year, month) DO NOTHING;
    END LOOP;
    
    -- Create leave balance records for next year
    FOR i IN 1..12 LOOP
        INSERT INTO employee_leave_balances (employee_id, year, month, pl_opening_balance, cl_opening_balance)
        VALUES (NEW.id, current_year + 1, i, 25, 12)
        ON CONFLICT (employee_id, year, month) DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create leave balance records for new employees
CREATE TRIGGER trigger_create_employee_leave_balance
    AFTER INSERT ON employees
    FOR EACH ROW
    EXECUTE FUNCTION create_employee_leave_balance();
