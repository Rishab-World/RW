-- Create KYC Data Table
CREATE TABLE IF NOT EXISTS kyc_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    husband_name VARCHAR(255),
    gender VARCHAR(50),
    marital_status VARCHAR(50),
    dob_aadhar DATE,
    designation VARCHAR(255),
    basic_salary DECIMAL(12,2),
    special_allowance DECIMAL(12,2),
    conveyance DECIMAL(12,2),
    hra DECIMAL(12,2),
    cea DECIMAL(12,2),
    books_perks DECIMAL(12,2),
    telephonic DECIMAL(12,2),
    gross_salary DECIMAL(12,2),
    date_of_appointment DATE,
    mobile_no VARCHAR(20),
    email_id VARCHAR(255) NOT NULL,
    aadhar_no VARCHAR(12),
    name_per_aadhar VARCHAR(255),
    pan_no VARCHAR(10),
    name_per_pan VARCHAR(255),
    bank_account_no VARCHAR(50),
    ifsc_code VARCHAR(11),
    permanent_address TEXT,
    aadhar_address TEXT,
    grade VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to the table
COMMENT ON TABLE kyc_data IS 'Employee KYC (Know Your Customer) data table';
COMMENT ON COLUMN kyc_data.employee_name IS 'Full name of the employee';
COMMENT ON COLUMN kyc_data.father_name IS 'Father''s name of the employee';
COMMENT ON COLUMN kyc_data.husband_name IS 'Husband''s name (if married)';
COMMENT ON COLUMN kyc_data.gender IS 'Gender of the employee';
COMMENT ON COLUMN kyc_data.marital_status IS 'Marital status of the employee';
COMMENT ON COLUMN kyc_data.dob_aadhar IS 'Date of birth as per Aadhar card';
COMMENT ON COLUMN kyc_data.designation IS 'Job designation/title';
COMMENT ON COLUMN kyc_data.basic_salary IS 'Basic salary amount';
COMMENT ON COLUMN kyc_data.special_allowance IS 'Special allowance amount';
COMMENT ON COLUMN kyc_data.conveyance IS 'Conveyance allowance amount';
COMMENT ON COLUMN kyc_data.hra IS 'House Rent Allowance amount';
COMMENT ON COLUMN kyc_data.cea IS 'Children Education Allowance amount';
COMMENT ON COLUMN kyc_data.books_perks IS 'Books and perks allowance amount';
COMMENT ON COLUMN kyc_data.telephonic IS 'Telephonic allowance amount';
COMMENT ON COLUMN kyc_data.gross_salary IS 'Gross salary amount';
COMMENT ON COLUMN kyc_data.date_of_appointment IS 'Date of appointment/joining';
COMMENT ON COLUMN kyc_data.mobile_no IS 'Mobile phone number';
COMMENT ON COLUMN kyc_data.email_id IS 'Email address (required)';
COMMENT ON COLUMN kyc_data.aadhar_no IS 'Aadhar card number';
COMMENT ON COLUMN kyc_data.name_per_aadhar IS 'Name as per Aadhar card';
COMMENT ON COLUMN kyc_data.pan_no IS 'PAN card number';
COMMENT ON COLUMN kyc_data.name_per_pan IS 'Name as per PAN card';
COMMENT ON COLUMN kyc_data.bank_account_no IS 'Bank account number';
COMMENT ON COLUMN kyc_data.ifsc_code IS 'IFSC code of the bank';
COMMENT ON COLUMN kyc_data.permanent_address IS 'Permanent address';
COMMENT ON COLUMN kyc_data.aadhar_address IS 'Address as per Aadhar card';
COMMENT ON COLUMN kyc_data.grade IS 'Employee grade (M1-M8)';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kyc_data_email ON kyc_data(email_id);
CREATE INDEX IF NOT EXISTS idx_kyc_data_employee_name ON kyc_data(employee_name);
CREATE INDEX IF NOT EXISTS idx_kyc_data_grade ON kyc_data(grade);
CREATE INDEX IF NOT EXISTS idx_kyc_data_created_at ON kyc_data(created_at);

-- Enable Row Level Security
ALTER TABLE kyc_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (permissive for now)
CREATE POLICY "Allow all operations on kyc_data" ON kyc_data
    FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_kyc_data_updated_at 
    BEFORE UPDATE ON kyc_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 