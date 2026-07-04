#!/bin/bash

# ===================================================================
#  STAFFINN BACKEND DEPLOYMENT (EC2)
#  Run this script ON THE EC2 SERVER or via SSH
# ===================================================================

echo ""
echo "============================================================"
echo "   STAFFINN BACKEND DEPLOYMENT"
echo "============================================================"
echo ""

# Configuration
BACKEND_DIR="/home/ubuntu/staffinn-backend"
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}[ERROR] Backend directory not found: $BACKEND_DIR${NC}"
    exit 1
fi

cd "$BACKEND_DIR" || exit 1

echo -e "${YELLOW}Current directory: $(pwd)${NC}"
echo ""

# Create backup
echo -e "${YELLOW}Creating backup...${NC}"
mkdir -p "$BACKUP_DIR"
BACKUP_PATH="$BACKUP_DIR/backend-$TIMESTAMP"
cp -r "$BACKEND_DIR" "$BACKUP_PATH"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Backup created: $BACKUP_PATH${NC}"
else
    echo -e "${RED}[ERROR] Backup failed!${NC}"
    exit 1
fi

echo ""

# Check current git status
echo -e "${YELLOW}Checking git status...${NC}"
git status --short

echo ""

# Pull latest changes
echo -e "${YELLOW}Pulling latest changes from main...${NC}"
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Git pull failed!${NC}"
    echo -e "${YELLOW}Restoring from backup...${NC}"
    rm -rf "$BACKEND_DIR"
    cp -r "$BACKUP_PATH" "$BACKEND_DIR"
    exit 1
fi

echo -e "${GREEN}[OK] Code updated successfully!${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --production

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] npm install failed!${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Dependencies installed!${NC}"
echo ""

# Check PM2 status
echo -e "${YELLOW}Current PM2 status:${NC}"
pm2 list

echo ""

# Restart backend service
echo -e "${YELLOW}Restarting backend service...${NC}"
pm2 restart staffinn-backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Backend restarted successfully!${NC}"
else
    echo -e "${RED}[ERROR] PM2 restart failed!${NC}"
    exit 1
fi

echo ""

# Save PM2 configuration
echo -e "${YELLOW}Saving PM2 configuration...${NC}"
pm2 save

echo ""

# Show logs
echo -e "${YELLOW}Recent logs:${NC}"
pm2 logs staffinn-backend --lines 20 --nostream

echo ""
echo "============================================================"
echo "   DEPLOYMENT COMPLETE!"
echo "============================================================"
echo ""
echo -e "${GREEN}Backend deployed successfully!${NC}"
echo ""
echo "Verification:"
echo "  1. Check health: curl http://localhost:4001/health"
echo "  2. View logs:    pm2 logs staffinn-backend"
echo "  3. Monitor:      pm2 monit"
echo ""
echo "Backup location: $BACKUP_PATH"
echo ""
