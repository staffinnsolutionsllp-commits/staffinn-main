#!/bin/bash
cd /home/ec2-user/Backend

# Find Jasraj's actual userId from employee-users table
JASRAJ_USERID=$(node -e "
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);
docClient.send(new ScanCommand({
  TableName: 'staffinn-hrms-employee-users',
  FilterExpression: 'email = :e',
  ExpressionAttributeValues: { ':e': 'jah@gmail.com' }
})).then(r => {
  if (r.Items && r.Items.length > 0) console.log(r.Items[0].userId);
  else console.log('NOT_FOUND');
}).catch(e => console.log('ERR'));
" 2>/dev/null)

echo "Jasraj userId: $JASRAJ_USERID"

# Check staffinn-hrms-employees for jah@gmail.com
node -e "
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);
docClient.send(new ScanCommand({
  TableName: 'staffinn-hrms-employees',
  FilterExpression: 'email = :e OR officialEmail = :e',
  ExpressionAttributeValues: { ':e': 'jah@gmail.com' }
})).then(r => {
  console.log('In staffinn-hrms-employees:', r.Count);
  r.Items?.forEach(e => console.log(' recruiterId:', e.recruiterId, '| email:', e.email, '| officialEmail:', e.officialEmail, '| employeeId:', e.employeeId));
}).catch(e => console.log('ERR:', e.message));
" 2>&1 | grep -v Warning | grep -v 'no longer' | grep -v upgrade | grep -v 'a.co' | grep -v trace | grep -v SDK

if [ "$JASRAJ_USERID" != "NOT_FOUND" ] && [ "$JASRAJ_USERID" != "" ]; then
  TOKEN=$(node -e "
  const jwt = require('jsonwebtoken');
  require('dotenv').config();
  console.log(jwt.sign({ userId: '$JASRAJ_USERID', role: 'employee' }, process.env.JWT_SECRET, { expiresIn: '1h' }));
  " 2>/dev/null)
  
  echo ""
  echo "=== GET /employee/v2/claim-types for Jasraj ==="
  curl -s http://localhost:4001/api/v1/employee/v2/claim-types \
    -H "Authorization: Bearer $TOKEN"
  echo ""
fi
