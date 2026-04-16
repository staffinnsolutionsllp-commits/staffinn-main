# 🔧 Attendance Sync Production Fix Guide

## Problem Summary
Biometric attendance data is not syncing to production HRMS, but works perfectly on localhost.

## Root Causes Identified

### 1. Missing HRMS Table Configurations in Production
Your `.env.production` file is missing critical HRMS table environment variables.

### 2. Hardcoded Bridge Service URL
The attendance controller has `BRIDGE_SERVICE_URL = 'http://localhost:3002'` hardcoded, which only works locally.

### 3. Bridge Software Configuration
The Staffinn Bridge software needs to be configured to send attendance data to the production API endpoint.

---

## 🎯 Complete Fix (Step-by-Step)

### Step 1: Update Production Environment Variables

**File**: `Backend/.env.production`

Add these missing HRMS table configurations:

```env
# HRMS Tables (ADD THESE LINES)
HRMS_USERS_TABLE=staffinn-hrms-users
HRMS_EMPLOYEES_TABLE=staffinn-hrms-employees
HRMS_ATTENDANCE_TABLE=staffinn-hrms-attendance
HRMS_GRIEVANCES_TABLE=staffinn-hrms-grievances
HRMS_GRIEVANCE_COMMENTS_TABLE=staffinn-hrms-grievance-comments
HRMS_ORGANIZATION_CHART_TABLE=staffinn-hrms-organization-chart
HRMS_COMPANIES_TABLE=staffinn-hrms-companies
HRMS_ROLES_TABLE=staffinn-hrms-roles
HRMS_LEAVES_TABLE=staffinn-hrms-leaves
HRMS_LEAVE_RULES_TABLE=staffinn-hrms-leave-rules
HRMS_LEAVE_BALANCES_TABLE=staffinn-hrms-leave-balances
HRMS_CLAIMS_TABLE=staffinn-hrms-claims
HRMS_CLAIM_CATEGORIES_TABLE=staffinn-hrms-claim-categories
HRMS_TASKS_TABLE=staffinn-hrms-tasks
HRMS_TASK_RATINGS_TABLE=staffinn-hrms-task-ratings
HRMS_SEPARATIONS_TABLE=staffinn-hrms-separations
HRMS_PAYROLL_TABLE=staffinn-hrms-payroll
HRMS_NOTIFICATIONS_TABLE=staffinn-hrms-notifications
```

### Step 2: Fix Bridge Service URL (Make it Dynamic)

**File**: `Backend/controllers/hrms/hrmsAttendanceController.js`

**Current Code (Line 6):**
```javascript
const BRIDGE_SERVICE_URL = 'http://localhost:3002';
```

**Replace with:**
```javascript
// Bridge service configuration - use environment variable or default to localhost
const BRIDGE_SERVICE_URL = process.env.BRIDGE_SERVICE_URL || 'http://localhost:3002';
```

**Then add to `.env` (local):**
```env
BRIDGE_SERVICE_URL=http://localhost:3002
```

**And add to `.env.production`:**
```env
# Bridge Service Configuration
BRIDGE_SERVICE_URL=https://api.staffinn.com/api/v1
```

### Step 3: Configure Staffinn Bridge Software

The Bridge software needs to send attendance data to the correct endpoint.

**Bridge Configuration Settings:**

1. **For Production Use:**
   - API Endpoint: `https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance`
   - Company ID: `<your-company-id>`
   - API Key: `<your-api-key>`

2. **For Local Testing:**
   - API Endpoint: `http://localhost:4001/api/v1/hrms/attendance/bridge-attendance`
   - Company ID: `<your-company-id>`
   - API Key: `<your-api-key>`

### Step 4: Alternative Solution - Direct Bridge Endpoint

If the Bridge software cannot be reconfigured, you can use the direct bridge endpoint that doesn't require authentication:

**Bridge Endpoint (No Auth Required):**
```
POST https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance
```

**Headers:**
```
Content-Type: application/json
x-company-id: <your-company-id>
x-api-key: <your-api-key>
```

**Body:**
```json
{
  "employeeId": "EMP001",
  "checkIn": "09:00",
  "date": "2024-01-20",
  "source": "biometric",
  "deviceId": "DEVICE001"
}
```

### Step 5: Update Backend on Production Server

After making the changes:

1. **Upload the updated files to production:**
   ```bash
   # Upload .env.production
   # Upload hrmsAttendanceController.js
   ```

2. **Restart the backend server:**
   ```bash
   pm2 restart staffinn-backend
   # OR
   systemctl restart staffinn-backend
   ```

3. **Verify the changes:**
   ```bash
   # Check if environment variables are loaded
   curl https://api.staffinn.com/health
   ```

---

## 🧪 Testing the Fix

### Test 1: Check API Endpoint
```bash
curl https://api.staffinn.com/api/v1/hrms/attendance/stats
```

### Test 2: Test Bridge Endpoint (Manual)
```bash
curl -X POST https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance \
  -H "Content-Type: application/json" \
  -H "x-company-id: YOUR_COMPANY_ID" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "employeeId": "EMP001",
    "checkIn": "09:00",
    "date": "2024-01-20",
    "source": "biometric",
    "deviceId": "DEVICE001"
  }'
```

### Test 3: Punch Attendance on Device
1. Punch attendance on biometric device
2. Wait 5-10 seconds
3. Check HRMS Attendance section
4. Attendance should appear immediately

---

## 🔍 Debugging Steps

If attendance still doesn't appear:

### 1. Check Backend Logs
```bash
# On production server
pm2 logs staffinn-backend --lines 100
# OR
tail -f /var/log/staffinn/backend.log
```

### 2. Check Browser Console
1. Open HRMS in browser
2. Press F12 → Console tab
3. Look for any API errors

### 3. Check Network Tab
1. Open HRMS in browser
2. Press F12 → Network tab
3. Punch attendance
4. Look for API calls to `/attendance/stats` or `/attendance/date/`
5. Check if they return 200 OK

### 4. Verify Database Tables
```bash
# Check if HRMS tables exist in DynamoDB
aws dynamodb list-tables --region ap-south-1 | grep hrms
```

### 5. Check Bridge Software Logs
- Open Staffinn Bridge application
- Check logs/console for any error messages
- Verify it's sending data to correct endpoint

---

## 📋 Quick Checklist

- [ ] Added HRMS table configurations to `.env.production`
- [ ] Made BRIDGE_SERVICE_URL dynamic in controller
- [ ] Added BRIDGE_SERVICE_URL to both .env files
- [ ] Configured Bridge software with production API endpoint
- [ ] Uploaded updated files to production server
- [ ] Restarted backend server
- [ ] Tested attendance punch
- [ ] Verified attendance appears in HRMS
- [ ] Checked backend logs for errors
- [ ] Checked browser console for errors

---

## 🚨 Common Issues & Solutions

### Issue 1: "Employee not found" error
**Solution**: Ensure employee exists in HRMS with correct employeeId that matches biometric device.

### Issue 2: No logs appearing
**Solution**: Check if backend server is running and accessible from Bridge software.

### Issue 3: CORS errors in browser
**Solution**: Verify CORS configuration in `server.js` includes production domain.

### Issue 4: 401 Unauthorized
**Solution**: Check if x-company-id and x-api-key headers are correct.

### Issue 5: Data appears after long delay
**Solution**: Check if Bridge software is configured to sync in real-time or on schedule.

---

## 📞 Support

If issues persist after following this guide:

1. **Check Backend Logs**: Look for specific error messages
2. **Check Bridge Logs**: Verify Bridge is sending data
3. **Test API Manually**: Use curl/Postman to test endpoints
4. **Verify Network**: Ensure production server is accessible from Bridge machine
5. **Check Firewall**: Ensure port 443 (HTTPS) is open

---

## 🎉 Success Indicators

After implementing the fix, you should see:

✅ Attendance data appears in HRMS within 5-10 seconds of punch
✅ No errors in backend logs
✅ No errors in browser console
✅ Bridge software shows successful sync
✅ Attendance stats update in real-time

---

## 📝 Notes

- The Bridge software should be configured to send data to production API, not localhost
- Ensure your production server has proper SSL certificate for HTTPS
- Keep API keys secure and never commit them to version control
- Consider using environment-specific configuration files for Bridge software
