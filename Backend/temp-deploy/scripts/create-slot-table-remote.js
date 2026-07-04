require('dotenv').config();
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const TABLE = 'campus-slot-bookings';

async function run() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE }));
    console.log('Table already exists: ' + TABLE);
  } catch (e) {
    if (e.name !== 'ResourceNotFoundException') throw e;
    await client.send(new CreateTableCommand({
      TableName: TABLE,
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [{ AttributeName: 'bookingId', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'bookingId',   AttributeType: 'S' },
        { AttributeName: 'instituteId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [{
        IndexName: 'InstituteIdIndex',
        KeySchema: [{ AttributeName: 'instituteId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' }
      }]
    }));
    console.log('Created table: ' + TABLE);
  }
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
