-- Add new columns to candidates table
-- Department column after position
-- Monthly/Yearly column after experience  
-- Note: remark column already exists

-- Add department column
ALTER TABLE candidates 
ADD COLUMN department VARCHAR(255);

-- Add monthly_yearly column (to indicate if salary is monthly or yearly)
ALTER TABLE candidates 
ADD COLUMN monthly_yearly VARCHAR(20) DEFAULT 'monthly';

-- Add comments to document the new columns
COMMENT ON COLUMN candidates.department IS 'Department name for the candidate position';
COMMENT ON COLUMN candidates.monthly_yearly IS 'Indicates if salary is monthly or yearly (default: monthly)'; 