#!/bin/bash
cd /home/ec2-user/Backend

TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
require('dotenv').config();
const token = jwt.sign(
  { userId: 'e8f67d07-adc0-4a4e-a55a-d7f85db14f4e', recruiterId: 'aa8d18ff-e106-4416-a6d1-438dee067a2c', role: 'admin', companyId: 'COMP-2170E167' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);
console.log(token);
" 2>/dev/null)

echo "=== Test 1: GET claim-types ==="
curl -s -X GET http://localhost:4001/api/v1/hrms/v2/claim-types \
  -H "Authorization: Bearer $TOKEN"
echo ""

echo "=== Test 2: POST claim-types ==="
curl -s -X POST http://localhost:4001/api/v1/hrms/v2/claim-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Accommodation","description":"Hotel expenses","approvalLimit":2000}'
echo ""

echo "=== Test 3: POST create claim ==="
curl -s -X POST http://localhost:4001/api/v1/hrms/v2/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"claimTypeId":"777f897f-35ed-45f3-9228-61b32dc8baf9","businessPurpose":"Client Meeting","isDraft":false,"lineItems":[{"date":"2026-06-28","description":"Cab to airport","amount":450}]}'
echo ""

echo "=== Recent PM2 errors ==="
pm2 logs staffinn-backend --lines 15 --nostream 2>&1 | grep -E "Error|error|❌|500|claim" | tail -10
