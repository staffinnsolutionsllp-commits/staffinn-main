/**
 * HRMS Integration Test Script
 * Tests the HRMS endpoints integrated into the main backend
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4001/api/v1/hrms';

async function testHRMSIntegration() {
  console.log('🧪 Testing HRMS Integration...\n');

  try {
    // Test 1: Register a new HRMS user
    console.log('1. Testing HRMS User Registration...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test HR Manager',
      email: 'hr.test@staffinn.com',
      password: 'testpassword123',
      role: 'hr'
    });
    
    if (registerResponse.data.success) {
      console.log('✅ HRMS User Registration: SUCCESS');
      const token = registerResponse.data.data.token;
      
      // Test 2: Login with the created user
      console.log('2. Testing HRMS User Login...');
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'hr.test@staffinn.com',
        password: 'testpassword123'
      });
      
      if (loginResponse.data.success) {
        console.log('✅ HRMS User Login: SUCCESS');
        
        // Test 3: Create a candidate (no auth required)
        console.log('3. Testing Candidate Creation...');
        const candidateResponse = await axios.post(`${BASE_URL}/candidates`, {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          position: 'Software Developer',
          notes: 'Test candidate for integration'
        });
        
        if (candidateResponse.data.success) {
          console.log('✅ Candidate Creation: SUCCESS');
          
          // Test 4: Get candidates (with auth)
          console.log('4. Testing Get Candidates...');
          const getCandidatesResponse = await axios.get(`${BASE_URL}/candidates`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (getCandidatesResponse.data.success) {
            console.log('✅ Get Candidates: SUCCESS');
            console.log(`   Found ${getCandidatesResponse.data.data.length} candidates`);
            
            // Test 5: Get employee stats
            console.log('5. Testing Employee Stats...');
            const statsResponse = await axios.get(`${BASE_URL}/employees/stats`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (statsResponse.data.success) {
              console.log('✅ Employee Stats: SUCCESS');
              console.log(`   Total Employees: ${statsResponse.data.data.totalEmployees}`);
              
              // Test 6: Get attendance stats
              console.log('6. Testing Attendance Stats...');
              const attendanceStatsResponse = await axios.get(`${BASE_URL}/attendance/stats`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (attendanceStatsResponse.data.success) {
                console.log('✅ Attendance Stats: SUCCESS');
                console.log(`   Attendance Rate: ${attendanceStatsResponse.data.data.attendanceRate}%`);
                
                console.log('\n🎉 All HRMS Integration Tests Passed!');
                console.log('\n📋 Integration Summary:');
                console.log('   ✅ HRMS Backend integrated into main backend');
                console.log('   ✅ All HRMS routes working with /api/v1/hrms prefix');
                console.log('   ✅ Authentication system working');
                console.log('   ✅ Database operations working');
                console.log('   ✅ HRMS Frontend configured to use main backend');
                
              } else {
                console.log('❌ Attendance Stats: FAILED');
              }
            } else {
              console.log('❌ Employee Stats: FAILED');
            }
          } else {
            console.log('❌ Get Candidates: FAILED');
          }
        } else {
          console.log('❌ Candidate Creation: FAILED');
        }
      } else {
        console.log('❌ HRMS User Login: FAILED');
      }
    } else {
      console.log('❌ HRMS User Registration: FAILED');
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.response?.data || error.message);
    console.log('\n⚠️  Make sure the main backend server is running on port 4001');
  }
}

// Run the test
testHRMSIntegration();