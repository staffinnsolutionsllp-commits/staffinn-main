# Quick Fix: Claim Categories Not Showing to Employees

## Problem
Employees can't see claim categories that admin added in HRMS.

## Quick Fix (3 Steps)

### Step 1: Fix Data (Run in Backend folder)
```bash
cd Backend
node fix-employee-company-ids.js
```

### Step 2: Restart Backend
```bash
# Press Ctrl+C to stop
npm start
```

### Step 3: Restart Employee Portal
```bash
cd EmployeePortal
# Press Ctrl+C to stop
npm run dev
```

## Test
1. Login as employee
2. Go to Claims
3. Click "Submit New Claim"
4. Check Category dropdown - categories should now appear

## What Was Fixed

### Backend Changes:
- ✅ Fixed `employeePortalController.js` - Added better logging
- ✅ Created `fix-employee-company-ids.js` - Fixes data mismatches

### Frontend Changes:
- ✅ Fixed API endpoints in `Claims.jsx`
  - Changed `/employee-portal/claims` → `/employee/claims`
  - Changed `/employee-portal/claims/categories` → `/employee/claims/categories`
- ✅ Added helpful error messages
- ✅ Added "No categories" message

## Why It Wasn't Working

The employee's `companyId` didn't match the category's `recruiterId`. The fix script corrects this automatically.

## Verify Fix Worked

### Check Backend Logs:
```
=== GET CLAIM CATEGORIES DEBUG ===
Employee ID: EMP001
Company ID (recruiterId): REC_123456
✅ Found 3 categories for companyId: REC_123456
```

### Check Browser Console:
```
Fetching claim categories...
Received 3 categories: [...]
```

## If Still Not Working

Run debug script to see what's wrong:
```bash
cd Backend
node debug-claim-categories.js
```

This shows:
- All categories and their recruiterId
- All employees and their companyId
- Which employees should see which categories

## Need More Help?

See detailed guide: `CLAIM_CATEGORIES_VISIBILITY_FIX.md`
