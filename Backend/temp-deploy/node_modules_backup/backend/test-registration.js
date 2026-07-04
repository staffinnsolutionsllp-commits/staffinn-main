/**
 * Test Registration Endpoint
 */
require('dotenv').config();

const axios = require('axios');

const testInstituteRegistration = async () => {
  console.log('🧪 Testing Institute Registration with Profile...\n');
  
  const testData = {
    instituteName: "Test Institute Profile",
    email: "testprofile@institute.com",
    password: "password123",
    phoneNumber: "9876543210",
    role: "institute"
  };
  
  try {
    console.log('📤 Sending registration request...');
    console.log('Data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post('http://localhost:4001/api/v1/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Registration failed!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
};

// Test API health first
const testHealth = async () => {
  try {
    console.log('🏥 Testing API health...');
    const response = await axios.get('http://localhost:4001/api/v1/auth/health');
    console.log('✅ API is healthy:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ API health check failed:', error.message);
    return false;
  }
};

const runTests = async () => {
  const isHealthy = await testHealth();
  if (isHealthy) {
    await testInstituteRegistration();
  } else {
    console.log('❌ Cannot test registration - API is not responding');
  }
};

runTests();