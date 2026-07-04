const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });

const createMessagesTable = async () => {
  const tableName = 'Messages';
  
  try {
    // Check if table already exists
    try {
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      await client.send(describeCommand);
      console.log(`✅ Table ${tableName} already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Create table
    const createCommand = new CreateTableCommand({
      TableName: tableName,
      KeySchema: [
        {
          AttributeName: 'messageId',
          KeyType: 'HASH' // Partition key
        },
        {
          AttributeName: 'createdAt',
          KeyType: 'RANGE' // Sort key
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'messageId',
          AttributeType: 'S'
        },
        {
          AttributeName: 'createdAt',
          AttributeType: 'S'
        },
        {
          AttributeName: 'senderId',
          AttributeType: 'S'
        },
        {
          AttributeName: 'receiverId',
          AttributeType: 'S'
        }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'SenderIndex',
          KeySchema: [
            {
              AttributeName: 'senderId',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'createdAt',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          BillingMode: 'PAY_PER_REQUEST'
        },
        {
          IndexName: 'ReceiverIndex',
          KeySchema: [
            {
              AttributeName: 'receiverId',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'createdAt',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          BillingMode: 'PAY_PER_REQUEST'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    });

    const result = await client.send(createCommand);
    console.log(`✅ Table ${tableName} created successfully`);
    console.log('Table ARN:', result.TableDescription.TableArn);
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to be active...');
    let tableStatus = 'CREATING';
    while (tableStatus !== 'ACTIVE') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      const description = await client.send(describeCommand);
      tableStatus = description.Table.TableStatus;
      console.log(`Table status: ${tableStatus}`);
    }
    
    console.log(`🎉 Table ${tableName} is now active and ready to use!`);
    
  } catch (error) {
    console.error(`❌ Error creating table ${tableName}:`, error);
    throw error;
  }
};

// Run the script if called directly
if (require.main === module) {
  createMessagesTable()
    .then(() => {
      console.log('✅ Messages table setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to setup Messages table:', error);
      process.exit(1);
    });
}

module.exports = { createMessagesTable };