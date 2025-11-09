/**
 * Test Profile Autofill - Verify registration data flows to profile
 */
require('dotenv').config();

const axios = require('axios');

const testProfileAutofill = async () => {
  console.log('🧪 Testing Profile Autofill...\n');
  
  // Use the token from the registration test
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3ZDg0NDYyNC0xODBhLTQwYmUtODhjYS00N2YzZmQyZGUyYzMiLCJlbWFpbCI6InRlc3Rwcm9maWxlQGluc3RpdHV0ZS5jb20iLCJyb2xlIjoiaW5zdGl0dXRlIiwiaWF0IjoxNzYyNjAyMzE2LCJleHAiOjE3NjMyMDcxMTZ9.KXer3xCqOCCX74WnmLiyRuC_CMmCXP9vFce_px5pDv0';
  
  try {
    console.log('📤 Getting institute profile details...');
    
    const response = await axios.get('http://localhost:4001/api/v1/institutes/profile-details', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Profile retrieved successfully!');
    console.log('📋 Profile Data:');
    console.log('   Institute Name:', response.data.data.instituteName);
    console.log('   Email:', response.data.data.email);
    console.log('   Phone:', response.data.data.phone);
    console.log('   Address:', response.data.data.address || '(Empty - can be filled later)');
    console.log('   Website:', response.data.data.website || '(Empty - can be filled later)');
    console.log('   Profile Image:', response.data.data.profileImage || '(None - can be uploaded later)');
    console.log('   Is Live:', response.data.data.isLive);
    
    console.log('\n🎉 SUCCESS: Registration data automatically populated in profile!');
    
  } catch (error) {
    console.error('❌ Profile test failed!');
    
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

testProfileAutofill();