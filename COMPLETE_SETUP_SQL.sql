-- Complete Setup SQL for New Candidate Fields
-- Run this entire file in your Supabase SQL Editor

-- =====================================================
-- 1. Create CU Monthly/Yearly options table
-- =====================================================
CREATE TABLE IF NOT EXISTS cu_monthly_yearly_options (
  id SERIAL PRIMARY KEY,
  option_value TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Insert the required options
INSERT INTO cu_monthly_yearly_options (option_value, display_name) VALUES
('monthly', 'Monthly'),
('yearly', 'Yearly'),
('between', 'Between')
ON CONFLICT (option_value) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE cu_monthly_yearly_options ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON cu_monthly_yearly_options
    FOR ALL USING (auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE cu_monthly_yearly_options IS 'Options for CU Monthly/Yearly field in candidates table';
COMMENT ON COLUMN cu_monthly_yearly_options.option_value IS 'The value stored in the database';
COMMENT ON COLUMN cu_monthly_yearly_options.display_name IS 'The name displayed in the UI';

-- =====================================================
-- 2. Create EX Monthly/Yearly options table
-- =====================================================
CREATE TABLE IF NOT EXISTS ex_monthly_yearly_options (
  id SERIAL PRIMARY KEY,
  option_value TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Insert the required options
INSERT INTO ex_monthly_yearly_options (option_value, display_name) VALUES
('monthly', 'Monthly'),
('yearly', 'Yearly'),
('between', 'Between'),
('percentage_hike', 'Percentage Hike'),
('company_offer', 'Company Offer'),
('negotiation', 'Negotiation')
ON CONFLICT (option_value) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE ex_monthly_yearly_options ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON ex_monthly_yearly_options
    FOR ALL USING (auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE ex_monthly_yearly_options IS 'Options for EX Monthly/Yearly field in candidates table';
COMMENT ON COLUMN ex_monthly_yearly_options.option_value IS 'The value stored in the database';
COMMENT ON COLUMN ex_monthly_yearly_options.display_name IS 'The name displayed in the UI';

-- =====================================================
-- 3. Create departments table
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  department_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Insert the required department options
INSERT INTO departments (department_name) VALUES
('Accounts & Finance'),
('Administration'),
('Arok'),
('Ccc'),
('Crm'),
('D & J'),
('D & J Operations'),
('D & J Procourment'),
('D & J The Avenue'),
('Design'),
('Fabric & Yarn'),
('Gabanna'),
('GSP - TAS'),
('Human Resource'),
('IT'),
('Italian Channel'),
('Knox'),
('Management'),
('Management - Rajesh Singh'),
('Management - Rishab Jain'),
('MIS'),
('NA'),
('Namita Dange'),
('Optus'),
('Procurement'),
('Rare Wool'),
('Retail'),
('Social Media And Marketing'),
('Strch'),
('Tamiska'),
('Vercelli'),
('Vercelli Retail'),
('Warehouse')
ON CONFLICT (department_name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON departments
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at 
    BEFORE UPDATE ON departments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE departments IS 'Departments table for candidates and employees';
COMMENT ON COLUMN departments.department_name IS 'Department name (unique)';
COMMENT ON COLUMN departments.is_active IS 'Whether the department is active';
COMMENT ON COLUMN departments.created_at IS 'When the department was created';
COMMENT ON COLUMN departments.updated_at IS 'When the department was last updated';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(department_name);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

-- =====================================================
-- 4. Update candidates table with new fields
-- =====================================================

-- Add new columns to existing candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS cu_monthly_yearly_new TEXT,
ADD COLUMN IF NOT EXISTS ex_monthly_yearly_new TEXT,
ADD COLUMN IF NOT EXISTS department_new TEXT,
ADD COLUMN IF NOT EXISTS applied_date_new DATE;

-- Update existing records to use the new fields
UPDATE candidates 
SET 
  cu_monthly_yearly_new = cu_monthly_yearly,
  ex_monthly_yearly_new = ex_monthly_yearly,
  department_new = department,
  applied_date_new = CASE 
    WHEN applied_date IS NOT NULL THEN 
      CASE 
        WHEN applied_date ~ '^\d{4}-\d{2}-\d{2}$' THEN applied_date::DATE
        WHEN applied_date ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN TO_DATE(applied_date, 'MM/DD/YYYY')
        WHEN applied_date ~ '^\d{1,2}-\d{1,2}-\d{4}$' THEN TO_DATE(applied_date, 'MM-DD-YYYY')
        ELSE CURRENT_DATE
      END
    ELSE CURRENT_DATE
  END;

-- Drop old columns
ALTER TABLE candidates 
DROP COLUMN IF EXISTS cu_monthly_yearly,
DROP COLUMN IF EXISTS ex_monthly_yearly,
DROP COLUMN IF EXISTS department,
DROP COLUMN IF EXISTS applied_date;

-- Rename new columns to original names
ALTER TABLE candidates 
RENAME COLUMN cu_monthly_yearly_new TO cu_monthly_yearly;

ALTER TABLE candidates 
RENAME COLUMN ex_monthly_yearly_new TO ex_monthly_yearly;

ALTER TABLE candidates 
RENAME COLUMN department_new TO department;

ALTER TABLE candidates 
RENAME COLUMN applied_date_new TO applied_date;

-- Add constraints and defaults
ALTER TABLE candidates 
ALTER COLUMN cu_monthly_yearly SET DEFAULT 'monthly',
ALTER COLUMN ex_monthly_yearly SET DEFAULT 'monthly',
ALTER COLUMN applied_date SET DEFAULT CURRENT_DATE;

-- Add comments for the new structure
COMMENT ON COLUMN candidates.cu_monthly_yearly IS 'Current salary type - monthly, yearly, or between';
COMMENT ON COLUMN candidates.ex_monthly_yearly IS 'Expected salary type - monthly, yearly, between, percentage_hike, company_offer, or negotiation';
COMMENT ON COLUMN candidates.department IS 'Department name from departments table';
COMMENT ON COLUMN candidates.applied_date IS 'Date when candidate applied (default: current date)';

-- =====================================================
-- 5. Create function to add new department
-- =====================================================

-- Function to add a new department
CREATE OR REPLACE FUNCTION add_department(new_department_name TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- Check if department already exists
    IF EXISTS (SELECT 1 FROM departments WHERE LOWER(department_name) = LOWER(new_department_name)) THEN
        result := 'Department "' || new_department_name || '" already exists.';
    ELSE
        -- Insert new department
        INSERT INTO departments (department_name) VALUES (new_department_name);
        result := 'Department "' || new_department_name || '" added successfully.';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_department(TEXT) TO authenticated;

-- =====================================================
-- 6. Verification queries
-- =====================================================

-- Verify the tables were created
SELECT 'CU Monthly/Yearly Options' as table_name, COUNT(*) as record_count FROM cu_monthly_yearly_options
UNION ALL
SELECT 'EX Monthly/Yearly Options' as table_name, COUNT(*) as record_count FROM ex_monthly_yearly_options
UNION ALL
SELECT 'Departments' as table_name, COUNT(*) as record_count FROM departments
UNION ALL
SELECT 'Candidates' as table_name, COUNT(*) as record_count FROM candidates;

-- Show the new structure of candidates table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'candidates' 
ORDER BY ordinal_position;

-- Test the add_department function
SELECT add_department('Test Department') as result;

-- Clean up test department
DELETE FROM departments WHERE department_name = 'Test Department';

-- =====================================================
-- Setup Complete!
-- =====================================================
-- You can now use these tables in your application:
-- 1. cu_monthly_yearly_options - for CU Monthly/Yearly dropdown
-- 2. ex_monthly_yearly_options - for EX Monthly/Yearly dropdown  
-- 3. departments - for Department dropdown with add new functionality
-- 4. candidates table has been updated with the new fields
