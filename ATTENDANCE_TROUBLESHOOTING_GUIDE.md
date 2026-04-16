# ATTENDANCE SYSTEM - TROUBLESHOOTING GUIDE
## For Support Team & Developers

---

## 🆘 QUICK DIAGNOSIS

### Is the system working?
Run this 30-second check:

1. ✅ Bridge software shows "Connected" (green status)?
2. ✅ Device beeping every 15 seconds?
3. ✅ Backend server running?
4. ✅ Employee punches → appears in HRMS within 30 seconds?

**If all YES:** ✅ System working correctly  
**If any NO:** 👇 See troubleshooting below

---

## 🔴 COMMON ISSUES & SOLUTIONS

### Issue 1: Attendance Not Appearing

**Symptoms:**
- Employee punches device
- Wait 1+ minute
- No record in HRMS

**Diagnosis Steps:**

1. **Check Bridge Connection**
   ```
   Open Bridge Software
   Look at top-right corner
   Should show: "Device Status: ● Online"
   ```
   - ✅ Green = Connected
   - ❌ Red = Disconnected

2. **Check Bridge Console**
   ```
   Press F12 in Bridge app
   Go to Console tab
   Look for errors
   ```
   
   **Good Output:**
   ```
   🔄 Starting sync...
   📊 Fetched 1 NEW records from device
   ✅ Record synced successfully
   ```
   
   **Bad Output:**
   ```
   ❌ Failed to connect to device
   ❌ API Error: 401 Unauthorized
   ❌ Employee not found
   ```

3. **Check Backend Logs**
   ```
   Open backend console
   Look for recent logs
   ```
   
   **Good Output:**
   ```
   ✅ Bridge request authenticated
   ✅ Check-in recorded for employee 1001
   ```
   
   **Bad Output:**
   ```
   ❌ Company not found
   ❌ Invalid API key
   ❌ Employee not found
   ```

**Solutions:**

| Problem | Solution |
|---------|----------|
| Bridge disconnected | Click "Connect Device" button |
| Device offline | Check device power and network |
| API authentication failed | Re-enter Company ID and API Key |
| Employee not found | Verify employee exists in HRMS |
| Backend server down | Restart backend server |
| Network issue | Check internet connectivity |

---

### Issue 2: Check-Out Not Working

**Symptoms:**
- First punch creates check-in ✅
- Second punch does NOT create check-out ❌
- Hours remain 0

**Diagnosis Steps:**

1. **Check Time Between Punches**
   ```
   First punch:  09:00:00
   Second punch: 09:00:30  ← Too soon! (< 1 minute)
   ```
   
   **Requirement:** At least 1 minute between punches

2. **Check Backend Logs**
   ```
   Look for:
   "Ignoring duplicate punch within 1 minute"
   ```
   
   If you see this → Second punch was too soon

3. **Check Existing Record**
   ```
   Open HRMS → Attendance Management
   Find employee's record for today
   Check if check-out already exists
   ```

**Solutions:**

| Problem | Solution |
|---------|----------|
| Punches too close (<1 min) | Wait at least 1 minute, punch again |
| Already checked out | This is correct behavior (third punch ignored) |
| Backend not updated | Verify backend code is latest version |
| Database issue | Check DynamoDB connectivity |

---

### Issue 3: Third Punch Creates New Entry

**Symptoms:**
- Employee has 2+ attendance records for same day
- Multiple check-ins showing

**This should NOT happen with new fix!**

**Diagnosis:**

1. **Check Backend Version**
   ```
   Open: Backend/controllers/hrms/hrmsAttendanceController.js
   Look for: "Ignoring third punch - already checked out"
   ```
   
   If not found → Backend not updated

2. **Check Backend Logs**
   ```
   Should see:
   "⚠️ Ignoring third punch for employee 1001 - already checked out"
   ```
   
   If not seeing this → Logic not working

**Solutions:**

| Problem | Solution |
|---------|----------|
| Backend not updated | Redeploy backend with new code |
| Server not restarted | Restart backend server |
| Old code cached | Clear node_modules, reinstall |

---

### Issue 4: Sync Still Slow (>1 minute)

**Symptoms:**
- Attendance taking 1+ minute to appear
- Should be 15-20 seconds

**Diagnosis:**

1. **Check Bridge Console**
   ```
   Look for:
   "📊 Fetched 112 records from device"  ← BAD (old code)
   "📊 Fetched 1 NEW records from device" ← GOOD (new code)
   ```

2. **Check Sync Interval**
   ```
   Should see:
   "✅ Auto-sync started (every 15 seconds)"
   ```

**Solutions:**

| Problem | Solution |
|---------|----------|
| Fetching 100+ records | Bridge not updated, rebuild C# service |
| Sync interval wrong | Update syncService.js, restart Bridge |
| Network slow | Check internet speed, reduce batch size |
| Backend slow | Check DynamoDB performance |

---

### Issue 5: Duplicate Entries

**Symptoms:**
- Same employee has multiple records for same time
- Database has duplicate attendance

**Diagnosis:**

1. **Check Time Difference**
   ```
   Record 1: 09:00:00
   Record 2: 09:00:30  ← Within 1 minute
   ```
   
   Should be prevented by backend logic

2. **Check Backend Logs**
   ```
   Should see:
   "⚠️ Ignoring duplicate punch within 1 minute"
   ```

**Solutions:**

| Problem | Solution |
|---------|----------|
| Backend logic not working | Verify backend code updated |
| Race condition | Increase sync interval to 20 seconds |
| Database issue | Manually delete duplicate records |

---

### Issue 6: Bridge Software Won't Connect

**Symptoms:**
- Click "Connect Device"
- Shows error or stays disconnected

**Diagnosis:**

1. **Check Device IP/Port**
   ```
   Common IPs:
   - 192.168.1.224:5005
   - 192.168.0.224:5005
   - 192.168.1.24:5005
   ```

2. **Test Network Connection**
   ```
   Open Command Prompt
   ping 192.168.1.224
   
   Should see:
   Reply from 192.168.1.224: bytes=32 time<1ms TTL=64
   ```

3. **Check Bridge Service**
   ```
   Open Task Manager
   Look for: NewBridgeService.exe
   Should be running on port 3002
   ```

**Solutions:**

| Problem | Solution |
|---------|----------|
| Wrong IP address | Use "Auto-Detect Device" button |
| Device offline | Check device power and network cable |
| Firewall blocking | Allow port 3002 and 5005 in firewall |
| Bridge service not running | Restart Bridge software |
| DLL files missing | Reinstall Bridge software |

---

### Issue 7: "Employee Not Found" Error

**Symptoms:**
- Bridge shows: "❌ Failed to sync record: Employee not found"
- Backend logs: "404 Employee not found"

**Diagnosis:**

1. **Check Employee Exists**
   ```
   Open HRMS → Onboarding
   Search for employee ID
   Verify employee is active
   ```

2. **Check Employee ID Match**
   ```
   Device shows: Employee 1001
   HRMS shows: Employee ID = 1001
   Must match exactly!
   ```

**Solutions:**

| Problem | Solution |
|---------|----------|
| Employee not onboarded | Add employee in HRMS Onboarding |
| Employee ID mismatch | Update employee ID in device or HRMS |
| Employee inactive | Activate employee in HRMS |
| Wrong company | Verify Bridge connected to correct company |

---

### Issue 8: Hours Calculation Wrong

**Symptoms:**
- Check-in: 09:00
- Check-out: 18:00
- Hours showing: 0 or wrong number

**Diagnosis:**

1. **Check Backend Calculation**
   ```
   Backend logs should show:
   "✅ Check-out recorded: 09:00 → 18:00 (9.0 hours)"
   ```

2. **Check Time Format**
   ```
   Should be: HH:MM (24-hour format)
   Not: 9:00 AM or 6:00 PM
   ```

**Solutions:**

| Problem | Solution |
|---------|----------|
| Calculation not triggered | Verify check-out was recorded |
| Time format wrong | Backend converts automatically |
| Database not updated | Check DynamoDB record directly |

---

## 🔍 DEBUGGING TOOLS

### 1. Bridge Debug Console

Open Bridge app, press F12, go to Console:

```javascript
// Get current data from device
BridgeDebug.fetchRaw()

// Test connection
BridgeDebug.testConnection()

// Get pending records
BridgeDebug.getPending()

// Start real-time monitoring
BridgeDebug.startMonitoring()

// Stop monitoring
BridgeDebug.stopMonitoring()

// Show help
BridgeDebug.help()
```

### 2. Backend API Test

Test API directly:

```bash
curl -X POST https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance \
  -H "x-company-id: YOUR_COMPANY_ID" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "1001",
    "checkIn": "14:30",
    "date": "2026-04-03",
    "source": "biometric"
  }'
```

### 3. Database Query

Check DynamoDB directly:

```javascript
// In AWS Console → DynamoDB → staffinn-hrms-attendance
// Filter by:
employeeId = "1001"
date = "2026-04-03"
```

---

## 📋 SUPPORT CHECKLIST

When user reports issue, go through this checklist:

### Step 1: Gather Information
- [ ] What is the employee ID?
- [ ] What time did they punch?
- [ ] Is this check-in or check-out?
- [ ] What error message (if any)?
- [ ] Screenshot of HRMS page?

### Step 2: Check System Status
- [ ] Bridge software connected?
- [ ] Device beeping regularly?
- [ ] Backend server running?
- [ ] Internet connectivity OK?

### Step 3: Check Logs
- [ ] Bridge console logs?
- [ ] Backend server logs?
- [ ] Any error messages?

### Step 4: Verify Data
- [ ] Employee exists in HRMS?
- [ ] Employee ID matches device?
- [ ] Company ID correct?
- [ ] API key valid?

### Step 5: Test & Verify
- [ ] Try manual punch
- [ ] Check if appears in HRMS
- [ ] Verify timing (within 30 seconds)
- [ ] Confirm issue resolved

---

## 🚨 ESCALATION MATRIX

### Level 1: Support Team (First Response)
**Handle:**
- Connection issues
- Employee not found
- Basic troubleshooting
- User training

**Escalate if:**
- System-wide issue
- Backend errors
- Database problems
- Code bugs

### Level 2: Technical Team (Advanced Support)
**Handle:**
- Backend debugging
- Database queries
- API issues
- Configuration problems

**Escalate if:**
- Code changes needed
- Architecture issues
- Security concerns
- Critical bugs

### Level 3: Development Team (Critical Issues)
**Handle:**
- Code fixes
- System updates
- Architecture changes
- Critical bugs

---

## 📞 EMERGENCY PROCEDURES

### System Down (Critical)

1. **Immediate Actions (5 minutes)**
   - Check backend server status
   - Check database connectivity
   - Check network status
   - Notify technical team

2. **Diagnosis (15 minutes)**
   - Review error logs
   - Identify root cause
   - Estimate fix time
   - Notify stakeholders

3. **Resolution (30 minutes)**
   - Apply fix or rollback
   - Test functionality
   - Monitor for 1 hour
   - Update stakeholders

### Data Loss (High Priority)

1. **Stop All Operations**
   - Pause Bridge software
   - Prevent new data
   - Preserve current state

2. **Assess Damage**
   - How many records affected?
   - Time period affected?
   - Can data be recovered?

3. **Recovery**
   - Restore from backup
   - Manual data entry if needed
   - Verify data integrity
   - Resume operations

---

## 📚 REFERENCE LINKS

- **Full Documentation:** `ATTENDANCE_REALTIME_FIX.md`
- **Testing Guide:** `ATTENDANCE_TESTING_GUIDE.md`
- **Quick Reference:** `ATTENDANCE_QUICK_REFERENCE.md`
- **Flow Diagram:** `ATTENDANCE_FLOW_DIAGRAM.md`

---

## 💡 TIPS & TRICKS

### For Support Team

1. **Always check Bridge console first** - Most issues visible here
2. **Ask for screenshots** - Visual confirmation helps
3. **Test with known employee** - Verify system working
4. **Check timing** - Many issues are timing-related
5. **Document everything** - Helps identify patterns

### For Users

1. **Punch once when arriving** - Don't punch multiple times
2. **Punch once when leaving** - Second punch is check-out
3. **Wait 1 minute between punches** - Prevents duplicates
4. **Check HRMS after 30 seconds** - Give system time to sync
5. **Report issues immediately** - Faster resolution

---

## ✅ VERIFICATION AFTER FIX

After resolving any issue, verify:

1. ✅ Employee can punch successfully
2. ✅ Attendance appears within 30 seconds
3. ✅ Check-in recorded correctly
4. ✅ Check-out works on second punch
5. ✅ Hours calculated correctly
6. ✅ No duplicate entries
7. ✅ Bridge console shows no errors
8. ✅ Backend logs show success
9. ✅ User satisfied with resolution
10. ✅ Issue documented for future reference

---

**Remember: Most issues are simple - connection, timing, or configuration!**

**When in doubt, restart Bridge software and try again! 🔄**
