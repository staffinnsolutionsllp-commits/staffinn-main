/**
 * Test Full Recruiter Functionality
 */

require('dotenv').config();
const userModel = require('./models/userModel');
const jwtUtils = require('./utils/jwtUtils');

const testFullRecruiterFlow = async () => {
  try {
    console.log('🧪 Testing Full Recruiter Flow\n');
    
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
    console.log('✅ Generated test token');
    
    const API_URL = 'http://localhost:4000/api/v1';
    const fetch = require('node-fetch');
    
    // Test 1: Get Profile
    console.log('\n📋 Test 1: Get Profile');
    const profileResponse = await fetch(`${API_URL}/recruiter/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken.accessToken}`
      }
    });
    
    const profileData = await profileResponse.json();
    console.log('Status:', profileResponse.status);
    console.log('Success:', profileData.success);
    
    // Test 2: Update Profile
    console.log('\n📝 Test 2: Update Profile');
    const updateData = {
      companyDescription: 'Test company description updated',
      industry: 'Technology',
      location: 'Mumbai, India',
      recruiterName: 'Test Recruiter',
      designation: 'HR Manager',
      experience: '5+ years',
      isLive: true
    };
    
    const updateResponse = await fetch(`${API_URL}/recruiter/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken.accessToken}`
      },
      body: JSON.stringify(updateData)
    });
    
    const updateResult = await updateResponse.json();
    console.log('Status:', updateResponse.status);
    console.log('Success:', updateResult.success);
    console.log('Message:', updateResult.message);
    
    if (updateResult.success) {
      console.log('✅ Profile update successful!');
    } else {
      console.log('❌ Profile update failed:', updateResult.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testFullRecruiterFlow()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test script failed:', error);
    process.exit(1);
  });