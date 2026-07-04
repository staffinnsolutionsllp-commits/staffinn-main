require('dotenv').config();
const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const c = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
c.send(new DescribeTableCommand({ TableName: 'Messages' }))
  .then(r => {
    const gsis = r.Table.GlobalSecondaryIndexes || [];
    console.log('GSIs found:', gsis.length);
    gsis.forEach(g => console.log(' -', g.IndexName, ':', g.IndexStatus));
    if (gsis.length === 0) console.log('NO GSIs — OPT-1 will fail, needs rollback');
  })
  .catch(e => console.error('ERROR:', e.message));
