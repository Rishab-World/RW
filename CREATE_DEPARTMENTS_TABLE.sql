-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  department_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Insert the required department options
INSERT INTO departments (department_name) VALUES
('Accounts & Finance'),
('Administration'),
('Arok'),
('Ccc'),
('Crm'),
('D & J'),
('D & J Operations'),
('D & J Procourment'),
('D & J The Avenue'),
('Design'),
('Fabric & Yarn'),
('Gabanna'),
('GSP - TAS'),
('Human Resource'),
('IT'),
('Italian Channel'),
('Knox'),
('Management'),
('Management - Rajesh Singh'),
('Management - Rishab Jain'),
('MIS'),
('NA'),
('Namita Dange'),
('Optus'),
('Procurement'),
('Rare Wool'),
('Retail'),
('Social Media And Marketing'),
('Strch'),
('Tamiska'),
('Vercelli'),
('Vercelli Retail'),
('Warehouse')
ON CONFLICT (department_name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON departments
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_departments_updated_at 
    BEFORE UPDATE ON departments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE departments IS 'Departments table for candidates and employees';
COMMENT ON COLUMN departments.department_name IS 'Department name (unique)';
COMMENT ON COLUMN departments.is_active IS 'Whether the department is active';
COMMENT ON COLUMN departments.created_at IS 'When the department was created';
COMMENT ON COLUMN departments.updated_at IS 'When the department was last updated';

-- Create indexes for better performance
CREATE INDEX idx_departments_name ON departments(department_name);
CREATE INDEX idx_departments_active ON departments(is_active);
