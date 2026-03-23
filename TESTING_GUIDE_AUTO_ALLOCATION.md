# 🧪 TESTING GUIDE: Automatic Leave Allocation

## Current Status
- ✅ Auto-allocation code implemented in `createLeaveRule()`
- ✅ Employee Portal APIs fixed for 500 errors
- ⏳ Ready for testing

---

## 🎯 Test Scenario

**Current Situation:**
- 8 employees onboarded in HRMS
- Only 3 employees have leave balances
- 2 leave types exist: "maker leave" (5 days), "casual leave" (10 days)

**Expected After Fix:**
- When you create a NEW leave type
- ALL 8 employees should automatically get that leave balance
- Employee Portal should show the new leave type immediately

---

## 📋 Step-by-Step Testing

### Step 1: Check Current State

#### A. HRMS - Employee Onboarding
```
Navigate to: Employee Onboarding → Active Employees
Count: Should show 8 employees
- Priya Sharma (2002)
- Jasraj Bhavsar (1)
- Rajesh Kumar (2001)
- Sneha Reddy (2004)
- Amit Patel (2003)
- Vikram Singh (2005)
- Lakshya Sharma (1005)
- Atul (12)
```

#### B. HRMS - Leave Balance (Before)
```
Navigate to: Leave Management → Leave Balance
Current Count: 3 entries only
- Lakshya Sharma - maker leave (5 days)
- Jasraj Bhavsar - casual leave (10 days)
- Jasraj Bhavsar - maker leave (5 days)

❌ Problem: Missing 5 employees!
```

---

### Step 2: Create New Leave Type (This Will Trigger Auto-Allocation)

#### A. Open HRMS Leave Rules
```
Navigate to: Leave Management → Leave Rules
Click: + Add Leave Type
```

#### B. Fill Leave Type Details
```
Leave Name: "Test Auto Leave"
Short Code: "TAL"
Total Days: 12 days/year
Accrual Type: Yearly
Pro-rata Calculation: Yes
Carry Forward: No
CF Leave: No
Status: Active (default)
```

#### C. Click Save
```
Click: Save button
```

---

### Step 3: Check Backend Console Logs

**Expected Logs:**
```
🔍 createLeaveRule - Using recruiterId: <YOUR_RECRUITER_ID>
🚀 Auto-allocating leave type "Test Auto Leave" to all employees for recruiterId: <YOUR_RECRUITER_ID>
📊 Found 8 active employees
✅ Allocated 12 Test Auto Leave to Priya Sharma
✅ Allocated 12 Test Auto Leave to Jasraj Bhavsar
✅ Allocated 12 Test Auto Leave to Rajesh Kumar
✅ Allocated 12 Test Auto Leave to Sneha Reddy
✅ Allocated 12 Test Auto Leave to Amit Patel
✅ Allocated 12 Test Auto Leave to Vikram Singh
✅ Allocated 12 Test Auto Leave to Lakshya Sharma
✅ Allocated 12 Test Auto Leave to Atul
🎉 Auto-allocation complete: 8 new leave balances created
```

**If You See Different Numbers:**
- Check if some employees are marked as `isDeleted: true`
- Check if all employees have the same `recruiterId`

---

### Step 4: Verify HRMS Leave Balance

#### A. Refresh Leave Balance Page
```
Navigate to: Leave Management → Leave Balance
Refresh the page (F5)
```

#### B. Expected Result
```
Total Entries: 11 (3 old + 8 new)

New Entries (should appear):
- Priya Sharma - Test Auto Leave (12 days)
- Jasraj Bhavsar - Test Auto Leave (12 days)
- Rajesh Kumar - Test Auto Leave (12 days)
- Sneha Reddy - Test Auto Leave (12 days)
- Amit Patel - Test Auto Leave (12 days)
- Vikram Singh - Test Auto Leave (12 days)
- Lakshya Sharma - Test Auto Leave (12 days)
- Atul - Test Auto Leave (12 days)

Old Entries (should still exist):
- Lakshya Sharma - maker leave (5 days)
- Jasraj Bhavsar - casual leave (10 days)
- Jasraj Bhavsar - maker leave (5 days)
```

---

### Step 5: Test Employee Portal

#### A. Login to Employee Portal
```
URL: http://localhost:5177
Login as: Jasraj Bhavsar (or any employee)
```

#### B. Navigate to Leave Page
```
Click: Leave (in sidebar)
```

#### C. Check Backend Console
```
Expected Logs:
🔍 getLeaveTypes - employeeId: 1, companyId: <COMPANY_ID>
📋 Found leave rules: 3
✅ Leave types: ["maker leave", "casual leave", "Test Auto Leave"]

🔍 getLeaveBalance - employeeId: 1, companyId: <COMPANY_ID>
📊 Found balances: 3
```

#### D. Expected UI
```
Leave Balance Section:
- Should show 3 cards (if Jasraj has all 3 types)
- Card 1: maker leave - 5 days
- Card 2: casual leave - 10 days
- Card 3: Test Auto Leave - 12 days

Apply Leave Button:
- Should be enabled (not disabled)
- Click to open modal
- Dropdown should show all 3 leave types
```

---

## 🔧 Troubleshooting

### Problem 1: Backend Logs Show "Found 0 active employees"

**Cause:** recruiterId mismatch or employees marked as deleted

**Solution:**
```sql
-- Check employee records in DynamoDB
Table: staffinn-hrms-employees
Filter: recruiterId = <YOUR_RECRUITER_ID>
Check: isDeleted field should be false or not exist
```

---

### Problem 2: Auto-allocation Logs Not Appearing

**Cause:** createLeaveRule function not being called or error occurred

**Solution:**
1. Check if backend server is running
2. Check browser Network tab for API response
3. Look for error messages in backend console
4. Verify `autoAllocateLeaveToAllEmployees` function exists in controller

---

### Problem 3: Leave Balance Shows Old Count Only

**Cause:** Auto-allocation failed silently or database write issue

**Solution:**
1. Check backend logs for error messages
2. Manually trigger sync:
   ```
   Navigate to: Leave Management → Leave Balance
   Click: Manual Adjustment (or Sync button if available)
   ```
3. Check DynamoDB table directly:
   ```
   Table: staffinn-hrms-leaves
   Filter: entityType = "BALANCE"
   Count: Should match (employees × leave types)
   ```

---

### Problem 4: Employee Portal Shows 500 Error

**Cause:** Missing companyId in employee token or API error

**Solution:**
1. Check backend console for detailed error:
   ```
   🔍 getLeaveTypes - employeeId: X, companyId: undefined
   ❌ Get leave types error: <ERROR_MESSAGE>
   ```

2. If companyId is undefined:
   - Check employee login token generation
   - Verify `companyId` field is set during login
   - Code now auto-fetches recruiterId from employee record

3. If still failing:
   - Check employee record has `recruiterId` field
   - Verify employee exists in HRMS_EMPLOYEES_TABLE

---

### Problem 5: Employee Portal Shows "No Leave Balance Found"

**Possible Causes:**
1. Employee has no leave balances allocated
2. recruiterId mismatch between employee and leave balances
3. Leave balances exist but query is failing

**Solution:**
1. Check backend logs:
   ```
   🔍 getLeaveBalance - employeeId: X, companyId: Y
   📊 Found balances: 0
   ```

2. Manually check DynamoDB:
   ```
   Table: staffinn-hrms-leaves
   Filter: entityType = "BALANCE" AND employeeId = "X"
   Expected: Should return records
   ```

3. If no records found, manually sync:
   ```
   HRMS → Leave Balance → Manual Adjustment
   Or use Sync Leave Balances button
   ```

---

## 🎯 Success Criteria Checklist

- [ ] Backend logs show "Auto-allocation complete: 8 new leave balances created"
- [ ] HRMS Leave Balance shows 11 total entries (3 old + 8 new)
- [ ] All 8 employees have "Test Auto Leave" entry
- [ ] Employee Portal loads without 500 errors
- [ ] Employee Portal shows 3 leave balance cards
- [ ] Apply Leave dropdown shows all 3 leave types
- [ ] Can successfully apply leave with new type

---

## 📊 Database Verification Queries

### Check All Employees
```
Table: staffinn-hrms-employees
Filter: recruiterId = <YOUR_RECRUITER_ID> AND (isDeleted = false OR attribute_not_exists(isDeleted))
Expected Count: 8
```

### Check All Leave Rules
```
Table: staffinn-hrms-leaves
Filter: entityType = "RULE" AND recruiterId = <YOUR_RECRUITER_ID> AND status = "Active"
Expected Count: 3 (maker leave, casual leave, Test Auto Leave)
```

### Check All Leave Balances
```
Table: staffinn-hrms-leaves
Filter: entityType = "BALANCE"
Expected Count: 11 (or more if auto-allocation worked)
Group By: employeeId
Expected: Each employee should have multiple leave types
```

---

## 🚀 Next Steps After Successful Test

1. **Test with Existing Leave Types:**
   - The auto-allocation only works for NEW leave types
   - For existing leave types (maker leave, casual leave), use "Sync Leave Balances" button

2. **Sync Existing Leave Types:**
   ```
   Navigate to: Leave Management → Leave Balance
   Click: Manual Adjustment or Sync button
   This will allocate existing leave types to all employees
   ```

3. **Verify Complete System:**
   - All 8 employees should have all 3 leave types
   - Total balances: 8 employees × 3 leave types = 24 entries

---

## 📞 If Still Not Working

**Collect This Information:**
1. Backend console logs (full output)
2. Browser console errors (if any)
3. Network tab response for create leave rule API
4. Screenshot of Leave Balance page
5. Employee count from onboarding page
6. recruiterId being used

**Share with development team for debugging**

---

**Last Updated**: March 20, 2026
**Test Status**: ⏳ Ready for Testing
