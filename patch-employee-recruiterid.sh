#!/bin/bash
cd /home/ec2-user/Backend
node -e "
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function main() {
  // Get all hrms employees without recruiterId
  const empResult = await docClient.send(new ScanCommand({ TableName: 'staffinn-hrms-employee-users' }));
  const employees = (empResult.Items || []).filter(e => !e.recruiterId);
  console.log('Employees without recruiterId:', employees.length);

  // Get all hrms-employees table to find recruiterId mapping
  const hrmsEmpResult = await docClient.send(new ScanCommand({ TableName: 'staffinn-hrms-employees' }));
  const hrmsEmployees = hrmsEmpResult.Items || [];
  console.log('HRMS employees table count:', hrmsEmployees.length);
  
  // Show sample hrms employees to understand structure
  hrmsEmployees.slice(0,3).forEach(e => console.log(' email:', e.email||e.officialEmail, '| recruiterId:', e.recruiterId, '| employeeId:', e.employeeId));

  // Match by email and patch recruiterId
  let patched = 0;
  for (const emp of employees) {
    const match = hrmsEmployees.find(h => 
      (h.email && emp.email && h.email.toLowerCase() === emp.email.toLowerCase()) ||
      (h.officialEmail && emp.email && h.officialEmail.toLowerCase() === emp.email.toLowerCase()) ||
      (h.employeeId && emp.employeeId && h.employeeId === emp.employeeId)
    );
    if (match && match.recruiterId) {
      await docClient.send(new UpdateCommand({
        TableName: 'staffinn-hrms-employee-users',
        Key: { userId: emp.userId },
        UpdateExpression: 'SET recruiterId = :rid',
        ExpressionAttributeValues: { ':rid': match.recruiterId }
      }));
      console.log('Patched:', emp.email, '->', match.recruiterId);
      patched++;
    } else {
      console.log('No match for:', emp.email, '| employeeId:', emp.employeeId);
    }
  }
  console.log('Total patched:', patched);
}
main().catch(e => console.log('ERR:', e.message));
" 2>&1 | grep -v Warning | grep -v 'no longer' | grep -v upgrade | grep -v 'a.co' | grep -v trace | grep -v SDK | grep -v security | grep -v January | grep -v 'bug fixes'
