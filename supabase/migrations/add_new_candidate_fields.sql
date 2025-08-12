-- Add new fields to candidates table
-- This migration adds the new fields: cu_monthly_yearly, ex_monthly_yearly, department, applied_date

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

-- Create foreign key constraints (optional - uncomment if you want strict referential integrity)
-- ALTER TABLE candidates ADD CONSTRAINT fk_candidates_cu_monthly_yearly 
--   FOREIGN KEY (cu_monthly_yearly) REFERENCES cu_monthly_yearly_options(option_value);
-- 
-- ALTER TABLE candidates ADD CONSTRAINT fk_candidates_ex_monthly_yearly 
--   FOREIGN KEY (ex_monthly_yearly) REFERENCES ex_monthly_yearly_options(option_value);
-- 
-- ALTER TABLE candidates ADD CONSTRAINT fk_candidates_department 
--   FOREIGN KEY (department) REFERENCES departments(department_name);
