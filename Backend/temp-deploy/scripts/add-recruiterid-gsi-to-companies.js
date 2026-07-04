/**
 * Add recruiterId GSI to existing staffinn-hrms-companies table
 * This allows efficient lookup of companies by recruiterId
 */

const { DynamoDBClient, UpdateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const TABLE_NAME = 'staffinn-hrms-companies';

const addRecruiterIdGSI = async () => {
  try {
    console.log('🔄 Adding recruiterId GSI to companies table...\n');

    // Check if GSI already exists
    const describeCommand = new DescribeTableCommand({ TableName: TABLE_NAME });
    const tableDescription = await client.send(describeCommand);
    
    const existingGSI = tableDescription.Table.GlobalSecondaryIndexes?.find(
      gsi => gsi.IndexName === 'recruiterId-index'
    );

    if (existingGSI) {
      console.log('ℹ️  recruiterId-index already exists. Skipping...');
      return;
    }

    // Check table billing mode
    const billingMode = tableDescription.Table.BillingModeSummary?.BillingMode;
    console.log(`ℹ️  Table billing mode: ${billingMode || 'PROVISIONED'}`);

    // Add GSI
    const gsiConfig = {
      IndexName: 'recruiterId-index',
      KeySchema: [
        { AttributeName: 'recruiterId', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' }
    };

    // Only add ProvisionedThroughput if table is in PROVISIONED mode
    if (billingMode !== 'PAY_PER_REQUEST') {
      gsiConfig.ProvisionedThroughput = {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      };
    }

    const updateCommand = new UpdateTableCommand({
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        { AttributeName: 'recruiterId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexUpdates: [
        {
          Create: gsiConfig
        }
      ]
    });

    await client.send(updateCommand);
    console.log('✅ recruiterId-index GSI added successfully!');
    console.log('⏳ Index is being created. This may take a few minutes...');
    console.log('💡 You can check status in AWS Console → DynamoDB → Tables → Indexes');

  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('⚠️  Table is being updated. Please wait and try again.');
    } else if (error.name === 'LimitExceededException') {
      console.log('⚠️  GSI limit reached. You may need to remove an unused index first.');
    } else {
      console.error('❌ Error adding GSI:', error);
      throw error;
    }
  }
};

// Run if executed directly
if (require.main === module) {
  addRecruiterIdGSI()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addRecruiterIdGSI };
