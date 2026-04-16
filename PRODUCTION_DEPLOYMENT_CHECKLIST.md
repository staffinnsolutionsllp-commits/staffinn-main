# 🚀 Production Deployment Checklist - Attendance Sync Fix

## Pre-Deployment Checklist

- [ ] Backup current production `.env` file
- [ ] Backup current `hrmsAttendanceController.js` file
- [ ] Test changes in local environment
- [ ] Verify all employees exist in HRMS
- [ ] Note down current Company ID and API Key

---

## Files to Upload to Production

### 1. Backend/.env.production
**Changes:**
- Added HRMS table configurations
- Added BRIDGE_SERVICE_URL configuration
- Updated FRONTEND_URL

**Location on Server:**
```
/var/www/staffinn-backend/.env
OR
/home/ubuntu/staffinn-backend/.env
```

### 2. Backend/controllers/hrms/hrmsAttendanceController.js
**Changes:**
- Made BRIDGE_SERVICE_URL dynamic (uses environment variable)

**Location on Server:**
```
/var/www/staffinn-backend/controllers/hrms/hrmsAttendanceController.js
OR
/home/ubuntu/staffinn-backend/controllers/hrms/hrmsAttendanceController.js
```

---

## Deployment Steps

### Step 1: Connect to Production Server

```bash
# SSH into production server
ssh user@your-production-server.com

# OR if using AWS EC2
ssh -i your-key.pem ubuntu@ec2-xx-xx-xx-xx.compute.amazonaws.com
```

### Step 2: Backup Current Files

```bash
# Navigate to backend directory
cd /var/www/staffinn-backend
# OR
cd /home/ubuntu/staffinn-backend

# Backup .env file
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Backup controller file
cp controllers/hrms/hrmsAttendanceController.js controllers/hrms/hrmsAttendanceController.js.backup.$(date +%Y%m%d_%H%M%S)
```

### Step 3: Upload Updated Files

**Option A: Using SCP (from your local machine)**

```bash
# Upload .env.production
scp Backend/.env.production user@server:/var/www/staffinn-backend/.env

# Upload controller
scp Backend/controllers/hrms/hrmsAttendanceController.js user@server:/var/www/staffinn-backend/controllers/hrms/
```

**Option B: Using FTP/SFTP Client**
- Use FileZilla, WinSCP, or similar
- Upload files to correct locations

**Option C: Manual Edit on Server**

```bash
# Edit .env file
nano /var/www/staffinn-backend/.env

# Add the HRMS table configurations and BRIDGE_SERVICE_URL
# Save and exit (Ctrl+X, Y, Enter)

# Edit controller file
nano /var/www/staffinn-backend/controllers/hrms/hrmsAttendanceController.js

# Update BRIDGE_SERVICE_URL line
# Save and exit (Ctrl+X, Y, Enter)
```

### Step 4: Verify File Changes

```bash
# Check .env file
cat /var/www/staffinn-backend/.env | grep HRMS
cat /var/www/staffinn-backend/.env | grep BRIDGE

# Check controller file
grep "BRIDGE_SERVICE_URL" /var/www/staffinn-backend/controllers/hrms/hrmsAttendanceController.js
```

### Step 5: Restart Backend Server

**If using PM2:**
```bash
pm2 restart staffinn-backend
pm2 logs staffinn-backend --lines 50
```

**If using systemd:**
```bash
sudo systemctl restart staffinn-backend
sudo systemctl status staffinn-backend
sudo journalctl -u staffinn-backend -n 50
```

**If using Docker:**
```bash
docker-compose restart backend
docker-compose logs backend --tail 50
```

### Step 6: Verify Server is Running

```bash
# Check if server is responding
curl http://localhost:4001/health

# Check if HRMS endpoints are working
curl http://localhost:4001/api/v1/hrms/attendance/stats
```

---

## Post-Deployment Verification

### Test 1: Check Environment Variables

```bash
# On production server
cd /var/www/staffinn-backend
node -e "require('dotenv').config(); console.log('HRMS_ATTENDANCE_TABLE:', process.env.HRMS_ATTENDANCE_TABLE); console.log('BRIDGE_SERVICE_URL:', process.env.BRIDGE_SERVICE_URL);"
```

**Expected Output:**
```
HRMS_ATTENDANCE_TABLE: staffinn-hrms-attendance
BRIDGE_SERVICE_URL: https://api.staffinn.com/api/v1
```

### Test 2: Check API Endpoints

```bash
# From your local machine
curl https://api.staffinn.com/health

# Check HRMS attendance endpoint
curl https://api.staffinn.com/api/v1/hrms/attendance/stats
```

### Test 3: Test Bridge Endpoint

```bash
# Test bridge attendance endpoint (replace with actual values)
curl -X POST https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance \
  -H "Content-Type: application/json" \
  -H "x-company-id: YOUR_COMPANY_ID" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "employeeId": "EMP001",
    "checkIn": "09:00",
    "date": "2024-01-20",
    "source": "biometric",
    "deviceId": "TEST001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "attendanceId": "...",
    "employeeId": "EMP001",
    "checkIn": "09:00",
    "date": "2024-01-20"
  }
}
```

### Test 4: Configure Bridge Software

1. Open Staffinn Bridge application
2. Update API endpoint to: `https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance`
3. Enter Company ID and API Key
4. Click "Test Connection"
5. Should show "Connection Successful"

### Test 5: Real Attendance Test

1. Punch attendance on biometric device
2. Click "Sync Now" in Bridge software
3. Wait 5-10 seconds
4. Open HRMS → Attendance section
5. Verify attendance entry appears

---

## Monitoring

### Check Backend Logs

```bash
# If using PM2
pm2 logs staffinn-backend --lines 100

# If using systemd
sudo journalctl -u staffinn-backend -f

# If using Docker
docker-compose logs -f backend
```

**Look for:**
- ✅ "Attendance marked successfully"
- ✅ "Bridge sync completed"
- ❌ Any error messages

### Check HRMS Frontend

1. Open browser → https://hrms.staffinn.com
2. Login to HRMS
3. Go to Attendance section
4. Check if data is appearing
5. Open browser console (F12) → Check for errors

---

## Rollback Plan (If Something Goes Wrong)

### Step 1: Restore Backup Files

```bash
# Restore .env file
cp .env.backup.YYYYMMDD_HHMMSS /var/www/staffinn-backend/.env

# Restore controller file
cp controllers/hrms/hrmsAttendanceController.js.backup.YYYYMMDD_HHMMSS /var/www/staffinn-backend/controllers/hrms/hrmsAttendanceController.js
```

### Step 2: Restart Server

```bash
# PM2
pm2 restart staffinn-backend

# systemd
sudo systemctl restart staffinn-backend

# Docker
docker-compose restart backend
```

### Step 3: Verify Rollback

```bash
curl http://localhost:4001/health
```

---

## Common Issues & Solutions

### Issue 1: Server Won't Start After Update

**Check:**
```bash
# Check syntax errors
node -c /var/www/staffinn-backend/controllers/hrms/hrmsAttendanceController.js

# Check .env file
cat /var/www/staffinn-backend/.env | grep -v "^#" | grep -v "^$"
```

**Solution:**
- Restore backup files
- Check for syntax errors
- Verify all environment variables are set

### Issue 2: 500 Internal Server Error

**Check:**
```bash
# Check logs
pm2 logs staffinn-backend --lines 50
```

**Solution:**
- Check if HRMS tables exist in DynamoDB
- Verify AWS credentials are correct
- Check if all required environment variables are set

### Issue 3: Bridge Connection Failed

**Check:**
- Verify API endpoint URL is correct
- Check if server is accessible from Bridge machine
- Verify firewall allows HTTPS traffic

**Solution:**
- Test API endpoint manually with curl
- Check server firewall settings
- Verify SSL certificate is valid

---

## Success Criteria

✅ Backend server starts without errors
✅ Health endpoint returns 200 OK
✅ HRMS attendance endpoint accessible
✅ Bridge connection test succeeds
✅ Test attendance punch appears in HRMS
✅ No errors in backend logs
✅ No errors in browser console
✅ Real-time sync working (data appears within 10 seconds)

---

## Final Checklist

- [ ] Files uploaded to production
- [ ] Backup files created
- [ ] Server restarted successfully
- [ ] Environment variables verified
- [ ] API endpoints tested
- [ ] Bridge software configured
- [ ] Test attendance successful
- [ ] Logs checked for errors
- [ ] Frontend verified
- [ ] Real-time sync working

---

## 📞 Emergency Contacts

If deployment fails:

1. **Rollback immediately** using backup files
2. **Check logs** for specific error messages
3. **Test locally** to reproduce issue
4. **Document the error** for troubleshooting

---

## 📝 Deployment Notes

**Date:** _______________
**Deployed By:** _______________
**Server:** _______________
**Backup Location:** _______________
**Issues Encountered:** _______________
**Resolution:** _______________
**Status:** ⬜ Success ⬜ Failed ⬜ Rolled Back

---

## Next Steps After Successful Deployment

1. Monitor logs for 24 hours
2. Verify attendance data accuracy
3. Train users on any changes
4. Update documentation
5. Schedule follow-up review
