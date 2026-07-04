#!/bin/bash

echo "=========================================="
echo "  Staffinn Backend Deployment Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Backup current files
echo -e "${YELLOW}[1/6] Creating backup...${NC}"
cp services/emailService.js services/emailService.js.backup.$(date +%Y%m%d_%H%M%S)
cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✓ Backup created${NC}"
echo ""

# Step 2: Check if ecosystem.config.js exists
echo -e "${YELLOW}[2/6] Checking ecosystem config...${NC}"
if [ ! -f "ecosystem.config.js" ]; then
    echo -e "${RED}✗ ecosystem.config.js not found!${NC}"
    echo "Creating ecosystem.config.js..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'staffinn-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env_production: {
      NODE_ENV: 'production',
      PORT: 4001
    },
    error_file: '~/.pm2/logs/staffinn-backend-error.log',
    out_file: '~/.pm2/logs/staffinn-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M'
  }]
};
EOF
    echo -e "${GREEN}✓ ecosystem.config.js created${NC}"
else
    echo -e "${GREEN}✓ ecosystem.config.js exists${NC}"
fi
echo ""

# Step 3: Verify .env.production has RESEND_API_KEY
echo -e "${YELLOW}[3/6] Checking .env.production...${NC}"
if grep -q "RESEND_API_KEY" .env.production; then
    echo -e "${GREEN}✓ RESEND_API_KEY found in .env.production${NC}"
else
    echo -e "${RED}✗ RESEND_API_KEY not found!${NC}"
    echo "Adding RESEND_API_KEY to .env.production..."
    echo "" >> .env.production
    echo "# Resend API Configuration" >> .env.production
    echo "RESEND_API_KEY=re_XDmEgB48_4nBWaP7nBrmrv5MgbLXBeJVw" >> .env.production
    echo -e "${GREEN}✓ RESEND_API_KEY added${NC}"
fi
echo ""

# Step 4: Stop current PM2 process
echo -e "${YELLOW}[4/6] Stopping current PM2 process...${NC}"
pm2 stop staffinn-backend 2>/dev/null || echo "No process to stop"
pm2 delete staffinn-backend 2>/dev/null || echo "No process to delete"
echo -e "${GREEN}✓ Old process stopped${NC}"
echo ""

# Step 5: Start with ecosystem config
echo -e "${YELLOW}[5/6] Starting backend in production mode...${NC}"
pm2 start ecosystem.config.js --env production
pm2 save
echo -e "${GREEN}✓ Backend started in production mode${NC}"
echo ""

# Step 6: Show status and logs
echo -e "${YELLOW}[6/6] Checking status...${NC}"
pm2 status
echo ""
echo -e "${GREEN}=========================================="
echo "  Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Check logs: pm2 logs staffinn-backend --lines 50"
echo "2. Test OTP: Go to https://staffinn.com and try registration"
echo "3. Monitor: pm2 monit"
echo ""
echo "Showing recent logs..."
echo ""
pm2 logs staffinn-backend --lines 20 --nostream
