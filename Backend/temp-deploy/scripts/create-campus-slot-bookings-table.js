/**
 * Create campus-slot-bookings DynamoDB table
 * Run: node Backend/scripts/create-campus-slot-bookings-table.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const TABLE_NAME = 'campus-slot-bookings';

async function run() {
  // Check if already exists
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`✅ Table already exists: ${TABLE_NAME}`);
    return;
  } catch (e) {
    if (e.name !== 'ResourceNotFoundException') throw e;
  }

  await client.send(new CreateTableCommand({
    TableName: TABLE_NAME,
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [
      { AttributeName: 'bookingId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'bookingId',   AttributeType: 'S' },
      { AttributeName: 'instituteId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'InstituteIdIndex',
        KeySchema: [{ AttributeName: 'instituteId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' }
      }
    ]
  }));

  console.log(`✅ Created table: ${TABLE_NAME}`);
}

run().catch(console.error);
