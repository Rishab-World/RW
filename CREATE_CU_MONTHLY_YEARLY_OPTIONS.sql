-- Create CU Monthly/Yearly options table
CREATE TABLE IF NOT EXISTS cu_monthly_yearly_options (
  id SERIAL PRIMARY KEY,
  option_value TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Insert the required options
INSERT INTO cu_monthly_yearly_options (option_value, display_name) VALUES
('monthly', 'Monthly'),
('yearly', 'Yearly'),
('between', 'Between')
ON CONFLICT (option_value) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE cu_monthly_yearly_options ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON cu_monthly_yearly_options
    FOR ALL USING (auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE cu_monthly_yearly_options IS 'Options for CU Monthly/Yearly field in candidates table';
COMMENT ON COLUMN cu_monthly_yearly_options.option_value IS 'The value stored in the database';
COMMENT ON COLUMN cu_monthly_yearly_options.display_name IS 'The name displayed in the UI';
