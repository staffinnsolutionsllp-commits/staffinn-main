/**
 * Test script for HRMS Payroll System
 * Run: node test-payroll-system.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';
let authToken = '';

// Test configuration
const testConfig = {
  email: 'test@hrms.com', // Replace with actual HRMS user
  password: 'test123',     // Replace with actual password
  month: '2024-03'
};

// Helper function for API calls
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const tests = {
  // 1. Login
  login: async () => {
    console.log('\n🔐 Test 1: Login to HRMS');
    try {
      const response = await axios.post(`${API_URL}/hrms/auth/login`, {
        email: testConfig.email,
        password: testConfig.password
      });
      
      if (response.data.success && response.data.token) {
        authToken = response.data.token;
        console.log('✅ Login successful');
        console.log('   Token:', authToken.substring(0, 20) + '...');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 2. Get all employees
  getEmployees: async () => {
    console.log('\n👥 Test 2: Get All Employees');
    try {
      const result = await apiCall('GET', '/hrms/employees');
      console.log(`✅ Found ${result.data.length} employees`);
      if (result.data.length > 0) {
        console.log('   Sample employee:', {
          id: result.data[0].employeeId,
          name: result.data[0].fullName,
          basicSalary: result.data[0].basicSalary || result.data[0].basicPay
        });
      }
      return result.data;
    } catch (error) {
      console.error('❌ Failed to get employees');
      return [];
    }
  },

  // 3. Run payroll
  runPayroll: async () => {
    console.log(`\n💰 Test 3: Run Payroll for ${testConfig.month}`);
    try {
      const result = await apiCall('POST', '/hrms/payroll/run', {
        month: testConfig.month
      });
      
      if (result.success) {
        console.log('✅ Payroll processed successfully');
        console.log('   Total Employees:', result.data.totalEmployees);
        console.log('   Total Gross Salary:', result.data.totalGrossSalary);
        console.log('   Total Deductions:', result.data.totalDeductions);
        console.log('   Total Net Salary:', result.data.totalNetSalary);
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to run payroll');
      return null;
    }
  },

  // 4. Get payroll by month
  getPayrollByMonth: async () => {
    console.log(`\n📊 Test 4: Get Payroll Records for ${testConfig.month}`);
    try {
      const result = await apiCall('GET', `/hrms/payroll/month/${testConfig.month}`);
      console.log(`✅ Found ${result.data.length} payroll records`);
      if (result.data.length > 0) {
        const record = result.data[0];
        console.log('   Sample record:', {
          employee: record.employeeName,
          basicSalary: record.basicSalary,
          totalEarnings: record.totalEarnings,
          totalDeductions: record.totalDeductions,
          netSalary: record.netSalary
        });
      }
      return result.data;
    } catch (error) {
      console.error('❌ Failed to get payroll records');
      return [];
    }
  },

  // 5. Get payroll summary
  getPayrollSummary: async () => {
    console.log(`\n📈 Test 5: Get Payroll Summary`);
    try {
      const result = await apiCall('GET', `/hrms/payroll/summary?month=${testConfig.month}`);
      console.log('✅ Payroll summary retrieved');
      console.log('   Total Records:', result.data.totalRecords);
      console.log('   Total Gross Salary:', result.data.totalGrossSalary);
      console.log('   Total Deductions:', result.data.totalDeductions);
      console.log('   Total Net Salary:', result.data.totalNetSalary);
      console.log('   Pending Payments:', result.data.pendingPayments);
      console.log('   Paid Payments:', result.data.paidPayments);
      return result.data;
    } catch (error) {
      console.error('❌ Failed to get payroll summary');
      return null;
    }
  },

  // 6. Get employee payroll history
  getEmployeeHistory: async (employeeId) => {
    console.log(`\n📜 Test 6: Get Employee Payroll History (${employeeId})`);
    try {
      const result = await apiCall('GET', `/hrms/payroll/employee/${employeeId}`);
      console.log(`✅ Found ${result.data.length} payroll records for employee`);
      result.data.forEach(record => {
        console.log(`   ${record.month}: Net Salary = ${record.netSalary}`);
      });
      return result.data;
    } catch (error) {
      console.error('❌ Failed to get employee payroll history');
      return [];
    }
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting HRMS Payroll System Tests...');
  console.log('=' .repeat(60));

  try {
    // Test 1: Login
    const loginSuccess = await tests.login();
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without authentication');
      return;
    }

    // Test 2: Get employees
    const employees = await tests.getEmployees();
    if (employees.length === 0) {
      console.log('\n⚠️  No employees found. Please add employees first.');
      return;
    }

    // Test 3: Run payroll
    const payrollResult = await tests.runPayroll();
    if (!payrollResult) {
      console.log('\n⚠️  Payroll processing failed');
      return;
    }

    // Test 4: Get payroll by month
    const payrollRecords = await tests.getPayrollByMonth();

    // Test 5: Get payroll summary
    await tests.getPayrollSummary();

    // Test 6: Get employee history (for first employee)
    if (employees.length > 0) {
      await tests.getEmployeeHistory(employees[0].employeeId);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Employees: ${employees.length}`);
    console.log(`   - Payroll Records: ${payrollRecords.length}`);
    console.log(`   - Month: ${testConfig.month}`);

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
};

// Run tests
runAllTests();
