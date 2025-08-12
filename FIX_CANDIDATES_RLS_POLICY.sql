-- Fix RLS policy for candidates table to ensure all records are visible
-- This will resolve the issue where only 1002 out of 1635 records are showing

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON candidates;

-- Create a more permissive policy that allows all authenticated users to see all candidates
CREATE POLICY "Allow all operations for authenticated users" ON candidates
    FOR ALL USING (auth.role() = 'authenticated');

-- Alternative: If the above doesn't work, create an even more permissive policy
-- CREATE POLICY "Allow all operations for authenticated users" ON candidates
--     FOR ALL USING (true);

-- Verify the policy is created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'candidates';

-- Test query to verify all records are accessible
-- Run this in Supabase SQL Editor to confirm:
-- SELECT COUNT(*) FROM candidates;
