-- Make optional fields nullable in employees table
-- This allows importing employees with only required fields (name)

-- Make email nullable
ALTER TABLE employees 
ALTER COLUMN email DROP NOT NULL;

-- Make department nullable
ALTER TABLE employees 
ALTER COLUMN department DROP NOT NULL;

-- Make position nullable
ALTER TABLE employees 
ALTER COLUMN position DROP NOT NULL;

-- Make phone nullable (if it has NOT NULL constraint)
ALTER TABLE employees 
ALTER COLUMN phone DROP NOT NULL;

-- Make reporting_manager nullable (if it has NOT NULL constraint)
ALTER TABLE employees 
ALTER COLUMN reporting_manager DROP NOT NULL;

-- Make employee_id nullable (if it has NOT NULL constraint)
ALTER TABLE employees 
ALTER COLUMN employee_id DROP NOT NULL;

-- Make salary nullable (if it has NOT NULL constraint)
ALTER TABLE employees 
ALTER COLUMN salary DROP NOT NULL;

-- Make cost_to_hire nullable (if it has NOT NULL constraint)
ALTER TABLE employees 
ALTER COLUMN cost_to_hire DROP NOT NULL;

-- Make probation_status nullable (if it has NOT NULL constraint)
ALTER TABLE employees 
ALTER COLUMN probation_status DROP NOT NULL;

-- Make source nullable (if it has NOT NULL constraint)
ALTER TABLE employees 
ALTER COLUMN source DROP NOT NULL;

-- Add comments to document the changes
COMMENT ON COLUMN employees.email IS 'Email address (optional - can be null)';
COMMENT ON COLUMN employees.department IS 'Department name (optional - can be null)';
COMMENT ON COLUMN employees.position IS 'Job position/title (optional - can be null)';
COMMENT ON COLUMN employees.phone IS 'Phone number (optional - can be null)';
COMMENT ON COLUMN employees.reporting_manager IS 'Reporting manager name (optional - can be null)';
COMMENT ON COLUMN employees.employee_id IS 'Employee ID (optional - can be null)';
COMMENT ON COLUMN employees.salary IS 'Annual salary (optional - can be null)';
COMMENT ON COLUMN employees.cost_to_hire IS 'Recruitment cost (optional - can be null)';
COMMENT ON COLUMN employees.probation_status IS 'Probation status (optional - can be null)';
COMMENT ON COLUMN employees.source IS 'Recruitment source (optional - can be null)'; 