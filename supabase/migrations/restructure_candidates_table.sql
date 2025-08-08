-- Restructure candidates table to match new requirements
-- Drop existing table and recreate with new structure

-- First, backup existing data (optional - you can comment this out if you don't need to preserve data)
CREATE TABLE IF NOT EXISTS candidates_backup AS SELECT * FROM candidates;

-- Drop the existing table
DROP TABLE IF EXISTS candidates CASCADE;

-- Create new candidates table with the required structure
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  position text,
  department text,
  source text,
  experience integer,
  cu_monthly_yearly text DEFAULT 'monthly',
  current_salary integer,
  ex_monthly_yearly text DEFAULT 'monthly',
  expected_salary integer,
  remark text,
  notice_period text,
  interview_status text DEFAULT 'applied',
  applied_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Add comments to document the new structure
COMMENT ON TABLE candidates IS 'Candidates table with restructured fields for recruitment management';
COMMENT ON COLUMN candidates.name IS 'Candidate full name (required)';
COMMENT ON COLUMN candidates.email IS 'Email address (optional)';
COMMENT ON COLUMN candidates.phone IS 'Phone number (optional)';
COMMENT ON COLUMN candidates.position IS 'Applied position (optional)';
COMMENT ON COLUMN candidates.department IS 'Department (optional)';
COMMENT ON COLUMN candidates.source IS 'Application source (optional)';
COMMENT ON COLUMN candidates.experience IS 'Years of experience (optional)';
COMMENT ON COLUMN candidates.cu_monthly_yearly IS 'Current salary type - monthly or yearly (default: monthly)';
COMMENT ON COLUMN candidates.current_salary IS 'Current salary amount (optional)';
COMMENT ON COLUMN candidates.ex_monthly_yearly IS 'Expected salary type - monthly or yearly (default: monthly)';
COMMENT ON COLUMN candidates.expected_salary IS 'Expected salary amount (optional)';
COMMENT ON COLUMN candidates.remark IS 'Additional remarks (optional)';
COMMENT ON COLUMN candidates.notice_period IS 'Notice period (optional)';
COMMENT ON COLUMN candidates.interview_status IS 'Interview status (default: applied)';
COMMENT ON COLUMN candidates.applied_date IS 'Date when candidate applied (default: current date)';

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
