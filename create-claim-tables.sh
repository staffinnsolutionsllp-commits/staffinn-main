#!/bin/bash
cd /home/ec2-user/Backend
node -e "
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });

const tables = [
  {
    TableName: 'hrms-claim-types',
    KeySchema: [{ AttributeName: 'claimTypeId', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'claimTypeId', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'hrms-claims-v2',
    KeySchema: [{ AttributeName: 'claimId', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'claimId', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'hrms-claim-line-items',
    KeySchema: [
      { AttributeName: 'lineItemId', KeyType: 'HASH' },
      { AttributeName: 'claimId',    KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'lineItemId', AttributeType: 'S' },
      { AttributeName: 'claimId',    AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'hrms-claim-approvals',
    KeySchema: [{ AttributeName: 'approvalId', KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: 'approvalId', AttributeType: 'S' }],
    BillingMode: 'PAY_PER_REQUEST'
  }
];

async function createIfNotExists(tableDef) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableDef.TableName }));
    console.log('✅ Already exists:', tableDef.TableName);
  } catch (e) {
    if (e.name === 'ResourceNotFoundException') {
      try {
        await client.send(new CreateTableCommand(tableDef));
        console.log('🆕 Created:', tableDef.TableName);
      } catch (ce) {
        console.log('❌ Create error for', tableDef.TableName, ':', ce.message);
      }
    } else {
      console.log('❌ Describe error for', tableDef.TableName, ':', e.message);
    }
  }
}

(async () => {
  for (const t of tables) await createIfNotExists(t);
  console.log('Done.');
})();
" 2>&1 | grep -v Warning | grep -v 'no longer' | grep -v upgrade | grep -v 'a.co' | grep -v trace | grep -v SDK | grep -v security | grep -v January | grep -v 'bug fixes'
