/**
 * Test Dashboard API
 * Simple test to verify dashboard endpoint works
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:4001/api/v1';

async function testDashboardAPI() {
  try {
    console.log('Testing Dashboard API...\n');
    
    // First, try to initialize admin
    console.log('1. Initializing admin...');
    const initResponse = await fetch(`${API_BASE_URL}/admin/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const initData = await initResponse.json();
    console.log('Admin init response:', initData.message);
    
    // Login as admin
    console.log('\n2. Logging in as admin...');
    const loginResponse = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminId: 'admin',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('Admin login failed: ' + loginData.message);
    }
    
    const token = loginData.data.accessToken;
    console.log('Login successful!');
    
    // Test dashboard endpoint
    console.log('\n3. Testing dashboard endpoint...');
    const dashboardResponse = await fetch(`${API_BASE_URL}/admin/dashboard?month=12&year=2024`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const dashboardData = await dashboardResponse.json();
    
    if (dashboardData.success) {
      console.log('✅ Dashboard API working!');
      console.log('\nDashboard Data:');
      console.log('- Total Users:', dashboardData.data.totalUsers);
      console.log('- Total Staff:', dashboardData.data.totalStaff);
      console.log('- Active Staff:', dashboardData.data.activeStaff);
      console.log('- Total Seekers:', dashboardData.data.totalSeekers);
      console.log('- Total Recruiters:', dashboardData.data.totalRecruiters);
      console.log('- Total Jobs:', dashboardData.data.totalJobs);
      console.log('- Total Institutes:', dashboardData.data.totalInstitutes);
      console.log('- Total Students:', dashboardData.data.totalStudents);
      console.log('- Total Courses:', dashboardData.data.totalCourses);
      console.log('- Total Hired:', dashboardData.data.totalHired);
    } else {
      console.log('❌ Dashboard API failed:', dashboardData.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDashboardAPI();