/**
 * Test Get Registration Requests
 * Check what requests exist in the database
 */

const registrationRequestController = require('./controllers/registrationRequestController');

// Mock request and response objects
const mockReq = {
  params: {}
};

const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log(`Response Status: ${code}`);
      console.log('Response Data:', JSON.stringify(data, null, 2));
      return mockRes;
    }
  }),
  json: (data) => {
    console.log('Response Data:', JSON.stringify(data, null, 2));
    return mockRes;
  }
};

async function testGetRequests() {
  console.log('🧪 Testing get all registration requests...');
  
  try {
    await registrationRequestController.getAllRegistrationRequests(mockReq, mockRes);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testGetRequests();