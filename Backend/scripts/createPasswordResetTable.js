/**
 * Create Password Reset Tokens Table
 * Run this script to create the table for password reset functionality
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  CreateTableCommand, 
  DescribeTableCommand,
  UpdateTimeToLiveCommand
} = require('@aws-sdk/client-dynamodb');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

const TABLE_NAME = 'staffinn-password-reset-tokens';

async function createPasswordResetTable() {
  try {
    console.log('🔍 Checking if table exists...');
    
    // Check if table already exists
    try {
      const describeCommand = new DescribeTableCommand({
        TableName: TABLE_NAME
      });
      await dynamoClient.send(describeCommand);
      console.log('✅ Table already exists:', TABLE_NAME);
      
      // Enable TTL if not already enabled
      await enableTTL();
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
      console.log('📝 Table does not exist. Creating...');
    }
    
    // Create table
    const createCommand = new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        { AttributeName: 'resetId', KeyType: 'HASH' } // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: 'resetId', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'EmailIndex',
          KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      },
      Tags: [
        {
          Key: 'Environment',
          Value: process.env.NODE_ENV || 'development'
        },
        {
          Key: 'Purpose',
          Value: 'Password Reset Tokens'
        }
      ]
    });
    
    const response = await dynamoClient.send(createCommand);
    console.log('✅ Table created successfully:', TABLE_NAME);
    console.log('📊 Table ARN:', response.TableDescription.TableArn);
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to be active...');
    await waitForTableActive();
    
    // Enable TTL
    await enableTTL();
    
    console.log('🎉 Password reset table setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
    throw error;
  }
}

async function waitForTableActive() {
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      const describeCommand = new DescribeTableCommand({
        TableName: TABLE_NAME
      });
      const response = await dynamoClient.send(describeCommand);
      
      if (response.Table.TableStatus === 'ACTIVE') {
        console.log('✅ Table is now active');
        return;
      }
      
      console.log(`⏳ Table status: ${response.Table.TableStatus}. Waiting...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    } catch (error) {
      console.error('Error checking table status:', error);
      throw error;
    }
  }
  
  throw new Error('Table did not become active within expected time');
}

async function enableTTL() {
  try {
    console.log('🕐 Enabling TTL for automatic cleanup...');
    
    const ttlCommand = new UpdateTimeToLiveCommand({
      TableName: TABLE_NAME,
      TimeToLiveSpecification: {
        Enabled: true,
        AttributeName: 'ttl'
      }
    });
    
    await dynamoClient.send(ttlCommand);
    console.log('✅ TTL enabled successfully');
    console.log('ℹ️  Expired tokens will be automatically deleted after 24 hours');
  } catch (error) {
    if (error.name === 'ValidationException' && error.message.includes('TimeToLive is already enabled')) {
      console.log('✅ TTL already enabled');
    } else {
      console.error('⚠️  Error enabling TTL:', error.message);
    }
  }
}

// Run the script
if (require.main === module) {
  createPasswordResetTable()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createPasswordResetTable };
