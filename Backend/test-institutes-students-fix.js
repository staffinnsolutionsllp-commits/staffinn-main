/**
 * Test Institutes and Students Fix
 * Verify that the dashboard correctly counts institutes and students
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:4001/api/v1';

async function testInstitutesStudentsFix() {
  try {
    console.log('🧪 Testing Institutes and Students Count Fix...\n');
    
    // Login as admin
    console.log('1. Logging in as admin...');
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
    console.log('✅ Login successful!');
    
    // Test dashboard endpoint (real-time data)
    console.log('\n2. Testing dashboard endpoint (real-time)...');
    const dashboardResponse = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const dashboardData = await dashboardResponse.json();
    
    if (dashboardData.success) {
      console.log('✅ Dashboard API working!');
      console.log('\n📊 Real-time Dashboard Data:');
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
      
      // Check if institutes and students are showing correct counts
      console.log('\n🔍 Analysis:');
      if (dashboardData.data.totalInstitutes > 0) {
        console.log('✅ Institutes count is working:', dashboardData.data.totalInstitutes);
      } else {
        console.log('⚠️  Institutes count is 0 - may need data or table check');
      }
      
      if (dashboardData.data.totalStudents > 0) {
        console.log('✅ Students count is working:', dashboardData.data.totalStudents);
      } else {
        console.log('⚠️  Students count is 0 - may need data or table check');
      }
      
    } else {
      console.log('❌ Dashboard API failed:', dashboardData.message);
    }
    
    // Test with historical data (month/year filter)
    console.log('\n3. Testing dashboard with historical filter...');
    const historicalResponse = await fetch(`${API_BASE_URL}/admin/dashboard?month=12&year=2024`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const historicalData = await historicalResponse.json();
    
    if (historicalData.success) {
      console.log('✅ Historical dashboard working!');
      console.log('📅 December 2024 Data:');
      console.log('- Total Institutes:', historicalData.data.totalInstitutes);
      console.log('- Total Students:', historicalData.data.totalStudents);
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testInstitutesStudentsFix();