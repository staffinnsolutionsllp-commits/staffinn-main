/**
 * Test API endpoints to debug staff course access
 */
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4001/api/v1';

// Test token - you'll need to get this from a real login
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5ZjE2YzY4Ny1hNzE5LTQ5YzMtOTNhNi1hNzE5NDljMzk0YTYiLCJlbWFpbCI6InN0YWZmQGV4YW1wbGUuY29tIiwicm9sZSI6InN0YWZmIiwiaWF0IjoxNzM2NTk0NzI5LCJleHAiOjE3MzY2ODExMjl9.example';

async function testAPI(endpoint, method = 'GET', body = null, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
      method,
      headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`🔍 Testing ${method} ${endpoint}...`);
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    console.log('---\n');
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Staff Course API Endpoints\n');
  
  // Test 1: Check if server is running
  await testAPI('/auth/health');
  
  // Test 2: Try to get user enrollments (will fail without valid token)
  await testAPI('/institutes/my-enrollments', 'GET', null, TEST_TOKEN);
  
  // Test 3: Try to get public institutes
  await testAPI('/institutes/public/all');
  
  // Test 4: Try to get public courses for an institute
  await testAPI('/institutes/public/test-institute-id/courses');
  
  console.log('✅ API endpoint tests completed');
}

// Run tests
runTests();