# ⚡ Quick Start Guide - Fix Attendance Sync in 15 Minutes

## 🎯 Goal
Get attendance data syncing from biometric device to production HRMS in 15 minutes.

---

## ✅ Prerequisites (2 minutes)

Check you have:
- [ ] Access to production server (SSH/FTP)
- [ ] Access to Staffinn Bridge software
- [ ] Company ID from HRMS
- [ ] API Key from HRMS
- [ ] Text editor (Notepad++, VS Code, or nano)

---

## 🚀 Step 1: Update Production Backend (5 minutes)

### Option A: Direct Edit on Server (Recommended)

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Navigate to backend directory
cd /var/www/staffinn-backend
# OR
cd /home/ubuntu/staffinn-backend

# 3. Backup current .env
cp .env .env.backup

# 4. Edit .env file
nano .env
```

**Add these lines at the end:**
```env
# HRMS Tables
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

# Bridge Service
BRIDGE_SERVICE_URL=https://api.staffinn.com/api/v1
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

```bash
# 5. Restart backend
pm2 restart staffinn-backend
# OR
sudo systemctl restart staffinn-backend

# 6. Verify it's running
pm2 status
# OR
curl http://localhost:4001/health
```

### Option B: Upload from Local (Alternative)

```bash
# From your local machine
scp d:\Staffinn-main\Backend\.env.production user@server:/var/www/staffinn-backend/.env

# Then SSH and restart
ssh user@server
pm2 restart staffinn-backend
```

---

## 🔧 Step 2: Configure Bridge Software (5 minutes)

### 1. Open Bridge Software
- Launch Staffinn Bridge application on your desktop

### 2. Go to Settings/Configuration
- Look for "API Settings" or "Server Configuration"

### 3. Update API Endpoint
**Change from:**
```
http://localhost:4001/api/v1/hrms/attendance/bridge-attendance
```

**Change to:**
```
https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance
```

### 4. Enter Credentials
**Company ID:** Get from HRMS → Company Setup
**API Key:** Get from HRMS → Company Credentials

### 5. Test Connection
- Click "Test Connection" button
- Should show "✅ Connection Successful"

### 6. Save Configuration
- Click "Save" or "Apply"
- Restart Bridge software if required

---

## 🧪 Step 3: Test the Fix (3 minutes)

### Test 1: Manual Sync
1. Punch attendance on biometric device
2. Click "Sync Now" in Bridge software
3. Wait 5 seconds
4. Open HRMS → Attendance section
5. ✅ Attendance should appear

### Test 2: Real-time Sync
1. Punch attendance on biometric device
2. Wait 10 seconds (don't click sync)
3. Check HRMS → Attendance section
4. ✅ Attendance should appear automatically

### Test 3: Check Logs
```bash
# On server
pm2 logs staffinn-backend --lines 20

# Look for:
# ✅ "Attendance marked successfully"
# ✅ "Employee: EMP001, Time: 09:00"
```

---

## 🎉 Success Checklist

- [ ] Backend .env updated with HRMS tables
- [ ] Backend restarted successfully
- [ ] Bridge configured with production URL
- [ ] Bridge connection test passed
- [ ] Test attendance appeared in HRMS
- [ ] No errors in backend logs
- [ ] Real-time sync working

---

## ❌ Troubleshooting (If Something Goes Wrong)

### Problem 1: Backend Won't Start
```bash
# Check logs
pm2 logs staffinn-backend

# Restore backup
cp .env.backup .env
pm2 restart staffinn-backend
```

### Problem 2: Bridge Connection Failed
**Check:**
- Is API endpoint URL correct?
- Is Company ID correct?
- Is API Key correct?
- Is internet working?

**Test manually:**
```bash
curl https://api.staffinn.com/health
```

### Problem 3: Attendance Not Appearing
**Check:**
1. Does employee exist in HRMS?
2. Does employeeId match between device and HRMS?
3. Are there any errors in backend logs?
4. Is Bridge showing "Sync Successful"?

---

## 📞 Quick Help

### Get Company ID
1. Login to HRMS
2. Go to Settings → Company Setup
3. Copy Company ID

### Get API Key
1. Login to HRMS
2. Go to Settings → Company Credentials
3. Copy API Key (or generate new one)

### Check Backend Status
```bash
# PM2
pm2 status
pm2 logs staffinn-backend

# systemd
sudo systemctl status staffinn-backend
sudo journalctl -u staffinn-backend -n 50
```

### Test API Manually
```bash
curl -X POST https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance \
  -H "Content-Type: application/json" \
  -H "x-company-id: YOUR_COMPANY_ID" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "employeeId": "EMP001",
    "checkIn": "09:00",
    "date": "2024-01-20",
    "source": "biometric"
  }'
```

---

## 📋 What We Fixed

### Before ❌
```
Bridge → localhost:4001 → ❌ Not found → No data in HRMS
```

### After ✅
```
Bridge → api.staffinn.com → ✅ Backend receives → ✅ Data in HRMS
```

---

## 🎯 Next Steps

After successful fix:
1. ✅ Monitor for 24 hours
2. ✅ Test with multiple employees
3. ✅ Verify data accuracy
4. ✅ Document Bridge configuration
5. ✅ Train team on troubleshooting

---

## 📚 Full Documentation

For detailed information, see:
- `ATTENDANCE_SYNC_PRODUCTION_FIX.md` - Complete technical guide
- `BRIDGE_SOFTWARE_CONFIGURATION.md` - Bridge setup guide
- `PRODUCTION_DEPLOYMENT_CHECKLIST.md` - Deployment steps
- `ATTENDANCE_SYNC_EXECUTIVE_SUMMARY.md` - Overview
- `ATTENDANCE_SYNC_FLOW_DIAGRAM.md` - Visual diagrams

---

## ⏱️ Time Breakdown

- Step 1 (Backend): 5 minutes
- Step 2 (Bridge): 5 minutes
- Step 3 (Testing): 3 minutes
- Buffer: 2 minutes

**Total: 15 minutes** ⚡

---

## ✅ Done!

If you followed all steps and tests passed, your attendance sync is now working! 🎉

Attendance data should now appear in production HRMS within 5-10 seconds of punching on the biometric device.
