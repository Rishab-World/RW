-- Create EX Monthly/Yearly options table
CREATE TABLE IF NOT EXISTS ex_monthly_yearly_options (
  id SERIAL PRIMARY KEY,
  option_value TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Insert the required options
INSERT INTO ex_monthly_yearly_options (option_value, display_name) VALUES
('monthly', 'Monthly'),
('yearly', 'Yearly'),
('between', 'Between'),
('percentage_hike', 'Percentage Hike'),
('company_offer', 'Company Offer'),
('negotiation', 'Negotiation')
ON CONFLICT (option_value) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE ex_monthly_yearly_options ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON ex_monthly_yearly_options
    FOR ALL USING (auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE ex_monthly_yearly_options IS 'Options for EX Monthly/Yearly field in candidates table';
COMMENT ON COLUMN ex_monthly_yearly_options.option_value IS 'The value stored in the database';
COMMENT ON COLUMN ex_monthly_yearly_options.display_name IS 'The name displayed in the UI';
