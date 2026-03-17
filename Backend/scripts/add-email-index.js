const { DynamoDBClient, UpdateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });

async function addEmailIndex() {
  try {
    console.log('Checking if email-index already exists...');
    
    const describeCommand = new DescribeTableCommand({
      TableName: 'staffinn-hrms-employee-users'
    });
    
    const tableInfo = await client.send(describeCommand);
    const existingIndexes = tableInfo.Table.GlobalSecondaryIndexes || [];
    
    const emailIndexExists = existingIndexes.some(index => index.IndexName === 'email-index');
    
    if (emailIndexExists) {
      console.log('✅ email-index already exists');
      return;
    }
    
    console.log('Creating email-index...');
    
    const updateCommand = new UpdateTableCommand({
      TableName: 'staffinn-hrms-employee-users',
      AttributeDefinitions: [
        { AttributeName: 'email', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: 'email-index',
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
        }
      ]
    });
    
    await client.send(updateCommand);
    console.log('✅ email-index created successfully');
    console.log('⏳ Index is being created... This may take a few minutes.');
    
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.error('❌ Table staffinn-hrms-employee-users does not exist');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

addEmailIndex();
