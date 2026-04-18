/**
 * Test Direct Approval with Real Request
 */

require('dotenv').config();

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function testDirectApproval() {
  try {
    // First, get the latest pending request
    console.log('🔍 Finding pending registration requests...');
    
    const scanCommand = new ScanCommand({
      TableName: 'staffinn-registration-requests',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'pending'
      }
    });
    
    const scanResponse = await docClient.send(scanCommand);
    
    if (scanResponse.Items.length === 0) {
      console.log('❌ No pending requests found');
      return;
    }
    
    const request = scanResponse.Items[0];
    console.log('📋 Found pending request:', {
      requestId: request.requestId,
      email: request.email,
      name: request.name,
      type: request.type
    });
    
    // Now test the approval controller directly
    const registrationRequestController = require('./controllers/registrationRequestController');
    
    const mockReq = {
      params: {
        requestId: request.requestId
      }
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`✅ Response Status: ${code}`);
          console.log('📄 Response Data:', JSON.stringify(data, null, 2));
          return mockRes;
        }
      }),
      json: (data) => {
        console.log('📄 Response Data:', JSON.stringify(data, null, 2));
        return mockRes;
      }
    };
    
    console.log('\n🚀 Testing approval process...');
    await registrationRequestController.approveRequest(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDirectApproval();