#!/bin/bash
cd /home/ec2-user/Backend
node -e "
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);
async function main() {
  // Check Jasraj's employee record
  const r = await docClient.send(new ScanCommand({
    TableName: 'staffinn-hrms-employee-users',
    FilterExpression: 'contains(#em, :name) OR contains(fullName, :name2)',
    ExpressionAttributeNames: { '#em': 'email' },
    ExpressionAttributeValues: { ':name': 'jasraj', ':name2': 'jasraj' },
    Limit: 5
  }));
  console.log('Jasraj employee records:');
  (r.Items||[]).forEach(u => console.log(' email:', u.email, '| recruiterId:', u.recruiterId, '| userId:', u.userId));
  
  // Also check what recruiterId the claim types belong to
  const ct = await docClient.send(new ScanCommand({ TableName: 'hrms-claim-types', Limit: 5 }));
  console.log('Claim types recruiterId values:');
  (ct.Items||[]).forEach(t => console.log(' name:', t.name, '| recruiterId:', t.recruiterId));
}
main().catch(e => console.log('ERR:', e.message));
" 2>&1 | grep -v Warning | grep -v 'no longer' | grep -v upgrade | grep -v 'a.co' | grep -v trace | grep -v SDK | grep -v security | grep -v January
