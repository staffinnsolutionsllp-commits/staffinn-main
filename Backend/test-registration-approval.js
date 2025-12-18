/**
 * Test Registration Approval Flow
 * Direct test of the approval functionality
 */

const registrationRequestController = require('./controllers/registrationRequestController');

// Mock request and response objects
const mockReq = {
  params: {
    requestId: '0b662342-9255-4c6a-9611-8e7246d2eb7d'
  }
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

async function testApproval() {
  console.log('🧪 Testing registration approval...');
  console.log('Request ID:', mockReq.params.requestId);
  
  try {
    await registrationRequestController.approveRequest(mockReq, mockRes);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testApproval();