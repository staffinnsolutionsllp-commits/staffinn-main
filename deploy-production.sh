#!/bin/bash

# Production Deployment Script
# Updates Backend code with recruiterId field consistency fixes

echo "🚀 Starting Production Deployment..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
REMOTE_USER="ec2-user"
REMOTE_HOST="3.109.94.100"
PEM_FILE="D:/staffinn-key.pem"
REMOTE_PATH="/home/ec2-user/Staffinn-main/Backend"

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "   Remote: $REMOTE_USER@$REMOTE_HOST"
echo "   Path: $REMOTE_PATH"
echo ""

# Step 1: Create backup on server
echo -e "${YELLOW}📦 Step 1: Creating backup on server...${NC}"
ssh -i "$PEM_FILE" $REMOTE_USER@$REMOTE_HOST << 'EOF'
cd /home/ec2-user/Staffinn-main/Backend
BACKUP_DIR="backups/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r controllers/hrms/hrmsCompanyController.js $BACKUP_DIR/
cp -r routes/hrms/hrmsCompanyRoutes.js $BACKUP_DIR/
cp -r scripts/migrate-add-recruiter-to-company.js $BACKUP_DIR/ 2>/dev/null || true
cp -r scripts/add-recruiterid-gsi-to-companies.js $BACKUP_DIR/ 2>/dev/null || true
echo "✅ Backup created at: $BACKUP_DIR"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup created successfully${NC}"
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi

# Step 2: Upload updated files
echo ""
echo -e "${YELLOW}📤 Step 2: Uploading updated files...${NC}"

# Upload controller
echo "   Uploading hrmsCompanyController.js..."
scp -i "$PEM_FILE" "Backend/controllers/hrms/hrmsCompanyController.js" \
    $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/controllers/hrms/

# Upload routes
echo "   Uploading hrmsCompanyRoutes.js..."
scp -i "$PEM_FILE" "Backend/routes/hrms/hrmsCompanyRoutes.js" \
    $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/routes/hrms/

# Upload migration script
echo "   Uploading migrate-add-recruiter-to-company.js..."
scp -i "$PEM_FILE" "Backend/scripts/migrate-add-recruiter-to-company.js" \
    $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/scripts/

# Upload manual fix script
echo "   Uploading manual-fix-recruiterid.js..."
scp -i "$PEM_FILE" "Backend/scripts/manual-fix-recruiterid.js" \
    $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/scripts/

# Upload GSI script
echo "   Uploading add-recruiterid-gsi-to-companies.js..."
scp -i "$PEM_FILE" "Backend/scripts/add-recruiterid-gsi-to-companies.js" \
    $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/scripts/

# Upload verification script
echo "   Uploading verify-field-consistency.js..."
scp -i "$PEM_FILE" "Backend/scripts/verify-field-consistency.js" \
    $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/scripts/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Files uploaded successfully${NC}"
else
    echo -e "${RED}❌ File upload failed${NC}"
    exit 1
fi

# Step 3: Restart Backend service
echo ""
echo -e "${YELLOW}🔄 Step 3: Restarting Backend service...${NC}"
ssh -i "$PEM_FILE" $REMOTE_USER@$REMOTE_HOST << 'EOF'
cd /home/ec2-user/Staffinn-main/Backend
pm2 restart staffinn-backend || pm2 restart all
echo "✅ Backend service restarted"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend restarted successfully${NC}"
else
    echo -e "${RED}❌ Backend restart failed${NC}"
    exit 1
fi

# Step 4: Run verification
echo ""
echo -e "${YELLOW}🔍 Step 4: Running field consistency verification...${NC}"
ssh -i "$PEM_FILE" $REMOTE_USER@$REMOTE_HOST << 'EOF'
cd /home/ec2-user/Staffinn-main/Backend
node scripts/verify-field-consistency.js
EOF

echo ""
echo -e "${GREEN}=================================="
echo "✅ Deployment Completed Successfully!"
echo "==================================${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "   1. Check verification output above"
echo "   2. If inconsistencies found, run:"
echo "      ssh -i \"$PEM_FILE\" $REMOTE_USER@$REMOTE_HOST"
echo "      cd /home/ec2-user/Staffinn-main/Backend"
echo "      node scripts/manual-fix-recruiterid.js"
echo "      node scripts/add-recruiterid-gsi-to-companies.js"
echo ""
echo -e "${YELLOW}📊 Monitor logs:${NC}"
echo "   ssh -i \"$PEM_FILE\" $REMOTE_USER@$REMOTE_HOST"
echo "   pm2 logs staffinn-backend"
echo ""
EOF
