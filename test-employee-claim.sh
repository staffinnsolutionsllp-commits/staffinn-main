#!/bin/bash
cd /home/ec2-user/Backend

# Simulate employee token — no recruiterId, has companyId
EMP_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
require('dotenv').config();
// Employee from staffinn-hrms-employee-users — no recruiterId in token
const token = jwt.sign(
  { userId: 'arpita-user-id', companyId: 'COMP-2170E167', role: 'employee' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);
console.log(token);
" 2>/dev/null)

echo "=== GET /employee/v2/claim-types (employee token with companyId) ==="
curl -s http://localhost:4001/api/v1/employee/v2/claim-types \
  -H "Authorization: Bearer $EMP_TOKEN"
echo ""

echo ""
echo "=== Check resolveRecruiterId path for companyId ==="
node -e "
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);
async function main() {
  const r = await docClient.send(new ScanCommand({
    TableName: 'staffinn-hrms-users',
    FilterExpression: 'companyId = :cid',
    ExpressionAttributeValues: { ':cid': 'COMP-2170E167' }
  }));
  console.log('HRMS users with COMP-2170E167:', r.Count);
  (r.Items||[]).forEach(u => console.log(' userId:', u.userId, '| recruiterId:', u.recruiterId, '| companyId:', u.companyId));
}
main().catch(e => console.log('ERR:', e.message));
" 2>&1 | grep -v Warning | grep -v 'no longer' | grep -v upgrade | grep -v 'a.co' | grep -v trace | grep -v SDK
