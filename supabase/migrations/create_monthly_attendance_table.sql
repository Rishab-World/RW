-- Create monthly_attendance_records table
CREATE TABLE IF NOT EXISTS monthly_attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    present INTEGER DEFAULT 0,
    absent INTEGER DEFAULT 0,
    late INTEGER DEFAULT 0,
    early_leaving INTEGER DEFAULT 0,
    total_employees INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5,2) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_details JSONB,
    leave_types TEXT[]
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_monthly_attendance_month ON monthly_attendance_records(month);
CREATE INDEX IF NOT EXISTS idx_monthly_attendance_department ON monthly_attendance_records(department);
CREATE INDEX IF NOT EXISTS idx_monthly_attendance_timestamp ON monthly_attendance_records(timestamp);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE monthly_attendance_records ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (you can modify this based on your security requirements)
CREATE POLICY "Allow all operations for authenticated users" ON monthly_attendance_records
    FOR ALL USING (auth.role() = 'authenticated'); 