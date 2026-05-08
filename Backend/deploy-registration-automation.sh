#!/bin/bash

echo "=========================================="
echo "  Registration Automation Deployment"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Backup
echo -e "${YELLOW}[1/5] Creating backup...${NC}"
cp services/emailService.js services/emailService.js.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✓ Backup created${NC}"
echo ""

# Step 2: Verify RESEND_API_KEY
echo -e "${YELLOW}[2/5] Checking RESEND_API_KEY...${NC}"
if grep -q "RESEND_API_KEY" .env.production; then
    echo -e "${GREEN}✓ RESEND_API_KEY found${NC}"
else
    echo -e "${RED}✗ RESEND_API_KEY not found!${NC}"
    echo "Adding RESEND_API_KEY..."
    echo "RESEND_API_KEY=re_XDmEgB48_4nBWaP7nBrmrv5MgbLXBeJVw" >> .env.production
    echo -e "${GREEN}✓ RESEND_API_KEY added${NC}"
fi
echo ""

# Step 3: Verify emailService.js has correct from address
echo -e "${YELLOW}[3/5] Checking email configuration...${NC}"
if grep -q "noreply@staffinn.com" services/emailService.js; then
    echo -e "${GREEN}✓ Email service configured correctly${NC}"
else
    echo -e "${YELLOW}⚠ Updating email service...${NC}"
    sed -i 's/onboarding@resend.dev/noreply@staffinn.com/g' services/emailService.js
    echo -e "${GREEN}✓ Email service updated${NC}"
fi
echo ""

# Step 4: Restart PM2
echo -e "${YELLOW}[4/5] Restarting backend...${NC}"
pm2 restart staffinn-backend
echo -e "${GREEN}✓ Backend restarted${NC}"
echo ""

# Step 5: Test
echo -e "${YELLOW}[5/5] Running tests...${NC}"
echo ""
echo "Testing registration request endpoint..."
curl -X POST https://api.staffinn.com/api/v1/registration-requests \
  -H "Content-Type: application/json" \
  -d '{
    "type": "institute",
    "name": "Test Institute",
    "email": "test@example.com",
    "phoneNumber": "9876543210"
  }' \
  -s | jq '.'

echo ""
echo -e "${GREEN}=========================================="
echo "  Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "✅ Registration automation is now live!"
echo ""
echo "Next steps:"
echo "1. Test approval flow from Master Admin Panel"
echo "2. Check email delivery in Resend dashboard"
echo "3. Verify user can login with generated credentials"
echo ""
echo "Monitor logs:"
echo "  pm2 logs staffinn-backend --lines 50"
echo ""
echo "Check Resend dashboard:"
echo "  https://resend.com/emails"
echo ""
