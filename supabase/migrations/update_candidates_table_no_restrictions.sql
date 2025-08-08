-- Update candidates table to remove all restrictions for maximum flexibility
-- This allows importing vast datasets with minimal validation

-- First, backup existing data
CREATE TABLE IF NOT EXISTS candidates_backup_before_update AS SELECT * FROM candidates;

-- Drop existing table and recreate with maximum flexibility
DROP TABLE IF EXISTS candidates CASCADE;

-- Create new candidates table with maximum flexibility
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- Only name is required
  email text, -- No restrictions
  phone text, -- No restrictions
  position text, -- No restrictions
  department text, -- No restrictions
  source text, -- No restrictions
  experience text, -- Changed to text to accept any format
  cu_monthly_yearly text, -- No restrictions
  current_salary text, -- Changed to text to accept any format
  ex_monthly_yearly text, -- No restrictions
  expected_salary text, -- Changed to text to accept any format
  remark text, -- No restrictions
  notice_period text, -- No restrictions
  interview_status text DEFAULT 'applied', -- No restrictions
  applied_date text, -- Changed to text to accept any format
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Add comments to document the flexible structure
COMMENT ON TABLE candidates IS 'Candidates table with maximum flexibility for importing vast datasets';
COMMENT ON COLUMN candidates.name IS 'Candidate full name (only required field)';
COMMENT ON COLUMN candidates.email IS 'Email address (any format accepted)';
COMMENT ON COLUMN candidates.phone IS 'Phone number (any format accepted)';
COMMENT ON COLUMN candidates.position IS 'Applied position (any format accepted)';
COMMENT ON COLUMN candidates.department IS 'Department (any format accepted)';
COMMENT ON COLUMN candidates.source IS 'Application source (any format accepted)';
COMMENT ON COLUMN candidates.experience IS 'Years of experience (any format accepted)';
COMMENT ON COLUMN candidates.cu_monthly_yearly IS 'Current salary type (any format accepted)';
COMMENT ON COLUMN candidates.current_salary IS 'Current salary amount (any format accepted)';
COMMENT ON COLUMN candidates.ex_monthly_yearly IS 'Expected salary type (any format accepted)';
COMMENT ON COLUMN candidates.expected_salary IS 'Expected salary amount (any format accepted)';
COMMENT ON COLUMN candidates.remark IS 'Additional remarks (any format accepted)';
COMMENT ON COLUMN candidates.notice_period IS 'Notice period (any format accepted)';
COMMENT ON COLUMN candidates.interview_status IS 'Interview status (any format accepted)';
COMMENT ON COLUMN candidates.applied_date IS 'Date when candidate applied (any format accepted)';

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON candidates
    FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_candidates_name ON candidates(name);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_position ON candidates(position);
CREATE INDEX idx_candidates_department ON candidates(department);
CREATE INDEX idx_candidates_interview_status ON candidates(interview_status);
CREATE INDEX idx_candidates_applied_date ON candidates(applied_date);
CREATE INDEX idx_candidates_created_at ON candidates(created_at);

-- Insert sample data to test the structure
INSERT INTO candidates (name, email, phone, position, department, source, experience, cu_monthly_yearly, current_salary, ex_monthly_yearly, expected_salary, remark, notice_period, interview_status, applied_date) VALUES
('John Doe', 'john@example.com', '+91-9876543210', 'Software Engineer', 'Engineering', 'LinkedIn', '3 years', 'monthly', '65000', 'monthly', '75000', 'Strong technical background', '1-month', 'applied', '2024-01-15'),
('Jane Smith', 'jane@example.com', '9876543210', 'Product Manager', 'Product', 'Referral', '5', 'yearly', '12 LPA', 'yearly', '15 LPA', 'Excellent leadership skills', '2-months', 'shortlisted', '2024-01-16'),
('Bob Wilson', 'bob@test.com', '1234567890', 'Designer', 'Design', 'Website', '2.5', 'monthly', '45K', 'monthly', '55K', 'Creative designer', 'immediate', 'applied', '2024-01-17');
