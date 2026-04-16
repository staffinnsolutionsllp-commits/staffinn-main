// QUICK BACKEND SERVER TEST
// Run this in browser console to check if backend is running

console.log('🧪 ========== BACKEND SERVER TEST ==========');

async function testBackendServer() {
  const API_URL = 'http://localhost:4001/api/v1';
  
  console.log('\n📡 Testing backend server...');
  console.log('API URL:', API_URL);
  
  try {
    // Test 1: Health Check
    console.log('\n🏥 Test 1: Health Check');
    const healthResponse = await fetch('http://localhost:4001/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData);
    
    // Test 2: API Test Endpoint
    console.log('\n🔧 Test 2: API Test Endpoint');
    const apiTestResponse = await fetch(`${API_URL}/test`);
    const apiTestData = await apiTestResponse.json();
    console.log('✅ API test passed:', apiTestData);
    
    // Test 3: Check if enrollment route exists
    console.log('\n📚 Test 3: Enrollment Route Check');
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('⚠️ No token found - please login first');
      return;
    }
    
    console.log('🔑 Token found:', token.substring(0, 20) + '...');
    
    // Try to get available students (this will test the route)
    const studentsResponse = await fetch(`${API_URL}/institute-course-enrollment/available-students`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Students endpoint status:', studentsResponse.status);
    
    if (studentsResponse.ok) {
      const studentsData = await studentsResponse.json();
      console.log('✅ Enrollment route is working!');
      console.log('📋 Available students:', studentsData.data?.length || 0);
    } else {
      const errorData = await studentsResponse.json();
      console.log('❌ Enrollment route error:', errorData);
    }
    
    console.log('\n✅ ========== ALL TESTS PASSED ==========');
    console.log('Backend server is running and enrollment routes are accessible!');
    
  } catch (error) {
    console.error('\n❌ ========== TEST FAILED ==========');
    console.error('Error:', error.message);
    
    if (error.message.includes('Failed to fetch')) {
      console.error('\n🚨 BACKEND SERVER IS NOT RUNNING!');
      console.error('\nTo fix:');
      console.error('1. Open terminal');
      console.error('2. cd d:\\Staffinn-main\\Backend');
      console.error('3. npm start');
      console.error('4. Wait for "SERVER STARTED SUCCESSFULLY" message');
      console.error('5. Refresh this page and try again');
    }
  }
}

// Run the test
testBackendServer();
