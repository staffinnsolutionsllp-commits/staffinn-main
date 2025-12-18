const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const awsConfig = require('../config/aws');

const dynamoClient = new DynamoDBClient(awsConfig);

const createMisPlacementAnalyticsTable = async () => {
  const params = {
    TableName: 'staffinn-mis-placement-analytics',
    KeySchema: [
      {
        AttributeName: 'placementId',
        KeyType: 'HASH'
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'placementId',
        AttributeType: 'S'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    const command = new CreateTableCommand(params);
    const result = await dynamoClient.send(command);
    console.log('✅ MIS Placement Analytics table created successfully:', result.TableDescription.TableName);
    return result;
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️  MIS Placement Analytics table already exists');
    } else {
      console.error('❌ Error creating MIS Placement Analytics table:', error);
      throw error;
    }
  }
};

// Run if called directly
if (require.main === module) {
  createMisPlacementAnalyticsTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createMisPlacementAnalyticsTable };