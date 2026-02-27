/**
 * Create HRMS Companies Table
 * Stores company information, API keys, and registered devices
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });

const createCompaniesTable = async () => {
  const params = {
    TableName: 'staffinn-hrms-companies',
    KeySchema: [
      { AttributeName: 'companyId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'companyId', AttributeType: 'S' },
      { AttributeName: 'adminEmail', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'adminEmail-index',
        KeySchema: [
          { AttributeName: 'adminEmail', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
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
    const command = new CreateTableCommand(params);
    await client.send(command);
    console.log('✅ Table created: staffinn-hrms-companies');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️  Table already exists: staffinn-hrms-companies');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
};

// Run if executed directly
if (require.main === module) {
  createCompaniesTable()
    .then(() => {
      console.log('✅ Companies table setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createCompaniesTable };
