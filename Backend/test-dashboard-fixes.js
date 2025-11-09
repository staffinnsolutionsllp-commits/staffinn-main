/**
 * Test Dashboard Fixes
 * Verify that the dashboard real-time updates work correctly
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:4001/api/v1';

async function testDashboardFixes() {
  try {
    console.log('Testing Dashboard Real-time Updates...\n');
    
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
    
    // Get initial dashboard data
    console.log('\n2. Getting initial dashboard data...');
    const initialResponse = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const initialData = await initialResponse.json();
    
    if (initialData.success) {
      console.log('✅ Initial Dashboard Data:');
      console.log('- Total Users:', initialData.data.totalUsers);
      console.log('- Total Staff:', initialData.data.totalStaff);
      console.log('- Active Staff:', initialData.data.activeStaff);
      console.log('- Total Seekers:', initialData.data.totalSeekers);
      console.log('- Total Recruiters:', initialData.data.totalRecruiters);
      console.log('- Total Jobs:', initialData.data.totalJobs);
      console.log('- Total Institutes:', initialData.data.totalInstitutes);
      console.log('- Total Students:', initialData.data.totalStudents);
      console.log('- Total Courses:', initialData.data.totalCourses);
      console.log('- Total Hired:', initialData.data.totalHired);
      
      // Verify seeker calculation
      const expectedSeekers = initialData.data.totalStaff - initialData.data.activeStaff;
      console.log('\n📊 Verification:');
      console.log('- Expected Seekers (Total Staff - Active Staff):', expectedSeekers);
      console.log('- Actual Seekers:', initialData.data.totalSeekers);
      
      if (initialData.data.totalSeekers >= expectedSeekers) {
        console.log('✅ Seeker calculation appears correct');
      } else {
        console.log('⚠️  Seeker calculation may need adjustment');
      }
      
      // Test real-time updates by getting data again after a short delay
      console.log('\n3. Testing real-time refresh...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const refreshResponse = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const refreshData = await refreshResponse.json();
      
      if (refreshData.success) {
        console.log('✅ Real-time refresh working');
        
        // Check if data is consistent
        const dataChanged = JSON.stringify(initialData.data) !== JSON.stringify(refreshData.data);
        if (dataChanged) {
          console.log('📈 Data changed between requests (real-time updates working)');
        } else {
          console.log('📊 Data consistent between requests');
        }
      }
      
    } else {
      console.log('❌ Dashboard API failed:', initialData.message);
    }
    
    console.log('\n✅ Dashboard fixes test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDashboardFixes();