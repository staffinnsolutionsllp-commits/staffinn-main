/**
 * Create Issues Table Script
 * Creates the staffinn-issue-section table in DynamoDB
 */

const { dynamoClient, isUsingMockDB, mockDB } = require('../config/dynamodb-wrapper');

const ISSUES_TABLE = process.env.DYNAMODB_ISSUES_TABLE || 'staffinn-issue-section';

const createIssuesTable = async () => {
  try {
    if (isUsingMockDB()) {
      console.log('Using mock DynamoDB - Issues table will be created automatically');
      return;
    }

    const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

    // Check if table already exists
    try {
      const describeCommand = new DescribeTableCommand({
        TableName: ISSUES_TABLE
      });
      await dynamoClient.send(describeCommand);
      console.log(`✅ Issues table '${ISSUES_TABLE}' already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
      // Table doesn't exist, create it
    }

    const createTableParams = {
      TableName: ISSUES_TABLE,
      KeySchema: [
        {
          AttributeName: 'issuesection',
          KeyType: 'HASH' // Partition key
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'issuesection',
          AttributeType: 'S'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    const createCommand = new CreateTableCommand(createTableParams);
    await dynamoClient.send(createCommand);

    console.log(`✅ Issues table '${ISSUES_TABLE}' created successfully`);

    // Wait for table to be active
    const { waitUntilTableExists } = require('@aws-sdk/client-dynamodb');
    await waitUntilTableExists(
      { client: dynamoClient, maxWaitTime: 60 },
      { TableName: ISSUES_TABLE }
    );

    console.log(`✅ Issues table '${ISSUES_TABLE}' is now active`);

  } catch (error) {
    console.error('❌ Error creating issues table:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createIssuesTable()
    .then(() => {
      console.log('Issues table creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Issues table creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createIssuesTable };