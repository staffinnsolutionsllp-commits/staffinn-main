/**
 * Update HRMS Companies Table - Add adminEmail GSI if not exists
 */

const { DynamoDBClient, DescribeTableCommand, UpdateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const TABLE_NAME = 'staffinn-hrms-companies';

const updateTableGSI = async () => {
  try {
    // Check if table exists and get current GSIs
    const describeCommand = new DescribeTableCommand({ TableName: TABLE_NAME });
    const tableInfo = await client.send(describeCommand);
    
    const existingGSIs = tableInfo.Table.GlobalSecondaryIndexes || [];
    const hasAdminEmailIndex = existingGSIs.some(gsi => gsi.IndexName === 'adminEmail-index');
    
    if (hasAdminEmailIndex) {
      console.log('✅ adminEmail-index already exists');
      return;
    }
    
    console.log('📝 Adding adminEmail-index GSI...');
    
    // Add GSI
    const updateCommand = new UpdateTableCommand({
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        { AttributeName: 'adminEmail', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
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
        }
      ]
    });
    
    await client.send(updateCommand);
    console.log('✅ GSI added successfully. Wait for it to become ACTIVE.');
    
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('❌ Table does not exist. Run create-hrms-companies-table.js first');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
};

updateTableGSI()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
