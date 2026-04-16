# 🚀 Production Deployment Guide

## Overview
This guide covers deploying the recruiterId field consistency fixes to production server.

## 📋 Pre-Deployment Checklist

- [x] Local testing completed
- [x] Field consistency verified locally
- [x] Backup script ready
- [x] Deployment scripts created
- [ ] Production database backup taken
- [ ] Team notified about deployment

## 🎯 What Will Be Deployed

### Backend Changes:
1. **hrmsCompanyController.js**
   - Added `recruiterId` to all API responses
   - New endpoint: `GET /api/hrms/companies/recruiter/:recruiterId`

2. **hrmsCompanyRoutes.js**
   - Added route for fetching companies by recruiterId

3. **Migration Scripts**
   - `migrate-add-recruiter-to-company.js` - Enhanced with better error handling
   - `manual-fix-recruiterid.js` - NEW: Fixes companies without HRMS user link
   - `add-recruiterid-gsi-to-companies.js` - Fixed for PAY_PER_REQUEST billing
   - `verify-field-consistency.js` - NEW: Verification tool

## 🚀 Deployment Steps

### Option 1: Automated Deployment (Recommended)

#### Windows:
```bash
cd D:\Staffinn-main
deploy-production.bat
```

#### Linux/Mac:
```bash
cd /path/to/Staffinn-main
chmod +x deploy-production.sh
./deploy-production.sh
```

### Option 2: Manual Deployment

#### Step 1: Connect to Server
```bash
ssh -i "D:\staffinn-key.pem" ec2-user@3.109.94.100
```

#### Step 2: Create Backup
```bash
cd /home/ec2-user/Staffinn-main/Backend
BACKUP_DIR="backups/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r controllers/hrms/hrmsCompanyController.js $BACKUP_DIR/
cp -r routes/hrms/hrmsCompanyRoutes.js $BACKUP_DIR/
cp -r scripts/*.js $BACKUP_DIR/
echo "Backup created at: $BACKUP_DIR"
```

#### Step 3: Upload Files (From Local Machine)
```bash
# Controller
scp -i "D:\staffinn-key.pem" Backend/controllers/hrms/hrmsCompanyController.js \
    ec2-user@3.109.94.100:/home/ec2-user/Staffinn-main/Backend/controllers/hrms/

# Routes
scp -i "D:\staffinn-key.pem" Backend/routes/hrms/hrmsCompanyRoutes.js \
    ec2-user@3.109.94.100:/home/ec2-user/Staffinn-main/Backend/routes/hrms/

# Scripts
scp -i "D:\staffinn-key.pem" Backend/scripts/migrate-add-recruiter-to-company.js \
    ec2-user@3.109.94.100:/home/ec2-user/Staffinn-main/Backend/scripts/

scp -i "D:\staffinn-key.pem" Backend/scripts/manual-fix-recruiterid.js \
    ec2-user@3.109.94.100:/home/ec2-user/Staffinn-main/Backend/scripts/

scp -i "D:\staffinn-key.pem" Backend/scripts/add-recruiterid-gsi-to-companies.js \
    ec2-user@3.109.94.100:/home/ec2-user/Staffinn-main/Backend/scripts/

scp -i "D:\staffinn-key.pem" Backend/scripts/verify-field-consistency.js \
    ec2-user@3.109.94.100:/home/ec2-user/Staffinn-main/Backend/scripts/
```

#### Step 4: Restart Backend (On Server)
```bash
cd /home/ec2-user/Staffinn-main/Backend
pm2 restart staffinn-backend
# OR
pm2 restart all
```

#### Step 5: Verify Deployment
```bash
cd /home/ec2-user/Staffinn-main/Backend
node scripts/verify-field-consistency.js
```

## 🔧 Post-Deployment Tasks

### 1. Run Field Consistency Check
```bash
ssh -i "D:\staffinn-key.pem" ec2-user@3.109.94.100
cd /home/ec2-user/Staffinn-main/Backend
node scripts/verify-field-consistency.js
```

**Expected Output:**
```
✅ With recruiterId (camelCase): X
⚠️  With recruiter_id (snake_case): 0
❌ Without recruiterId: Y
```

### 2. Fix Inconsistencies (If Found)

#### If companies missing recruiterId:
```bash
node scripts/manual-fix-recruiterid.js
```

#### Add GSI (If not exists):
```bash
node scripts/add-recruiterid-gsi-to-companies.js
```

#### Verify again:
```bash
node scripts/verify-field-consistency.js
```

### 3. Test API Endpoints

#### Test Company Profile:
```bash
curl -X GET https://api.staffinn.com/api/hrms/companies/COMP-XXX/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Get Companies by Recruiter:
```bash
curl -X GET https://api.staffinn.com/api/hrms/companies/recruiter/REC-XXX \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Monitor Logs
```bash
pm2 logs staffinn-backend --lines 100
```

## 🔍 Attendance Data Check

### Check if attendance is showing in HRMS frontend:

1. **Verify Backend is Running:**
```bash
pm2 status
pm2 logs staffinn-backend
```

2. **Check Attendance API:**
```bash
# Get today's attendance
curl -X GET https://api.staffinn.com/api/hrms/attendance/date/$(date +%Y-%m-%d) \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get attendance stats
curl -X GET https://api.staffinn.com/api/hrms/attendance/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Check Database:**
```bash
# On server
cd /home/ec2-user/Staffinn-main/Backend
node -e "
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

(async () => {
  const result = await docClient.send(new ScanCommand({
    TableName: 'staffinn-hrms-attendance',
    Limit: 10
  }));
  console.log('Sample attendance records:', JSON.stringify(result.Items, null, 2));
})();
"
```

4. **Check Frontend Console:**
   - Open HRMS frontend in browser
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for errors related to attendance API calls

5. **Common Issues & Fixes:**

   **Issue: No attendance data showing**
   ```bash
   # Check if recruiterId is properly set in attendance records
   node scripts/verify-field-consistency.js
   
   # Check attendance controller logs
   pm2 logs staffinn-backend | grep attendance
   ```

   **Issue: API returns empty array**
   ```bash
   # Verify user has recruiterId in token
   # Check JWT token payload
   # Ensure attendance records have recruiterId field
   ```

   **Issue: WebSocket not connecting**
   ```bash
   # Check if Socket.IO is running
   pm2 logs staffinn-backend | grep socket
   
   # Verify CORS settings
   # Check firewall rules for WebSocket port
   ```

## 📊 Monitoring

### Key Metrics to Watch:
- API response times
- Error rates in logs
- Database query performance
- Memory usage

### Commands:
```bash
# CPU & Memory
pm2 monit

# Logs
pm2 logs staffinn-backend --lines 50

# Restart if needed
pm2 restart staffinn-backend
```

## 🔄 Rollback Plan

If issues occur:

### Quick Rollback:
```bash
cd /home/ec2-user/Staffinn-main/Backend
# Find latest backup
ls -lt backups/
# Restore from backup
BACKUP_DIR="backups/backup_YYYYMMDD_HHMMSS"
cp $BACKUP_DIR/hrmsCompanyController.js controllers/hrms/
cp $BACKUP_DIR/hrmsCompanyRoutes.js routes/hrms/
pm2 restart staffinn-backend
```

## ✅ Success Criteria

- [ ] All files uploaded successfully
- [ ] Backend restarted without errors
- [ ] Field consistency verification passes (100%)
- [ ] API endpoints responding correctly
- [ ] Attendance data showing in frontend
- [ ] No errors in PM2 logs
- [ ] WebSocket connections working

## 📞 Support

If issues persist:
1. Check PM2 logs: `pm2 logs staffinn-backend`
2. Verify database connectivity
3. Check AWS DynamoDB console
4. Review CloudWatch logs (if configured)

## 📝 Notes

- Deployment is backward compatible
- No data loss expected
- Migration scripts are idempotent (safe to run multiple times)
- GSI creation may take a few minutes

## 🎉 Post-Deployment Verification

After successful deployment:
1. ✅ Login to HRMS frontend
2. ✅ Check attendance page loads
3. ✅ Verify employee list shows
4. ✅ Check attendance records display
5. ✅ Test marking attendance manually
6. ✅ Verify real-time updates work
7. ✅ Check device status indicator

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Status:** _____________
