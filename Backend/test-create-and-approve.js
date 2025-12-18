/**
 * Test Create and Approve Registration Request
 * Complete flow test
 */

const registrationRequestController = require('./controllers/registrationRequestController');

// Mock request and response objects for creation
const mockCreateReq = {
  body: {
    type: 'institute',
    name: 'Test Institute',
    email: 'test@institute.com',
    phoneNumber: '1234567890'
  }
};

let createdRequestId = null;

const mockCreateRes = {
  status: (code) => ({
    json: (data) => {
      console.log(`Create Response Status: ${code}`);
      console.log('Create Response Data:', JSON.stringify(data, null, 2));
      if (data.success && data.data && data.data.requestId) {
        createdRequestId = data.data.requestId;
        console.log('✅ Created request ID:', createdRequestId);
      }
      return mockCreateRes;
    }
  }),
  json: (data) => {
    console.log('Create Response Data:', JSON.stringify(data, null, 2));
    if (data.success && data.data && data.data.requestId) {
      createdRequestId = data.data.requestId;
      console.log('✅ Created request ID:', createdRequestId);
    }
    return mockCreateRes;
  }
};

const mockApproveRes = {
  status: (code) => ({
    json: (data) => {
      console.log(`Approve Response Status: ${code}`);
      console.log('Approve Response Data:', JSON.stringify(data, null, 2));
      return mockApproveRes;
    }
  }),
  json: (data) => {
    console.log('Approve Response Data:', JSON.stringify(data, null, 2));
    return mockApproveRes;
  }
};

async function testCompleteFlow() {
  console.log('🧪 Testing complete registration flow...');
  
  try {
    // Step 1: Create registration request
    console.log('\n📝 Step 1: Creating registration request...');
    await registrationRequestController.createRegistrationRequest(mockCreateReq, mockCreateRes);
    
    if (!createdRequestId) {
      console.error('❌ Failed to create registration request');
      return;
    }
    
    // Step 2: Approve the request
    console.log('\n✅ Step 2: Approving registration request...');
    const mockApproveReq = {
      params: {
        requestId: createdRequestId
      }
    };
    
    await registrationRequestController.approveRequest(mockApproveReq, mockApproveRes);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteFlow();