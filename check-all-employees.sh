#!/bin/bash
cd /home/ec2-user/Backend
node -e "
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);
async function main() {
  const r = await docClient.send(new ScanCommand({ TableName: 'staffinn-hrms-employee-users', Limit: 20 }));
  console.log('All employee-users ('+r.Count+'):');
  (r.Items||[]).forEach(u => console.log(' email:', u.email, '| recruiterId:', u.recruiterId, '| fullName:', u.fullName||u.name));
}
main().catch(e => console.log('ERR:', e.message));
" 2>&1 | grep -v Warning | grep -v 'no longer' | grep -v upgrade | grep -v 'a.co' | grep -v trace | grep -v SDK | grep -v security | grep -v January
