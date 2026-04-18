/**
 * Create Test Registration Request
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

async function createTestRequest() {
  try {
    console.log('📝 Creating test registration request...');
    
    const requestId = uuidv4();
    const requestData = {
      requestId: requestId,
      type: 'recruiter',
      name: 'Test Recruiter Company',
      email: 'test.recruiter@example.com',
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
    
    console.log('✅ Test registration request created successfully!');
    console.log('📋 Request Details:');
    console.log(`   Request ID: ${requestId}`);
    console.log(`   Type: ${requestData.type}`);
    console.log(`   Name: ${requestData.name}`);
    console.log(`   Email: ${requestData.email}`);
    console.log(`   Status: ${requestData.status}`);
    
    console.log('\n🔗 You can now test the approval with this request ID in the admin panel');
    
  } catch (error) {
    console.error('❌ Error creating test request:', error);
  }
}

createTestRequest();