/**
 * Test Environment Variables
 * Check if AWS credentials are properly loaded
 */

require('dotenv').config();

console.log('🔍 Environment Variables Check:');
console.log('================================');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);
console.log('STAFF_TABLE:', process.env.STAFF_TABLE);
console.log('DYNAMODB_USERS_TABLE:', process.env.DYNAMODB_USERS_TABLE);

// Test AWS SDK configuration
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

console.log('\n🔧 AWS SDK Client Configuration:');
console.log('Client created successfully:', !!client);

// Test a simple AWS operation
async function testAWSConnection() {
  try {
    const { ListTablesCommand } = require('@aws-sdk/client-dynamodb');
    const command = new ListTablesCommand({});
    const response = await client.send(command);
    console.log('✅ AWS Connection successful!');
    console.log('Available tables:', response.TableNames);
  } catch (error) {
    console.error('❌ AWS Connection failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode
    });
  }
}

testAWSConnection();