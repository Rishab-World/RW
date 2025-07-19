# Database Fix Instructions

## Problem
The import functionality is failing with the error:
```
null value in column "email" of relation "employees" violates not-null constraint
```

This happens because your `employees` table has `email text not null` constraint, but our application allows optional email fields.

## Root Cause
Looking at your table structure:
```sql
create table employees (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,  -- ← This is the problem!
  phone text,
  department text,
  position text,
  -- ... other fields
);
```

The `email` field has `NOT NULL` constraint, but our import functionality allows optional email.

## Solution
You need to make the `email` column nullable.

## How to Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Open your Supabase project
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy and paste this SQL:
   ```sql
   -- Make email nullable to allow optional email in imports
   ALTER TABLE employees 
   ALTER COLUMN email DROP NOT NULL;
   ```
   - Click "Run" to execute

3. **Verify the Changes**
   - Go to Table Editor
   - Check the `employees` table
   - Verify that the `email` column is now nullable

### Option 2: Using the Migration File

1. **Copy the SQL from**: `supabase/migrations/fix_employees_table_constraints.sql`
2. **Paste into Supabase SQL Editor**
3. **Click "Run"**

## What This Does

This migration will:
- ✅ Make `email` nullable (allows importing without email)
- ✅ Keep `name` as the only required field
- ✅ Allow all other fields to remain optional (they already are)

## After Running the Migration

1. **Test the Import**
   - Try importing your Excel file again
   - The "null value" errors should be resolved

2. **Verify Functionality**
   - Import should work with only name field
   - Email can be empty/null
   - All validation should pass

## Safety Note

This migration is safe because:
- It only removes the NOT NULL constraint from email
- It doesn't delete any data
- It doesn't change existing data
- It only affects new insertions

## Expected Result

After running this migration:
- ✅ Import will work with minimal data (just name)
- ✅ No more "null value" constraint errors
- ✅ Email field can be empty
- ✅ Import functionality will work as expected

## Quick Fix SQL

Just run this single line in your Supabase SQL Editor:
```sql
ALTER TABLE employees ALTER COLUMN email DROP NOT NULL;
``` 