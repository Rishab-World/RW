-- Create salary_master table
CREATE TABLE IF NOT EXISTS salary_master (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    emp_code VARCHAR(50) NOT NULL UNIQUE,
    emp_name VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    fix_gross DECIMAL(12,2) NOT NULL,
    doj DATE NOT NULL,
    percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_salary_master_emp_code ON salary_master(emp_code);
CREATE INDEX IF NOT EXISTS idx_salary_master_department ON salary_master(department);
CREATE INDEX IF NOT EXISTS idx_salary_master_location ON salary_master(location);
CREATE INDEX IF NOT EXISTS idx_salary_master_created_at ON salary_master(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE salary_master ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON salary_master
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_salary_master_updated_at 
    BEFORE UPDATE ON salary_master 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 