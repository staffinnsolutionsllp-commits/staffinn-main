#!/bin/bash

# Biometric Attendance System - Quick Setup Script
# Run this on EC2 instance

echo "=========================================="
echo "🚀 Biometric Attendance System Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on EC2
if [ ! -d "/home/ec2-user/staffinn-backend" ]; then
    echo -e "${RED}❌ Error: staffinn-backend directory not found${NC}"
    echo "Please run this script on EC2 instance"
    exit 1
fi

cd /home/ec2-user/staffinn-backend

echo -e "${YELLOW}Step 1: Creating DynamoDB Table...${NC}"
node scripts/create-hrms-attendance-table.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Table created successfully${NC}"
else
    echo -e "${RED}❌ Table creation failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Updating Environment Variables...${NC}"

# Check if variables already exist
if grep -q "DYNAMODB_HRMS_ATTENDANCE_TABLE" .env.production; then
    echo -e "${GREEN}✅ Environment variables already configured${NC}"
else
    echo "DYNAMODB_HRMS_ATTENDANCE_TABLE=staffinn-hrms-attendance" >> .env.production
    echo "DYNAMODB_HRMS_EMPLOYEES_TABLE=staffinn-hrms-employees" >> .env.production
    echo -e "${GREEN}✅ Environment variables added${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Installing Dependencies...${NC}"
npm install uuid --save
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Dependency installation failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 4: Restarting Server...${NC}"
pm2 restart staffinn-backend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Server restarted successfully${NC}"
else
    echo -e "${RED}❌ Server restart failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 5: Verifying Setup...${NC}"
sleep 3

# Test endpoint
RESPONSE=$(curl -s http://localhost:4001/api/v1/biometric/test)
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Biometric endpoint is working${NC}"
else
    echo -e "${RED}❌ Biometric endpoint test failed${NC}"
    echo "Response: $RESPONSE"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Get your EC2 Public IP:"
echo "   curl http://checkip.amazonaws.com"
echo ""
echo "2. Configure Security Group:"
echo "   - Open port 4001 in AWS Console"
echo ""
echo "3. Configure Device:"
echo "   - Event Transfer Mode: YES"
echo "   - Host PC Addr: <Your-EC2-Public-IP>"
echo "   - Host PC Port: 4001"
echo ""
echo "4. Test endpoint:"
echo "   curl http://<ec2-ip>:4001/api/v1/biometric/test"
echo ""
echo "5. Check logs:"
echo "   pm2 logs staffinn-backend --lines 50"
echo ""
echo "=========================================="
echo ""

# Get EC2 public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
if [ ! -z "$PUBLIC_IP" ]; then
    echo -e "${GREEN}Your EC2 Public IP: $PUBLIC_IP${NC}"
    echo ""
    echo "Device Configuration:"
    echo "  Host PC Addr: $PUBLIC_IP"
    echo "  Host PC Port: 4001"
    echo ""
fi

echo "📖 Full documentation: BIOMETRIC_ATTENDANCE_SETUP_GUIDE.md"
echo ""
