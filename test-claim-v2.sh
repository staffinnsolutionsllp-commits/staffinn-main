#!/bin/bash
echo "=== Testing claim-types POST ==="
curl -s -X POST http://localhost:4001/api/v1/hrms/v2/claim-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -d '{"name":"Travel","description":"test","approvalLimit":5000}' 2>&1
echo ""
echo ""
echo "=== Checking if tables exist ==="
cd /home/ec2-user/Backend
node -e "
const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
client.send(new ListTablesCommand({})).then(r => {
  const claimTables = (r.TableNames || []).filter(t => t.includes('claim') || t.includes('Claim'));
  console.log('Claim-related tables:', JSON.stringify(claimTables));
  console.log('All HRMS tables:', JSON.stringify((r.TableNames||[]).filter(t => t.includes('hrms') || t.includes('HRMS'))));
}).catch(e => console.log('Error:', e.message));
" 2>&1 | grep -v Warning | grep -v 'no longer' | grep -v upgrade | grep -v 'a.co' | grep -v trace | grep -v SDK | grep -v security
