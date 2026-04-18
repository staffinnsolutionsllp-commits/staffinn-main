/**
 * Check Registration Requests in Database
 */

require('dotenv').config();

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function checkRegistrationRequests() {
  try {
    console.log('🔍 Checking registration requests in database...');
    
    const command = new ScanCommand({
      TableName: 'staffinn-registration-requests'
    });
    
    const response = await docClient.send(command);
    
    console.log('📊 Total requests found:', response.Items.length);
    
    if (response.Items.length > 0) {
      console.log('\n📋 Registration Requests:');
      response.Items.forEach((item, index) => {
        console.log(`\n${index + 1}. Request ID: ${item.requestId}`);
        console.log(`   Type: ${item.type}`);
        console.log(`   Name: ${item.name}`);
        console.log(`   Email: ${item.email}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Created: ${item.createdAt}`);
      });
    } else {
      console.log('\n📝 No registration requests found in database');
      console.log('💡 You need to create some registration requests first');
    }
    
  } catch (error) {
    console.error('❌ Error checking registration requests:', error);
  }
}

checkRegistrationRequests();