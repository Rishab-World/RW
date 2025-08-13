-- Create mail_master table for employee contact management
CREATE TABLE IF NOT EXISTS mail_master (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255), -- @rishabworld.com domain
    personal_email VARCHAR(255), -- @gmail.com or other personal domains
    phone_number VARCHAR(20), -- For WhatsApp linking
    department VARCHAR(100),
    position VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mail_master_employee_id ON mail_master(employee_id);
CREATE INDEX IF NOT EXISTS idx_mail_master_company_email ON mail_master(company_email);
CREATE INDEX IF NOT EXISTS idx_mail_master_personal_email ON mail_master(personal_email);
CREATE INDEX IF NOT EXISTS idx_mail_master_department ON mail_master(department);
CREATE INDEX IF NOT EXISTS idx_mail_master_status ON mail_master(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE mail_master ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON mail_master
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_mail_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_mail_master_updated_at 
    BEFORE UPDATE ON mail_master 
    FOR EACH ROW 
    EXECUTE FUNCTION update_mail_master_updated_at();

-- Add comments to document the table structure
COMMENT ON TABLE mail_master IS 'Employee contact information for email communications';
COMMENT ON COLUMN mail_master.employee_id IS 'Unique employee identifier';
COMMENT ON COLUMN mail_master.company_email IS 'Company email address (@rishabworld.com domain)';
COMMENT ON COLUMN mail_master.personal_email IS 'Personal email address (@gmail.com or other domains)';
COMMENT ON COLUMN mail_master.phone_number IS 'Phone number for WhatsApp communication';
COMMENT ON COLUMN mail_master.status IS 'Employee status (active/inactive)';
