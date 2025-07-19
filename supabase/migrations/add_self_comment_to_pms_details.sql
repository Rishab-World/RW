-- Add self_comment column to pms_quarterly_details table
ALTER TABLE pms_quarterly_details 
ADD COLUMN IF NOT EXISTS self_comment TEXT; 