/**
 * Create Registration Request with otp.staffinn@gmail.com
 */

require('dotenv').config();

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function createOtpRequest() {
  try {
    console.log('📝 Creating registration request with otp.staffinn@gmail.com...');
    
    const requestId = uuidv4();
    const requestData = {
      requestId: requestId,
      type: 'institute',
      name: 'Test Institute OTP',
      email: 'otp.staffinn@gmail.com',
      phoneNumber: '9876543210',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const command = new PutCommand({
      TableName: 'staffinn-registration-requests',
      Item: requestData
    });
    
    await docClient.send(command);
    
    console.log('✅ Registration request created successfully!');
    console.log('📋 Request Details:');
    console.log(`   Request ID: ${requestId}`);
    console.log(`   Email: ${requestData.email}`);
    console.log(`   Type: ${requestData.type}`);
    console.log(`   Status: ${requestData.status}`);
    
    return requestId;
    
  } catch (error) {
    console.error('❌ Error creating request:', error);
  }
}

createOtpRequest();