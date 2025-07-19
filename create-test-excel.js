// Script to create a test Excel file for employee import
// Run this with: node create-test-excel.js

const XLSX = require('xlsx');

// Sample employee data for testing
const testData = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91-9876543210',
    department: 'Engineering',
    position: 'Software Engineer',
    join_date: '2024-01-15',
    status: 'active',
    reporting_manager: 'Jane Smith',
    employee_id: 'EMP001',
    salary: '75000',
    cost_to_hire: '50000',
    probation_status: 'ongoing',
    source: 'LinkedIn'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+91-9876543211',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    join_date: '2023-06-01',
    status: 'active',
    reporting_manager: 'Mike Johnson',
    employee_id: 'EMP002',
    salary: '95000',
    cost_to_hire: '60000',
    probation_status: 'completed',
    source: 'Employee Referral'
  },
  {
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    phone: '+91-9876543212',
    department: 'Product Management',
    position: 'Product Manager',
    join_date: '2023-03-15',
    status: 'active',
    reporting_manager: 'Sarah Wilson',
    employee_id: 'EMP003',
    salary: '85000',
    cost_to_hire: '45000',
    probation_status: 'completed',
    source: 'Company Website'
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    phone: '+91-9876543213',
    department: 'Product Management',
    position: 'Senior Product Manager',
    join_date: '2022-09-01',
    status: 'active',
    reporting_manager: 'David Brown',
    employee_id: 'EMP004',
    salary: '110000',
    cost_to_hire: '70000',
    probation_status: 'completed',
    source: 'Recruitment Agency'
  },
  {
    name: 'David Brown',
    email: 'david.brown@example.com',
    phone: '+91-9876543214',
    department: 'Sales',
    position: 'Sales Director',
    join_date: '2022-01-15',
    status: 'active',
    reporting_manager: 'CEO',
    employee_id: 'EMP005',
    salary: '120000',
    cost_to_hire: '80000',
    probation_status: 'completed',
    source: 'Job Fair'
  }
];

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(testData);

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

// Write the file
XLSX.writeFile(workbook, 'test-employees.xlsx');

console.log('✅ Test Excel file created: test-employees.xlsx');
console.log('📊 File contains', testData.length, 'employee records');
console.log('📋 Columns included: name, email, phone, department, position, join_date, status, reporting_manager, employee_id, salary, cost_to_hire, probation_status, source');
console.log('\nYou can now use this file to test the import functionality in your HR portal.'); 