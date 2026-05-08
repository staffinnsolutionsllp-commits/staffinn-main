#!/bin/bash

echo "=========================================="
echo "  Registration Automation Test Suite"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="https://api.staffinn.com/api/v1"
TEST_EMAIL="test-$(date +%s)@example.com"

echo -e "${BLUE}Test Configuration:${NC}"
echo "API URL: $API_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Test 1: Submit Registration Request
echo -e "${YELLOW}[Test 1/4] Submitting registration request...${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/registration-requests" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"institute\",
    \"name\": \"Test Institute\",
    \"email\": \"$TEST_EMAIL\",
    \"phoneNumber\": \"9876543210\"
  }")

echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
    REQUEST_ID=$(echo "$RESPONSE" | jq -r '.data.requestId')
    echo -e "${GREEN}✓ Test 1 PASSED${NC}"
    echo "Request ID: $REQUEST_ID"
else
    echo -e "${RED}✗ Test 1 FAILED${NC}"
    exit 1
fi
echo ""

# Test 2: Get All Requests
echo -e "${YELLOW}[Test 2/4] Fetching all registration requests...${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/registration-requests")

echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
    COUNT=$(echo "$RESPONSE" | jq '.data | length')
    echo -e "${GREEN}✓ Test 2 PASSED${NC}"
    echo "Total requests: $COUNT"
else
    echo -e "${RED}✗ Test 2 FAILED${NC}"
    exit 1
fi
echo ""

# Test 3: Check Email Service Configuration
echo -e "${YELLOW}[Test 3/4] Checking email service configuration...${NC}"

# Check if RESEND_API_KEY is set
if grep -q "RESEND_API_KEY" .env.production; then
    echo -e "${GREEN}✓ RESEND_API_KEY found in .env.production${NC}"
else
    echo -e "${RED}✗ RESEND_API_KEY not found${NC}"
    exit 1
fi

# Check if emailService.js uses correct domain
if grep -q "noreply@staffinn.com" services/emailService.js; then
    echo -e "${GREEN}✓ Email service uses verified domain${NC}"
else
    echo -e "${RED}✗ Email service not configured correctly${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Test 3 PASSED${NC}"
echo ""

# Test 4: Check Backend Status
echo -e "${YELLOW}[Test 4/4] Checking backend status...${NC}"

# Check if backend is running
if pm2 list | grep -q "staffinn-backend.*online"; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    exit 1
fi

# Check if running in production mode
if pm2 env 0 | grep -q "NODE_ENV.*production"; then
    echo -e "${GREEN}✓ Backend is in production mode${NC}"
else
    echo -e "${YELLOW}⚠ Backend is not in production mode${NC}"
    echo "Run: pm2 restart staffinn-backend --update-env"
fi

echo -e "${GREEN}✓ Test 4 PASSED${NC}"
echo ""

# Summary
echo -e "${GREEN}=========================================="
echo "  All Tests Passed! ✓"
echo "==========================================${NC}"
echo ""
echo "Registration automation is ready!"
echo ""
echo "Next steps:"
echo "1. Test approval flow from Master Admin Panel"
echo "2. Request ID: $REQUEST_ID"
echo "3. Test Email: $TEST_EMAIL"
echo ""
echo "To approve this test request:"
echo "  curl -X PUT $API_URL/registration-requests/$REQUEST_ID/approve \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'Authorization: Bearer {admin-token}' \\"
echo "    -d '{\"instituteType\": \"normal\"}'"
echo ""
echo "Monitor logs:"
echo "  pm2 logs staffinn-backend --lines 0"
echo ""
echo "Check Resend dashboard:"
echo "  https://resend.com/emails"
echo ""
