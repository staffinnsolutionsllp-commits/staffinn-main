require('dotenv').config();
const { DynamoDBClient, ListTablesCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

// Initialize DynamoDB client
const client = new DynamoDBClient(awsConfig);

// Table name
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'staffinn-users';

async function testDynamoDB() {
  try {
    console.log('Testing DynamoDB connection...');
    console.log('AWS Region:', process.env.AWS_REGION);
    console.log('Table Name:', USERS_TABLE);
    
    // List tables
    const listCommand = new ListTablesCommand({});
    const listResponse = await client.send(listCommand);
    console.log('Available tables:', listResponse.TableNames);
    
    // Check if our table exists
    if (!listResponse.TableNames.includes(USERS_TABLE)) {
      console.error(`Table ${USERS_TABLE} does not exist!`);
      return;
    }
    
    // Scan the table to see existing users
    const scanCommand = new ScanCommand({
      TableName: USERS_TABLE,
      Limit: 10
    });
    
    const scanResponse = await client.send(scanCommand);
    const users = scanResponse.Items ? scanResponse.Items.map(item => unmarshall(item)) : [];
    
    console.log('Users in table:', users);
    console.log('Total users:', users.length);
    
  } catch (error) {
    console.error('Error testing DynamoDB:', error);
  }
}

testDynamoDB();