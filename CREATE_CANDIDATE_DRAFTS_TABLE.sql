-- Create candidate_drafts table with the same structure as candidates table
-- This allows users to save incomplete form data and resume later
-- Run this SQL in your Supabase Dashboard SQL Editor

CREATE TABLE candidate_drafts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  department VARCHAR(255),
  job_id UUID REFERENCES jobs(id) NULL,
  source TEXT,
  experience INTEGER,
  monthly_yearly VARCHAR(20) DEFAULT 'monthly',
  expected_salary DECIMAL(10,2),
  current_salary DECIMAL(10,2),
  remark TEXT,
  notice_period TEXT,
  resume_uploaded BOOLEAN DEFAULT FALSE,
  resume_url TEXT,
  interview_status TEXT DEFAULT 'applied',
  applied_date DATE DEFAULT CURRENT_DATE,
  custom_position TEXT, -- For custom job titles when "Custom" is selected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT -- Store user email who created the draft
);

-- Add comments to document the new columns
COMMENT ON COLUMN candidate_drafts.job_id IS 'Job ID reference (NULL for custom positions)';

-- Add comments to document the table
COMMENT ON TABLE candidate_drafts IS 'Draft candidates table for saving incomplete form data';
COMMENT ON COLUMN candidate_drafts.custom_position IS 'Custom job title when user selects "Custom" option';
COMMENT ON COLUMN candidate_drafts.created_by IS 'Email of user who created the draft';

-- Create index for better performance
CREATE INDEX idx_candidate_drafts_created_by ON candidate_drafts(created_by);
CREATE INDEX idx_candidate_drafts_created_at ON candidate_drafts(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE candidate_drafts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own drafts
CREATE POLICY "Users can view their own drafts" ON candidate_drafts
  FOR SELECT USING (created_by = current_user);

-- Create policy to allow users to insert their own drafts
CREATE POLICY "Users can insert their own drafts" ON candidate_drafts
  FOR INSERT WITH CHECK (created_by = current_user);

-- Create policy to allow users to update their own drafts
CREATE POLICY "Users can update their own drafts" ON candidate_drafts
  FOR UPDATE USING (created_by = current_user);

-- Create policy to allow users to delete their own drafts
CREATE POLICY "Users can delete their own drafts" ON candidate_drafts
  FOR DELETE USING (created_by = current_user); 