-- Create PMS Quarterly Report tables
-- Main summary table
CREATE TABLE IF NOT EXISTS pms_quarterly_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quarter VARCHAR(20) NOT NULL,
    department VARCHAR(100) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_code VARCHAR(50) NOT NULL,
    kra_score DECIMAL(5,2) NOT NULL,
    max_kra DECIMAL(5,2) NOT NULL,
    goal_score DECIMAL(5,2) NOT NULL,
    max_goal DECIMAL(5,2) NOT NULL,
    total_score DECIMAL(5,2) NOT NULL,
    max_total DECIMAL(5,2) NOT NULL,
    percentage_out_of_10 DECIMAL(4,2) NOT NULL,
    remark TEXT,
    file_name VARCHAR(255),
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed KRA and Goal scores table
CREATE TABLE IF NOT EXISTS pms_quarterly_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES pms_quarterly_reports(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('KRA', 'GOAL')),
    name VARCHAR(500) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    self_comment TEXT,
    pms1_comment TEXT,
    hr_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pms_quarterly_reports_quarter ON pms_quarterly_reports(quarter);
CREATE INDEX IF NOT EXISTS idx_pms_quarterly_reports_department ON pms_quarterly_reports(department);
CREATE INDEX IF NOT EXISTS idx_pms_quarterly_reports_employee_code ON pms_quarterly_reports(employee_code);
CREATE INDEX IF NOT EXISTS idx_pms_quarterly_reports_uploaded_by ON pms_quarterly_reports(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_pms_quarterly_details_report_id ON pms_quarterly_details(report_id);
CREATE INDEX IF NOT EXISTS idx_pms_quarterly_details_type ON pms_quarterly_details(type);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_pms_quarterly_reports_updated_at 
    BEFORE UPDATE ON pms_quarterly_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE pms_quarterly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_quarterly_details ENABLE ROW LEVEL SECURITY;

-- Create policies for pms_quarterly_reports
CREATE POLICY "Users can view their own uploaded reports" ON pms_quarterly_reports
    FOR SELECT USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can insert their own reports" ON pms_quarterly_reports
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own reports" ON pms_quarterly_reports
    FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own reports" ON pms_quarterly_reports
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Create policies for pms_quarterly_details
CREATE POLICY "Users can view details of their own reports" ON pms_quarterly_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pms_quarterly_reports 
            WHERE pms_quarterly_reports.id = pms_quarterly_details.report_id 
            AND pms_quarterly_reports.uploaded_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert details for their own reports" ON pms_quarterly_details
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pms_quarterly_reports 
            WHERE pms_quarterly_reports.id = pms_quarterly_details.report_id 
            AND pms_quarterly_reports.uploaded_by = auth.uid()
        )
    );

CREATE POLICY "Users can update details of their own reports" ON pms_quarterly_details
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pms_quarterly_reports 
            WHERE pms_quarterly_reports.id = pms_quarterly_details.report_id 
            AND pms_quarterly_reports.uploaded_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete details of their own reports" ON pms_quarterly_details
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM pms_quarterly_reports 
            WHERE pms_quarterly_reports.id = pms_quarterly_details.report_id 
            AND pms_quarterly_reports.uploaded_by = auth.uid()
        )
    ); 