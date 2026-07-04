#!/bin/bash
cd /home/ec2-user/Backend

# Generate valid token
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

echo "Token generated: ${TOKEN:0:30}..."
echo ""
echo "=== POST /api/v1/hrms/v2/claim-types ==="
RESPONSE=$(curl -s -X POST http://localhost:4001/api/v1/hrms/v2/claim-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Travel","description":"test","approvalLimit":5000,"ratePerKM":4}')
echo "Response: $RESPONSE"

echo ""
echo "=== PM2 recent errors ==="
pm2 logs staffinn-backend --lines 20 --nostream 2>&1 | grep -i "error\|Error\|claim\|500" | tail -15
