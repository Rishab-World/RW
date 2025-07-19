-- Add pms1_comment and hr_comment columns to pms_quarterly_details table
ALTER TABLE pms_quarterly_details 
ADD COLUMN IF NOT EXISTS pms1_comment TEXT;

ALTER TABLE pms_quarterly_details 
ADD COLUMN IF NOT EXISTS hr_comment TEXT; 