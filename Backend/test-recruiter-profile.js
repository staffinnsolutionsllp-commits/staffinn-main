/**
 * Test Recruiter Profile Update
 */

require('dotenv').config();
const userModel = require('./models/userModel');
const jwtUtils = require('./utils/jwtUtils');

const testRecruiterProfile = async () => {
  try {
    console.log('🧪 Testing Recruiter Profile Update\n');
    
    // Find a recruiter user
    const allUsers = await require('./services/dynamoService').scanItems(process.env.DYNAMODB_USERS_TABLE);
    const recruiter = allUsers.find(u => u.role === 'recruiter');
    
    if (!recruiter) {
      console.log('❌ No recruiter found in database');
      return;
    }
    
    console.log('✅ Found recruiter:', recruiter.email, recruiter.userId);
    
    // Generate a test token
    const testToken = jwtUtils.generateTokens(recruiter);
    console.log('✅ Generated test token:', testToken.accessToken.substring(0, 50) + '...');
    
    // Test profile update data
    const testProfileData = {
      companyDescription: 'Updated company description for testing',
      industry: 'Technology',
      location: 'Mumbai, India',
      isLive: true
    };
    
    console.log('✅ Test profile data:', testProfileData);
    
    // Simulate API call
    const API_URL = 'http://localhost:4000/api/v1';
    const fetch = require('node-fetch');
    
    const response = await fetch(`${API_URL}/recruiter/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken.accessToken}`
      },
      body: JSON.stringify(testProfileData)
    });
    
    const result = await response.json();
    console.log('📊 API Response Status:', response.status);
    console.log('📊 API Response:', result);
    
    if (response.ok) {
      console.log('✅ Profile update successful!');
    } else {
      console.log('❌ Profile update failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testRecruiterProfile()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test script failed:', error);
    process.exit(1);
  });