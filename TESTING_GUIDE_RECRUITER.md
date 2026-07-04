# 🔍 COMPLETE ATTENDANCE SYSTEM TESTING GUIDE

**Recruiter ID:** `7e0dd1ad-e456-444f-8992-5a66af451238`  
**Target Date:** `15-05-2026` (May 15, 2026)  
**Issue:** Attendance not showing in HRMS frontend

---

## 🚀 QUICK START - RUN TESTS

### Test 1: Database Testing (DynamoDB)

```bash
cd Backend
node test-attendance-system.js
```

**What it checks:**
- ✅ Employees exist for this recruiter
- ✅ Attendance records for today (2026-05-15)
- ✅ All attendance records (any date)
- ✅ Employee-device mappings
- ✅ Company configuration
- ✅ Registered devices

**Expected Output:**
```
🔍 COMPLETE ATTENDANCE SYSTEM TESTING
================================================================================
📋 Recruiter ID: 7e0dd1ad-e456-444f-8992-5a66af451238
📅 Target Date: 2026-05-15
================================================================================

📊 TEST 1: CHECKING EMPLOYEES
--------------------------------------------------------------------------------
✅ Total Employees Found: X

📊 TEST 2: CHECKING ATTENDANCE RECORDS FOR TODAY
--------------------------------------------------------------------------------
✅ Total Attendance Records for 2026-05-15: X

... (detailed results)
```

---

### Test 2: API Testing (Backend Endpoints)

```bash
# First, get your HRMS token:
# 1. Login to HRMS
# 2. Open Browser DevTools (F12)
# 3. Go to: Application → Local Storage
# 4. Find: hrms_token_7e0dd1ad-e456-444f-8992-5a66af451238
# 5. Copy the token value

# Then run:
HRMS_TOKEN=your_token_here node test-attendance-apis.js
```

**What it checks:**
- ✅ Backend health
- ✅ Attendance stats API
- ✅ Attendance by date API
- ✅ Mappings API
- ✅ Devices API
- ✅ Device status API

---

## 📊 MANUAL TESTING STEPS

### Step 1: Check DynamoDB Tables Directly

```bash
# Check employees
aws dynamodb scan \
  --table-name staffinn-hrms-employees \
  --filter-expression "recruiterId = :rid" \
  --expression-attribute-values '{":rid":{"S":"7e0dd1ad-e456-444f-8992-5a66af451238"}}' \
  --region ap-south-1 \
  --output json | jq '.Items | length'

# Check attendance for today
aws dynamodb scan \
  --table-name staffinn-hrms-attendance \
  --filter-expression "recruiterId = :rid AND #date = :date" \
  --expression-attribute-names '{"#date":"date"}' \
  --expression-attribute-values '{
    ":rid":{"S":"7e0dd1ad-e456-444f-8992-5a66af451238"},
    ":date":{"S":"2026-05-15"}
  }' \
  --region ap-south-1 \
  --output json | jq '.Items'

# Check all attendance (any date)
aws dynamodb scan \
  --table-name staffinn-hrms-attendance \
  --filter-expression "recruiterId = :rid" \
  --expression-attribute-values '{":rid":{"S":"7e0dd1ad-e456-444f-8992-5a66af451238"}}' \
  --region ap-south-1 \
  --output json | jq '.Items | group_by(.date) | map({date: .[0].date, count: length})'

# Check mappings
aws dynamodb scan \
  --table-name staffinn-hrms-employee-device-mappings \
  --filter-expression "recruiterId = :rid" \
  --expression-attribute-values '{":rid":{"S":"7e0dd1ad-e456-444f-8992-5a66af451238"}}' \
  --region ap-south-1 \
  --output json | jq '.Items'
```

---

### Step 2: Check Backend Logs

```bash
# If using PM2
pm2 logs staffinn-backend --lines 100 | grep "7e0dd1ad-e456-444f-8992-5a66af451238"

# Look for:
# - "Mark attendance request"
# - "Bridge request authenticated"
# - "Check-in recorded"
# - "WebSocket broadcast sent"
```

---

### Step 3: Test Backend APIs Manually

```bash
# Get attendance stats
curl -X GET "https://api.staffinn.com/api/v1/hrms/attendance/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get attendance for specific date
curl -X GET "https://api.staffinn.com/api/v1/hrms/attendance/date/2026-05-15" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get mappings
curl -X GET "https://api.staffinn.com/api/v1/hrms/attendance/mappings" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check device status
curl -X GET "https://api.staffinn.com/api/v1/hrms/attendance/device-status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Step 4: Check Frontend

**Browser Console (F12):**

```javascript
// Check current date
console.log(new Date().toISOString().split('T')[0])
// Should output: "2026-05-15"

// Check WebSocket connection
// Look for:
"🔌 Connecting to WebSocket: https://api.staffinn.com"
"✅ WebSocket connected"
"📡 Joined room: recruiter-7e0dd1ad-e456-444f-8992-5a66af451238"

// Check API calls in Network tab
// Filter: XHR
// Look for: /api/v1/hrms/attendance/date/2026-05-15
// Check Response
```

---

## 🎯 COMMON ISSUES & SOLUTIONS

### Issue 1: No Employees Found

**Symptoms:**
```
📊 TEST 1: CHECKING EMPLOYEES
✅ Total Employees Found: 0
⚠️  NO EMPLOYEES FOUND for this recruiter!
```

**Root Cause:** No employees exist for this recruiter ID

**Solution:**
1. Go to HRMS → Onboarding
2. Add employees
3. Make sure recruiterId matches: `7e0dd1ad-e456-444f-8992-5a66af451238`

---

### Issue 2: No Attendance for Today

**Symptoms:**
```
📊 TEST 2: CHECKING ATTENDANCE RECORDS FOR TODAY
✅ Total Attendance Records for 2026-05-15: 0
⚠️  NO ATTENDANCE RECORDS FOUND for today!

📊 TEST 3: CHECKING ALL ATTENDANCE RECORDS
✅ Total Attendance Records (All Dates): 41
📅 2026-05-14: 41 records  ← Records exist but for wrong date!
```

**Root Cause:** Records exist but for different date

**Possible Reasons:**
1. **Device clock wrong** - Device date set to 2026-05-14 instead of 2026-05-15
2. **Bridge syncing old records** - Bridge fetching yesterday's data
3. **Timezone issue** - Date conversion problem

**Solution:**
```bash
# Check device date/time
# Access device admin panel
# System → Date & Time
# Should show: 2026-05-15

# Clear device buffer
# Data Management → Clear Attendance Data

# Clear Bridge database
# Delete: C:\Users\[User]\AppData\Roaming\staffinn-attendance-bridge\attendance.db

# Restart Bridge
# Fresh punch should sync with correct date
```

---

### Issue 3: No Mappings Found

**Symptoms:**
```
📊 TEST 4: CHECKING EMPLOYEE-DEVICE MAPPINGS
✅ Total Mappings Found: 0
⚠️  NO MAPPINGS FOUND!
❌ CRITICAL ISSUE: Without mappings, Bridge cannot identify employees!
```

**Root Cause:** Employee-device mappings not configured

**Impact:** Bridge fetches device user IDs (e.g., 1001) but cannot map to employee IDs (e.g., EMP001)

**Solution:**
1. Go to HRMS → Device Setup → Employee Mapping
2. Create mappings:
   - Employee: EMP001 ↔ Device User ID: 1001
   - Employee: EMP002 ↔ Device User ID: 1002
3. Save mappings
4. Restart Bridge (it will load mappings on startup)

---

### Issue 4: Bridge Not Syncing

**Symptoms:**
```
📊 TEST 3: CHECKING ALL ATTENDANCE RECORDS
✅ Total Attendance Records (All Dates): 0
⚠️  NO ATTENDANCE RECORDS FOUND AT ALL!
```

**Root Cause:** Bridge has never synced any data

**Possible Reasons:**
1. Bridge not running
2. Bridge cannot connect to device
3. Bridge authentication failing
4. No mappings configured
5. Device has no logs

**Solution:**

**Check Bridge Status:**
```
1. Open Bridge software
2. Check console logs
3. Look for:
   "✅ WebSocket connected"
   "📥 Loaded X employee mappings"
   "✅ Auto-sync started"
```

**Check Bridge Logs:**
```
Look for errors:
"❌ Failed to connect to device"
"❌ Authentication failed"
"⚠️ No mapping found for device user ID: 1001"
```

**Fix Steps:**
```
1. Verify device IP/port in Bridge config
2. Verify company ID and API key
3. Create employee-device mappings
4. Restart Bridge
5. Test with fresh punch
```

---

### Issue 5: Frontend Shows Empty Table

**Symptoms:**
- Database has records for 2026-05-15
- API returns records
- But frontend shows empty table

**Root Cause:** Frontend issue

**Possible Reasons:**
1. **Date filter wrong** - Frontend querying different date
2. **Authentication issue** - Token expired
3. **WebSocket not connected** - No real-time updates
4. **JavaScript error** - Check console

**Solution:**

**Check Browser Console:**
```javascript
// Look for errors
// Check WebSocket status
// Check API responses in Network tab
```

**Check Date Filter:**
```javascript
// In browser console
console.log(document.querySelector('input[type="date"]')?.value)
// Should be: "2026-05-15"
```

**Force Refresh:**
```javascript
// In browser console
window.location.reload()
```

---

## 📋 DEBUGGING CHECKLIST

Run through this checklist in order:

```
□ Step 1: Run Database Test
  node test-attendance-system.js
  
  □ Employees found? (If NO → Add employees)
  □ Attendance for today found? (If NO → Check device date)
  □ Mappings found? (If NO → Create mappings)
  □ Company config found? (If NO → Register company)

□ Step 2: Run API Test
  HRMS_TOKEN=xxx node test-attendance-apis.js
  
  □ Backend health OK?
  □ Stats API working?
  □ Attendance API returning data?
  □ Mappings API working?
  □ Device status showing connected?

□ Step 3: Check Bridge Software
  □ Bridge running?
  □ Console shows "WebSocket connected"?
  □ Console shows "Loaded X mappings"?
  □ Console shows "Auto-sync started"?
  □ "Today's Count" increasing?

□ Step 4: Check Device
  □ Device powered on?
  □ Device date/time correct?
  □ Device has attendance logs?
  □ Bridge can connect to device IP?

□ Step 5: Check Frontend
  □ Browser console no errors?
  □ WebSocket connected?
  □ Date filter set to 2026-05-15?
  □ Network tab shows API calls?
  □ API responses have data?

□ Step 6: Test Fresh Punch
  □ Clear device logs
  □ Clear Bridge database
  □ Restart Bridge
  □ Employee scans fingerprint
  □ Check Bridge console (should show sync)
  □ Check HRMS (should appear within 10 seconds)
```

---

## 🎯 MOST LIKELY ROOT CAUSES

Based on the symptom "Today's Count: 41 but frontend shows nothing":

### Scenario A: Wrong Date in Records (90% probability)

```
Device date: 2026-05-14 (yesterday)
Records saved with: date = "2026-05-14"
Frontend queries: date = "2026-05-15" (today)
Result: No match → Empty table
```

**Verify:**
```bash
aws dynamodb scan \
  --table-name staffinn-hrms-attendance \
  --filter-expression "recruiterId = :rid" \
  --expression-attribute-values '{":rid":{"S":"7e0dd1ad-e456-444f-8992-5a66af451238"}}' \
  --region ap-south-1 \
  --output json | jq '.Items | group_by(.date) | map({date: .[0].date, count: length})'
```

**If shows:**
```json
[
  {"date": "2026-05-14", "count": 41}
]
```

**Then:** Device clock is wrong. Fix device date to 2026-05-15.

---

### Scenario B: No Mappings (5% probability)

```
Bridge fetches: deviceUserId = "1001"
Bridge looks up mapping: Not found
Bridge skips record or sends with wrong ID
Backend rejects or saves with wrong ID
Frontend doesn't show it
```

**Verify:**
```bash
node test-attendance-system.js
# Look for: "Total Mappings Found: 0"
```

**If 0:** Create mappings in HRMS.

---

### Scenario C: No Employees (3% probability)

```
Attendance records exist
But no employees in database
Frontend cannot display records without employee data
```

**Verify:**
```bash
node test-attendance-system.js
# Look for: "Total Employees Found: 0"
```

**If 0:** Add employees in HRMS.

---

### Scenario D: Frontend Issue (2% probability)

```
Database has records
API returns records
But frontend not rendering
```

**Verify:**
```
Open browser DevTools
Check Console for errors
Check Network tab for API responses
```

---

## 🚀 QUICK FIX STEPS

### If Device Date is Wrong:

```
1. Access device admin panel
2. System → Date & Time
3. Set date to: 2026-05-15
4. Set time to: Current time
5. Save and restart device
6. Clear device attendance logs
7. Clear Bridge database
8. Restart Bridge
9. Test fresh punch
```

### If No Mappings:

```
1. Go to HRMS → Device Setup
2. Click "Employee Mapping"
3. For each employee:
   - Select employee (e.g., EMP001)
   - Enter device user ID (e.g., 1001)
   - Click "Create Mapping"
4. Restart Bridge
5. Test fresh punch
```

### If No Employees:

```
1. Go to HRMS → Onboarding
2. Add employee:
   - Employee ID: EMP001
   - Name: Test Employee
   - Department: IT
   - Shift: 09:00 - 18:00
3. Save employee
4. Create mapping (see above)
5. Test fresh punch
```

---

## 📞 SUPPORT COMMANDS

### Get All Info at Once:

```bash
# Run both tests
node test-attendance-system.js > test-results.txt 2>&1
HRMS_TOKEN=xxx node test-attendance-apis.js >> test-results.txt 2>&1

# View results
cat test-results.txt
```

### Share Results:

```bash
# Copy results to clipboard (Windows)
type test-results.txt | clip

# Or upload to pastebin
curl -X POST -d "content=$(cat test-results.txt)" https://pastebin.com/api/api_post.php
```

---

## ✅ SUCCESS CRITERIA

After fixing, you should see:

**Database Test:**
```
✅ Total Employees Found: 5
✅ Total Attendance Records for 2026-05-15: 10
✅ Total Mappings Found: 5
```

**API Test:**
```
✅ Backend is UP and running
✅ Stats API working
✅ Attendance API working - Records found: 10
✅ Mappings API working - Total Mappings: 5
✅ Device Status: Connected
```

**Frontend:**
```
- Attendance table shows 10 records
- Real-time updates working
- No console errors
```

**Bridge:**
```
✅ WebSocket connected
📥 Loaded 5 employee mappings
✅ Auto-sync started (every 10 seconds)
📊 Fetched 1 NEW records from device
✅ Record synced successfully
```

---

**Generated:** ${new Date().toISOString()}  
**Status:** Ready for Testing  
**Next Step:** Run `node test-attendance-system.js`
