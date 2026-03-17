const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test credentials
const TEST_EMPLOYEE = {
  email: 'test.employee@company.com',
  password: 'Test@123'
};

// Colors for console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test1_Login() {
  log('\n📝 Test 1: Employee Login', 'blue');
  try {
    const response = await axios.post(`${BASE_URL}/employee-portal/auth/login`, TEST_EMPLOYEE);
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      log('✅ Login successful', 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Login failed: ${error.message}`, 'red');
    return false;
  }
}

async function test2_GetClaims() {
  log('\n📝 Test 2: Get Claims', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/employee-portal/claims`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (response.data.success) {
      log(`✅ Claims fetched: ${response.data.data.length} claims found`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Get claims failed: ${error.message}`, 'red');
    return false;
  }
}

async function test3_SubmitClaim() {
  log('\n📝 Test 3: Submit Claim', 'blue');
  try {
    const claimData = {
      category: 'Travel',
      amount: 5000,
      description: 'Test claim from automated script'
    };
    const response = await axios.post(`${BASE_URL}/employee-portal/claims`, claimData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (response.data.success) {
      log('✅ Claim submitted successfully', 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Submit claim failed: ${error.message}`, 'red');
    return false;
  }
}

async function test4_GetTasks() {
  log('\n📝 Test 4: Get Tasks', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/employee-portal/tasks`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (response.data.success) {
      log(`✅ Tasks fetched: ${response.data.data.length} tasks found`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Get tasks failed: ${error.message}`, 'red');
    return false;
  }
}

async function test5_GetGrievances() {
  log('\n📝 Test 5: Get Grievances', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/employee-portal/grievances`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (response.data.success) {
      log(`✅ Grievances fetched: ${response.data.data.length} grievances found`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Get grievances failed: ${error.message}`, 'red');
    return false;
  }
}

async function test6_SubmitGrievance() {
  log('\n📝 Test 6: Submit Grievance', 'blue');
  try {
    const grievanceData = {
      title: 'Test Grievance',
      category: 'Work Environment',
      priority: 'medium',
      description: 'Test grievance from automated script'
    };
    const response = await axios.post(`${BASE_URL}/employee-portal/grievances`, grievanceData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (response.data.success) {
      log('✅ Grievance submitted successfully', 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Submit grievance failed: ${error.message}`, 'red');
    return false;
  }
}

async function test7_GetOrganogram() {
  log('\n📝 Test 7: Get Organogram', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/employee-portal/organogram`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (response.data.success) {
      log(`✅ Organogram fetched: ${response.data.data.length} nodes found`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Get organogram failed: ${error.message}`, 'red');
    return false;
  }
}

async function test8_GetDashboard() {
  log('\n📝 Test 8: Get Dashboard Stats', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/employee-portal/dashboard/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (response.data.success) {
      log('✅ Dashboard stats fetched successfully', 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Get dashboard failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n🚀 Starting HRMS Employee Portal Integration Tests', 'yellow');
  log('='.repeat(60), 'yellow');

  const results = {
    passed: 0,
    failed: 0,
    total: 8
  };

  // Run all tests
  if (await test1_Login()) results.passed++; else results.failed++;
  if (await test2_GetClaims()) results.passed++; else results.failed++;
  if (await test3_SubmitClaim()) results.passed++; else results.failed++;
  if (await test4_GetTasks()) results.passed++; else results.failed++;
  if (await test5_GetGrievances()) results.passed++; else results.failed++;
  if (await test6_SubmitGrievance()) results.passed++; else results.failed++;
  if (await test7_GetOrganogram()) results.passed++; else results.failed++;
  if (await test8_GetDashboard()) results.passed++; else results.failed++;

  // Print summary
  log('\n' + '='.repeat(60), 'yellow');
  log('📊 Test Summary', 'yellow');
  log('='.repeat(60), 'yellow');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`, 
      results.failed === 0 ? 'green' : 'yellow');
  
  if (results.failed === 0) {
    log('\n🎉 All tests passed! Integration is working perfectly!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'red');
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
