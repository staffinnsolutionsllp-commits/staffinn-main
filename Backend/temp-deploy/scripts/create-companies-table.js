const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });

async function createCompaniesTable() {
  const params = {
    TableName: 'staffinn-hrms-companies',
    KeySchema: [
      { AttributeName: 'companyId', KeyType: 'HASH' } // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'companyId', AttributeType: 'S' },
      { AttributeName: 'recruiterId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'recruiterId-index',
        KeySchema: [
          { AttributeName: 'recruiterId', KeyType: 'HASH' }
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
    }
  };

  try {
    console.log('Creating staffinn-hrms-companies table...');
    const command = new CreateTableCommand(params);
    const result = await client.send(command);
    console.log('✅ Table created successfully:', result.TableDescription.TableName);
    console.log('⏳ Waiting for table to become active...');
    
    // Wait for table to be active
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('✅ Table is ready!');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️ Table already exists');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
}

createCompaniesTable()
  .then(() => {
    console.log('\n✅ Companies table setup complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
