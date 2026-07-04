/**
 * Create Campus Drive DynamoDB Tables
 * Run: node create-campus-drive-tables.js
 */

require('dotenv').config();
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const tables = [
  {
    // Stores each institute's placement planner (selected dates, notes)
    TableName: 'campus-drive-planners',
    KeySchema: [
      { AttributeName: 'plannerId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'plannerId', AttributeType: 'S' },
      { AttributeName: 'instituteId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'InstituteIdIndex',
        KeySchema: [{ AttributeName: 'instituteId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' }
      }
    ]
  }
];

async function createTable(tableConfig) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableConfig.TableName }));
    console.log(`✅ Table already exists: ${tableConfig.TableName}`);
    return;
  } catch (error) {
    if (error.name !== 'ResourceNotFoundException') throw error;
  }

  try {
    await client.send(new CreateTableCommand({
      ...tableConfig,
      BillingMode: 'PAY_PER_REQUEST'
    }));
    console.log(`✅ Created table: ${tableConfig.TableName}`);
  } catch (error) {
    console.error(`❌ Failed to create ${tableConfig.TableName}:`, error.message);
  }
}

async function run() {
  console.log('🔧 Creating campus drive tables...\n');
  for (const table of tables) {
    await createTable(table);
  }
  console.log('\n✨ Done');
}

run().catch(console.error);
