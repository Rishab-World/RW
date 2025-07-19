-- Make email column nullable in employees table
-- This allows importing employees without email addresses

ALTER TABLE employees 
ALTER COLUMN email DROP NOT NULL;

-- Add a comment to document the change
COMMENT ON COLUMN employees.email IS 'Email address (optional - can be null)'; 