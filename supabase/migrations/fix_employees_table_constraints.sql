-- Fix employees table constraints to allow optional fields
-- Based on the actual table structure provided

-- Make email nullable (currently has NOT NULL constraint)
ALTER TABLE employees 
ALTER COLUMN email DROP NOT NULL;

-- Add comments to document the changes
COMMENT ON COLUMN employees.email IS 'Email address (optional - can be null)';
COMMENT ON COLUMN employees.department IS 'Department name (optional - can be null)';
COMMENT ON COLUMN employees.position IS 'Job position/title (optional - can be null)';
COMMENT ON COLUMN employees.phone IS 'Phone number (optional - can be null)';
COMMENT ON COLUMN employees.reporting_manager IS 'Reporting manager name (optional - can be null)';
COMMENT ON COLUMN employees.employee_id IS 'Employee ID (optional - can be null)';
COMMENT ON COLUMN employees.salary IS 'Annual salary (optional - can be null)';
COMMENT ON COLUMN employees.probation_status IS 'Probation status (optional - can be null)';
COMMENT ON COLUMN employees.source IS 'Recruitment source (optional - can be null)';

-- Note: The following columns are already nullable in your table structure:
-- phone, department, position, join_date, reporting_manager, employee_id, 
-- salary, probation_status, available_days, pending_requests, used_days_this_year,
-- last_review, goal_completion, performance_rating, grade, source 