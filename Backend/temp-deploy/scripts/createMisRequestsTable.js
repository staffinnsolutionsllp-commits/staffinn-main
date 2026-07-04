/**
 * Create MIS Requests Table
 * Creates the DynamoDB table for MIS requests from Staffinn Partner institutes
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const TABLE_NAME = 'staffinn-mis-requests';

async function createMisRequestsTable() {
  try {
    // Check if table already exists
    try {
      const describeCommand = new DescribeTableCommand({ TableName: TABLE_NAME });
      await dynamoClient.send(describeCommand);
      console.log(`✅ Table ${TABLE_NAME} already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Create table
    const createTableCommand = new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        {
          AttributeName: 'requestId',
          KeyType: 'HASH' // Partition key
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'requestId',
          AttributeType: 'S'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    });

    console.log(`🔄 Creating table ${TABLE_NAME}...`);
    await dynamoClient.send(createTableCommand);
    console.log(`✅ Table ${TABLE_NAME} created successfully`);

  } catch (error) {
    console.error(`❌ Error creating table ${TABLE_NAME}:`, error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createMisRequestsTable()
    .then(() => {
      console.log('✅ MIS Requests table creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ MIS Requests table creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createMisRequestsTable };