# ATTENDANCE SYSTEM TESTING GUIDE
## Real-Time Sync & Check-In/Check-Out Verification

---

## 🎯 TEST OBJECTIVES

1. Verify attendance appears within 15-20 seconds
2. Verify check-in/check-out logic works correctly
3. Verify third punch is ignored
4. Verify duplicate punch prevention
5. Verify multi-employee scenarios

---

## 📋 PRE-TEST CHECKLIST

- [ ] Bridge Service rebuilt and deployed
- [ ] Backend server restarted
- [ ] Bridge software installed on test PC
- [ ] Biometric device connected and powered on
- [ ] Test employees onboarded in HRMS (Employee IDs: 1001, 1002, 1003)
- [ ] HRMS attendance page open in browser

---

## 🧪 TEST CASES

### Test Case 1: Basic Check-In
**Objective:** Verify first punch creates check-in record

**Steps:**
1. Open HRMS → Attendance Management
2. Note current time
3. Employee 1001 punches biometric device
4. Wait 20 seconds
5. Refresh attendance page

**Expected Result:**
```
Employee ID: 1001
Date: Today's date
Check-In: [Punch time]
Check-Out: -
Hours: 0
Status: Present/Late
```

**Pass Criteria:**
- ✅ Record appears within 20 seconds
- ✅ Check-in time matches punch time (±1 minute)
- ✅ Check-out is empty
- ✅ Hours is 0

---

### Test Case 2: Check-Out (Second Punch)
**Objective:** Verify second punch updates check-out time

**Steps:**
1. Wait at least 2 minutes after Test Case 1
2. Same employee (1001) punches device again
3. Wait 20 seconds
4. Refresh attendance page

**Expected Result:**
```
Employee ID: 1001
Date: Today's date
Check-In: [First punch time]
Check-Out: [Second punch time]
Hours: [Calculated hours, e.g., 0.03 for 2 minutes]
Status: Present/Late
```

**Pass Criteria:**
- ✅ Check-out time appears within 20 seconds
- ✅ Check-out time matches second punch (±1 minute)
- ✅ Hours calculated correctly
- ✅ Check-in time unchanged

---

### Test Case 3: Third Punch (Should Be Ignored)
**Objective:** Verify third punch does NOT create new entry

**Steps:**
1. Same employee (1001) punches device third time
2. Wait 20 seconds
3. Refresh attendance page
4. Check total number of records for employee 1001 today

**Expected Result:**
```
Employee ID: 1001
Date: Today's date
Check-In: [First punch time] ← UNCHANGED
Check-Out: [Second punch time] ← UNCHANGED
Hours: [Same as before] ← UNCHANGED
Status: Present/Late

Total records for 1001 today: 1 (not 2)
```

**Pass Criteria:**
- ✅ No new record created
- ✅ Existing record unchanged
- ✅ Only 1 attendance record for today

---

### Test Case 4: Duplicate Punch Prevention
**Objective:** Verify punches within 1 minute are ignored

**Steps:**
1. Employee 1002 punches device (Check-in)
2. Wait 30 seconds
3. Same employee punches again
4. Wait 20 seconds
5. Check attendance page

**Expected Result:**
```
Employee ID: 1002
Date: Today's date
Check-In: [First punch time]
Check-Out: - ← Empty (second punch ignored)
Hours: 0
```

**Pass Criteria:**
- ✅ Only first punch recorded
- ✅ Second punch (within 1 minute) ignored
- ✅ Check-out remains empty

---

### Test Case 5: Multiple Employees
**Objective:** Verify system handles multiple employees correctly

**Steps:**
1. Employee 1001 punches (Check-in)
2. Wait 10 seconds
3. Employee 1002 punches (Check-in)
4. Wait 10 seconds
5. Employee 1003 punches (Check-in)
6. Wait 30 seconds
7. Check attendance page

**Expected Result:**
```
Employee 1001: Check-In recorded, Check-Out empty
Employee 1002: Check-In recorded, Check-Out empty
Employee 1003: Check-In recorded, Check-Out empty

All 3 records visible within 1 minute
```

**Pass Criteria:**
- ✅ All 3 employees have separate records
- ✅ All check-ins recorded correctly
- ✅ No cross-contamination between employees

---

### Test Case 6: Check-Out for Multiple Employees
**Objective:** Verify check-out works independently for each employee

**Steps:**
1. After Test Case 5, wait 2 minutes
2. Employee 1003 punches (Check-out)
3. Wait 20 seconds
4. Employee 1001 punches (Check-out)
5. Wait 20 seconds
6. Employee 1002 punches (Check-out)
7. Wait 20 seconds
8. Check attendance page

**Expected Result:**
```
Employee 1001: Check-In + Check-Out + Hours calculated
Employee 1002: Check-In + Check-Out + Hours calculated
Employee 1003: Check-In + Check-Out + Hours calculated
```

**Pass Criteria:**
- ✅ All 3 employees have check-out times
- ✅ Hours calculated correctly for each
- ✅ No interference between employees

---

### Test Case 7: Real-Time Sync Speed
**Objective:** Measure actual sync delay

**Steps:**
1. Prepare stopwatch
2. Employee punches device
3. Start stopwatch immediately
4. Keep refreshing attendance page
5. Stop stopwatch when record appears

**Expected Result:**
- Record appears within 15-20 seconds

**Pass Criteria:**
- ✅ Sync time ≤ 25 seconds (acceptable)
- ✅ Sync time ≤ 20 seconds (good)
- ✅ Sync time ≤ 15 seconds (excellent)

---

### Test Case 8: Bridge Console Verification
**Objective:** Verify Bridge software logs are correct

**Steps:**
1. Open Bridge software
2. Open DevTools (F12)
3. Go to Console tab
4. Employee punches device
5. Watch console logs

**Expected Console Output:**
```
🔄 Starting sync...
📊 Fetched 1 NEW records from device
💾 Saving records to local database...
📤 Total pending: 1 records
📤 Syncing batch of 1 records...
Syncing: Employee 1001 at 2026-04-03 14:30:00
✅ Record synced successfully
✅ Sync completed
```

**Pass Criteria:**
- ✅ "NEW records" count is correct (not 100+)
- ✅ "Syncing batch" shows small number
- ✅ "Record synced successfully" appears
- ✅ No error messages

---

### Test Case 9: Backend Logs Verification
**Objective:** Verify backend processes requests correctly

**Steps:**
1. Open backend console/logs
2. Employee punches device (check-in)
3. Wait 20 seconds
4. Check backend logs
5. Same employee punches again (check-out)
6. Wait 20 seconds
7. Check backend logs again

**Expected Backend Logs:**
```
✅ Bridge request authenticated: Company abc123 → Recruiter xyz789
Mark attendance request: { employeeId: '1001', checkIn: '14:30', ... }
Processing attendance for date: 2026-04-03
✅ Check-in recorded for employee 1001: 14:30

[After second punch]
✅ Check-out recorded for employee 1001: 14:30 → 18:45 (4.25 hours)
```

**Pass Criteria:**
- ✅ Authentication successful
- ✅ Check-in logged correctly
- ✅ Check-out logged with hours calculation
- ✅ No error messages

---

### Test Case 10: Stress Test
**Objective:** Verify system handles rapid punches

**Steps:**
1. 5 employees punch device rapidly (within 1 minute)
2. Wait 30 seconds
3. Check attendance page
4. Verify all 5 records present

**Expected Result:**
- All 5 employees have check-in records
- No missing records
- No duplicate records

**Pass Criteria:**
- ✅ All records synced within 1 minute
- ✅ No data loss
- ✅ No duplicates

---

## 📊 TEST RESULTS TEMPLATE

| Test Case | Status | Sync Time | Notes |
|-----------|--------|-----------|-------|
| TC1: Basic Check-In | ⬜ Pass / ⬜ Fail | ___ sec | |
| TC2: Check-Out | ⬜ Pass / ⬜ Fail | ___ sec | |
| TC3: Third Punch | ⬜ Pass / ⬜ Fail | ___ sec | |
| TC4: Duplicate Prevention | ⬜ Pass / ⬜ Fail | ___ sec | |
| TC5: Multiple Employees | ⬜ Pass / ⬜ Fail | ___ sec | |
| TC6: Multi Check-Out | ⬜ Pass / ⬜ Fail | ___ sec | |
| TC7: Sync Speed | ⬜ Pass / ⬜ Fail | ___ sec | |
| TC8: Bridge Console | ⬜ Pass / ⬜ Fail | N/A | |
| TC9: Backend Logs | ⬜ Pass / ⬜ Fail | N/A | |
| TC10: Stress Test | ⬜ Pass / ⬜ Fail | ___ sec | |

**Overall Result:** ⬜ PASS / ⬜ FAIL

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: Record not appearing after 30 seconds
**Check:**
1. Bridge software connected? (Green status)
2. Device beeping every 15 seconds?
3. Backend server running?
4. Network connectivity OK?

**Solution:**
- Restart Bridge software
- Reconnect device
- Check backend logs for errors

---

### Issue: Check-out not working
**Check:**
1. Is second punch at least 1 minute after first?
2. Did first punch create check-in record?
3. Backend logs showing "duplicate punch"?

**Solution:**
- Wait at least 1 minute between punches
- Verify employee exists in system
- Check backend version is updated

---

### Issue: Third punch creates new entry
**Check:**
1. Backend code updated?
2. Backend server restarted after update?

**Solution:**
- Redeploy backend with new code
- Restart backend server
- Clear browser cache

---

## ✅ ACCEPTANCE CRITERIA

System is considered **PRODUCTION READY** if:

1. ✅ 90%+ of punches sync within 20 seconds
2. ✅ Check-in/check-out logic works 100% correctly
3. ✅ Third punches ignored 100% of time
4. ✅ No duplicate entries created
5. ✅ Multiple employees work independently
6. ✅ Hours calculated correctly
7. ✅ Bridge console shows "NEW records" (not 100+)
8. ✅ Backend logs show correct flow
9. ✅ No data loss in stress test
10. ✅ System stable for 1+ hour continuous operation

---

## 📝 TEST REPORT TEMPLATE

```
ATTENDANCE SYSTEM TEST REPORT
Date: _______________
Tester: _______________
Environment: Production / Staging

SUMMARY:
- Total Test Cases: 10
- Passed: ___
- Failed: ___
- Pass Rate: ___%

PERFORMANCE:
- Average Sync Time: ___ seconds
- Max Sync Time: ___ seconds
- Min Sync Time: ___ seconds

ISSUES FOUND:
1. _______________
2. _______________
3. _______________

RECOMMENDATION:
⬜ APPROVE for production
⬜ REJECT - needs fixes

Signature: _______________
```

---

**Version:** 2.0  
**Last Updated:** April 2026  
**Status:** Ready for Testing
