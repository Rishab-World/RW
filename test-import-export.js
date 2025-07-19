// Test script for Employee Import/Export functionality
// This script can be run in the browser console to test the functionality

// Sample valid employee data
const validEmployeeData = [
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
  }
];

// Sample invalid employee data (for testing validation)
const invalidEmployeeData = [
  {
    name: '', // Missing name
    email: 'invalid-email', // Invalid email
    department: 'Engineering',
    position: 'Software Engineer',
    join_date: '2024-13-45', // Invalid date
    salary: 'not-a-number', // Invalid salary
    status: 'invalid-status' // Invalid status
  },
  {
    name: 'John Doe',
    email: 'john.doe@example.com', // Duplicate email
    department: 'Engineering',
    position: 'Software Engineer'
  }
];

// Test validation function
function testValidation(data) {
  console.log('Testing validation with data:', data);
  
  // Simulate validation logic
  const errors = [];
  
  data.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowErrors = [];
    
    // Required field validations
    if (!row.name || row.name.trim() === '') {
      rowErrors.push('Name is required');
    }
    
    if (!row.email || row.email.trim() === '') {
      rowErrors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      rowErrors.push('Invalid email format');
    }
    
    if (!row.department || row.department.trim() === '') {
      rowErrors.push('Department is required');
    }
    
    if (!row.position || row.position.trim() === '') {
      rowErrors.push('Position is required');
    }
    
    // Date validation
    if (row.join_date) {
      const joinDate = new Date(row.join_date);
      if (isNaN(joinDate.getTime())) {
        rowErrors.push('Invalid join date format (use YYYY-MM-DD)');
      }
    }
    
    // Salary validation
    if (row.salary && isNaN(Number(row.salary))) {
      rowErrors.push('Salary must be a valid number');
    }
    
    // Status validation
    if (row.status && !['active', 'inactive', 'terminated', 'resigned'].includes(row.status.toLowerCase())) {
      rowErrors.push('Status must be one of: active, inactive, terminated, resigned');
    }
    
    if (rowErrors.length > 0) {
      errors.push(`Row ${rowNumber}: ${rowErrors.join(', ')}`);
    }
  });
  
  return errors;
}

// Run tests
console.log('=== Employee Import/Export Test ===');

console.log('\n1. Testing valid data:');
const validErrors = testValidation(validEmployeeData);
if (validErrors.length === 0) {
  console.log('✅ Valid data passed validation');
} else {
  console.log('❌ Valid data failed validation:', validErrors);
}

console.log('\n2. Testing invalid data:');
const invalidErrors = testValidation(invalidEmployeeData);
if (invalidErrors.length > 0) {
  console.log('✅ Invalid data correctly caught errors:', invalidErrors);
} else {
  console.log('❌ Invalid data should have errors but none were found');
}

console.log('\n3. Testing email format validation:');
const emailTests = [
  'test@example.com', // Valid
  'invalid-email', // Invalid
  'test@.com', // Invalid
  'test@example', // Invalid
  'test.example.com' // Invalid
];

emailTests.forEach(email => {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  console.log(`${email}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

console.log('\n4. Testing date format validation:');
const dateTests = [
  '2024-01-15', // Valid
  '2024-13-45', // Invalid
  '2024/01/15', // Invalid
  '15-01-2024', // Invalid
  '2024-01-32' // Invalid
];

dateTests.forEach(date => {
  const testDate = new Date(date);
  const isValid = !isNaN(testDate.getTime());
  console.log(`${date}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

console.log('\n=== Test Complete ===');

// Export test data for manual testing
window.testEmployeeData = {
  valid: validEmployeeData,
  invalid: invalidEmployeeData
};

console.log('\nTest data available as window.testEmployeeData'); 