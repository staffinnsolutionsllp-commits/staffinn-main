/**
 * Create Missing DynamoDB Tables
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
    TableName: 'CourseModules',
    KeySchema: [
      { AttributeName: 'courseId', KeyType: 'HASH' },
      { AttributeName: 'moduleId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'courseId', AttributeType: 'S' },
      { AttributeName: 'moduleId', AttributeType: 'S' }
    ]
  },
  {
    TableName: 'CourseContent',
    KeySchema: [
      { AttributeName: 'moduleId', KeyType: 'HASH' },
      { AttributeName: 'contentId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'moduleId', AttributeType: 'S' },
      { AttributeName: 'contentId', AttributeType: 'S' }
    ]
  }
];

async function createTable(tableConfig) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableConfig.TableName }));
    console.log(`✅ Table ${tableConfig.TableName} already exists`);
    return;
  } catch (error) {
    if (error.name !== 'ResourceNotFoundException') {
      throw error;
    }
  }

  const params = {
    ...tableConfig,
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${tableConfig.TableName}`);
  } catch (error) {
    console.error(`❌ Failed to create table ${tableConfig.TableName}:`, error.message);
  }
}

async function createTables() {
  console.log('🔧 Creating missing DynamoDB tables...\n');
  
  for (const table of tables) {
    await createTable(table);
  }
  
  console.log('\n✨ Table creation complete');
}

createTables().catch(console.error);