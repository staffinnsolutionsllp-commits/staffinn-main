/**
 * Test Approval Flow with Real Request
 */

const registrationRequestController = require('./controllers/registrationRequestController');

// Use the request ID we just created
const testRequestId = '81f30f56-7949-40e0-a15c-ad3ef2d38152';

const mockReq = {
  params: {
    requestId: testRequestId
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
  console.log('🧪 Testing registration approval with real request...');
  console.log('Request ID:', testRequestId);
  
  try {
    await registrationRequestController.approveRequest(mockReq, mockRes);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testApproval();