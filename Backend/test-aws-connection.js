/**
 * Test AWS Connection - Run this before starting server
 */
require('dotenv').config();

const { DynamoDBClient, ListTablesCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

const testConnection = async () => {
  console.log('🔍 Testing AWS DynamoDB Connection...\n');
  
  try {
    const client = new DynamoDBClient(awsConfig);
    
    // Test 1: List tables
    console.log('📋 Step 1: Listing tables...');
    const listCommand = new ListTablesCommand({});
    const listResponse = await client.send(listCommand);
    
    console.log(`✅ Found ${listResponse.TableNames.length} tables:`);
    listResponse.TableNames.forEach(table => console.log(`   - ${table}`));
    
    // Test 2: Check users table
    const usersTable = process.env.DYNAMODB_USERS_TABLE || 'staffinn-users';
    if (listResponse.TableNames.includes(usersTable)) {
      console.log(`\n👥 Step 2: Checking ${usersTable} table...`);
      
      const scanCommand = new ScanCommand({
        TableName: usersTable,
        Limit: 5
      });
      
      const scanResponse = await client.send(scanCommand);
      const users = scanResponse.Items ? scanResponse.Items.map(item => unmarshall(item)) : [];
      
      console.log(`✅ Users table accessible - Found ${users.length} users (showing first 5)`);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - ${user.name || 'No name'}`);
      });
    } else {
      console.log(`⚠️  Users table '${usersTable}' not found`);
    }
    
    console.log('\n🎉 AWS Connection Test PASSED!');
    console.log('✅ You can now start your server safely');
    
  } catch (error) {
    console.error('\n❌ AWS Connection Test FAILED!');
    console.error('Error:', error.message);
    console.error('\n🔧 Possible fixes:');
    console.error('1. Check your AWS credentials in .env file');
    console.error('2. Verify AWS region is correct');
    console.error('3. Ensure your AWS account has DynamoDB permissions');
    console.error('4. Check if tables exist in AWS console');
    
    process.exit(1);
  }
};

testConnection();