#!/bin/bash
cd /home/ec2-user/Backend
node -e "
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);
async function main() {
  // Find Jasraj in ALL tables
  const tables = ['staffinn-hrms-employee-users','staffinn-hrms-users','staffinn-hrms-employees'];
  for (const t of tables) {
    try {
      const r = await docClient.send(new ScanCommand({
        TableName: t,
        FilterExpression: 'contains(email, :e)',
        ExpressionAttributeValues: { ':e': 'jasraj' }
      }));
      if (r.Count > 0) {
        console.log('FOUND in', t, ':');
        r.Items.forEach(u => console.log(' userId:', u.userId, '| email:', u.email, '| recruiterId:', u.recruiterId, '| companyId:', u.companyId));
      }
    } catch(e) { console.log(t, 'error:', e.message); }
  }
  
  // Also show all HRMS users and their companyIds
  console.log('\\n--- All staffinn-hrms-users ---');
  const r2 = await docClient.send(new ScanCommand({ TableName: 'staffinn-hrms-users', Limit: 10 }));
  r2.Items?.forEach(u => console.log(' email:', u.email, '| recruiterId:', u.recruiterId, '| companyId:', u.companyId, '| userId:', u.userId));
}
main().catch(e => console.log('ERR:', e.message));
" 2>&1 | grep -v Warning | grep -v 'no longer' | grep -v upgrade | grep -v 'a.co' | grep -v trace | grep -v SDK | grep -v security | grep -v January | grep -v 'bug fixes'
