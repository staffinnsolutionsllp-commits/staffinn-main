# 🔧 FIX: ATTENDANCE NOT SYNCING - SOLUTION

## ❌ PROBLEM IDENTIFIED

Your attendance is not syncing because:

1. **Missing Table:** `staffinn-hrms-companies` table doesn't exist
2. **Missing Record:** No company record linking Company ID → API Key → Recruiter ID
3. **Bridge Can't Authenticate:** Backend rejects all Bridge requests

---

## ✅ SOLUTION: 3-STEP FIX

### STEP 1: Find Your Recruiter ID

**Option A: From Browser Console**
1. Open HRMS in browser
2. Press `F12` to open DevTools
3. Go to Console tab
4. Type: `localStorage.getItem('hrms_user')`
5. Press Enter
6. Look for `"recruiterId"` in the output
7. Copy the value (e.g., `"REC123"`)

**Option B: From DynamoDB**
1. Open AWS Console → DynamoDB
2. Go to `staffinn-hrms-recruiters` table
3. Click "Explore table items"
4. Find your recruiter record
5. Copy the `recruiterId` value

---

### STEP 2: Run Setup Script

Open terminal in Backend folder:

```bash
cd d:\Staffinn-main\Backend

# Replace REC123 with your actual Recruiter ID
node scripts/setup-company-for-bridge.js REC123 "My Company Name"
```

**Example:**
```bash
node scripts/setup-company-for-bridge.js REC-1234567890 "Tech Corp"
```

**Expected Output:**
```
🚀 HRMS Bridge Setup - Company Configuration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Creating staffinn-hrms-companies table...
✅ Companies table created

📝 Creating company record...
✅ Company record created

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SETUP COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 BRIDGE SOFTWARE CREDENTIALS:

   Company ID: COMP-1234567890-ABC123XYZ
   API Key:    a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
   Recruiter:  REC-1234567890
   Company:    Tech Corp

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT: Copy these credentials!
```

**⚠️ SAVE THESE CREDENTIALS!** You'll need them for Bridge Software.

---

### STEP 3: Configure Bridge Software

1. **Open Bridge Software**
2. **Enter Credentials:**
   - Company ID: `COMP-1234567890-ABC123XYZ` (from Step 2 output)
   - API Key: `a1b2c3d4e5f6...` (from Step 2 output)
3. **Connect Device:**
   - Device IP: `192.168.1.24`
   - Port: `5005`
4. **Click "Connect"**

---

## 🧪 TEST THE FIX

### Test 1: Backend Validation

**Check if company record exists:**

```bash
# Open AWS Console → DynamoDB
# Go to staffinn-hrms-companies table
# You should see your company record with:
# - companyId
# - apiKey
# - recruiterId
```

---

### Test 2: Bridge Authentication

**Start Bridge Software and check logs:**

```
✅ Bridge Software Started
✅ Connecting to backend...
✅ Authentication successful
✅ WebSocket connected
✅ Loading employee mappings...
ℹ️  No mappings configured - using direct ID matching
✅ Device connected: 192.168.1.24
✅ Monitoring device for punches...
```

**If you see:**
```
❌ Authentication failed: Company not found
```
→ Run setup script again with correct Recruiter ID

**If you see:**
```
❌ Authentication failed: Invalid API key
```
→ Company ID or API Key is wrong in Bridge config

---

### Test 3: Attendance Punch

**Scan fingerprint on device:**

**Expected Bridge Logs:**
```
✅ Punch detected: deviceUserId=1001, timestamp=2024-01-20T09:15:30
ℹ️  No mapping - using direct ID: 1001
Syncing: Employee 1001 at 2024-01-20T09:15:30
🔍 Sending to API: https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance
📦 Payload: {"employeeId":"1001","checkIn":"09:15","date":"2024-01-20","source":"biometric"}
🔑 Headers: {"x-company-id":"COMP-...","x-api-key":"***"}
✅ API Response: {"success":true,"data":{...}}
✅ Record synced successfully
```

**Expected Backend Logs:**
```
✅ Bridge request authenticated: Company COMP-... → Recruiter REC-...
Mark attendance request: { employeeId: '1001', checkIn: '09:15', date: '2024-01-20' }
✅ Attendance marked successfully
📡 WebSocket broadcast sent to recruiter REC-...
```

**Expected HRMS:**
- Table refreshes automatically
- Shows: `1001 | 09:15 | - | - | late`

---

## 🔍 TROUBLESHOOTING

### Issue 1: "Recruiter ID not found"

**Error:**
```
❌ Error: Recruiter ID is required!
```

**Solution:**
1. Log in to HRMS
2. Open browser console (F12)
3. Type: `JSON.parse(localStorage.getItem('hrms_user')).recruiterId`
4. Copy the value
5. Run script again with this value

---

### Issue 2: "Table already exists"

**Message:**
```
ℹ️  Companies table already exists
```

**This is OK!** The script will skip table creation and just create the company record.

---

### Issue 3: "Employee not found"

**Bridge Logs:**
```
❌ API Error: 404 Employee not found
```

**Solution:**
1. Check employee exists in HRMS with ID "1001"
2. Make sure employee belongs to the same recruiter
3. Check DynamoDB `staffinn-hrms-employees` table

---

### Issue 4: "Company not linked to recruiter"

**Backend Logs:**
```
⚠️ Company missing recruiterId
```

**Solution:**
1. Delete the company record from DynamoDB
2. Run setup script again with correct Recruiter ID

---

## 📊 COMPLETE FLOW AFTER FIX

```
Employee scans fingerprint
↓
Device: deviceUserId = "1001"
↓
Bridge Software:
- Uses "1001" directly (no mapping)
- Sends to: POST /api/hrms/attendance/bridge-attendance
- Headers: x-company-id, x-api-key
↓
Backend:
- Validates Company ID + API Key ✅
- Gets recruiterId from company record ✅
- Finds employee "1001" ✅
- Creates attendance record ✅
- Broadcasts via WebSocket ✅
↓
HRMS Frontend:
- Receives WebSocket event ✅
- Refreshes table ✅
- Shows: 1001 | 09:15 | - | - | late ✅
```

---

## ✅ VERIFICATION CHECKLIST

After running the setup script:

- [ ] Company record created in DynamoDB
- [ ] Company ID and API Key generated
- [ ] Company linked to Recruiter ID
- [ ] Bridge Software configured with credentials
- [ ] Bridge authenticates successfully
- [ ] Device connected to Bridge
- [ ] Fingerprint punch detected
- [ ] Attendance synced to backend
- [ ] HRMS table updated in real-time

---

## 🎯 SUMMARY

**Problem:** Missing company table and record
**Solution:** Run `setup-company-for-bridge.js` script
**Result:** Bridge can authenticate and sync attendance

**Run this command NOW:**
```bash
cd d:\Staffinn-main\Backend
node scripts/setup-company-for-bridge.js YOUR_RECRUITER_ID "Your Company Name"
```

Then test attendance punch! 🚀
