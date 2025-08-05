/**
 * Script to create Institute-placement-section DynamoDB table
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const TABLE_NAME = 'Institute-placement-section';

async function createTable() {
  try {
    // Check if table already exists
    try {
      const describeCommand = new DescribeTableCommand({
        TableName: TABLE_NAME
      });
      await client.send(describeCommand);
      console.log(`Table ${TABLE_NAME} already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Create table
    const createCommand = new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        {
          AttributeName: 'instituteplacement',
          KeyType: 'HASH' // Partition key
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'instituteplacement',
          AttributeType: 'S'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    });

    const result = await client.send(createCommand);
    console.log(`Table ${TABLE_NAME} created successfully:`, result.TableDescription.TableStatus);
    
    // Wait for table to be active
    let tableStatus = 'CREATING';
    while (tableStatus === 'CREATING') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const describeCommand = new DescribeTableCommand({
        TableName: TABLE_NAME
      });
      const description = await client.send(describeCommand);
      tableStatus = description.Table.TableStatus;
      console.log(`Table status: ${tableStatus}`);
    }
    
    console.log(`Table ${TABLE_NAME} is now active and ready to use`);
  } catch (error) {
    console.error('Error creating table:', error);
  }
}

// Run the script
if (require.main === module) {
  createTable();
}

module.exports = createTable;