# Claim Categories Visibility Fix Guide

## Problem
Claim categories added by recruiter/admin in HRMS Claim Management are not visible to employees in the Employee Portal, even though the employee belongs to the same HRMS.

## Root Cause
The issue occurs when the `companyId` field in the `staffinn-hrms-employee-users` table doesn't match the `recruiterId` field used when creating claim categories. This mismatch prevents the filter from working correctly.

## Solution Overview
1. Fixed API endpoint paths in Employee Portal
2. Added better error handling and logging
3. Created scripts to debug and fix data inconsistencies
4. Enhanced user feedback when no categories are available

## Files Modified

### Backend Files
1. **Backend/controllers/hrms/employeePortalController.js**
   - Enhanced `getClaimCategories()` with better logging
   - Enhanced `getMyClaims()` with better logging
   - Added validation for companyId

### Frontend Files
2. **EmployeePortal/src/pages/Claims.jsx**
   - Fixed API endpoint from `/employee-portal/claims` to `/employee/claims`
   - Fixed API endpoint from `/employee-portal/claims/categories` to `/employee/claims/categories`
   - Added comprehensive error logging
   - Added user-friendly message when no categories are available

### Debug/Fix Scripts
3. **Backend/debug-claim-categories.js**
   - Script to debug and identify mismatches between employee companyId and claim category recruiterId

4. **Backend/fix-employee-company-ids.js**
   - Script to automatically fix employee user companyId values to match their recruiterId

## Step-by-Step Fix Instructions

### Step 1: Run Debug Script
First, identify if there are any data inconsistencies:

```bash
cd Backend
node debug-claim-categories.js
```

This will show:
- All claim categories and their recruiterId
- All employee users and their companyId
- Which employees should see which categories
- Any mismatches

### Step 2: Fix Data Inconsistencies (if any)
If the debug script shows mismatches, run the fix script:

```bash
node fix-employee-company-ids.js
```

This will:
- Match employee users with their main employee records
- Update companyId to match recruiterId
- Show a summary of fixes applied

### Step 3: Restart Backend Server
After fixing data, restart the backend:

```bash
# Stop the server (Ctrl+C if running)
# Then start it again
npm start
```

### Step 4: Clear Frontend Cache and Restart
In the Employee Portal:

```bash
cd EmployeePortal
# Clear browser cache or use incognito mode
npm run dev
```

### Step 5: Test the Fix

#### As Admin/Recruiter:
1. Login to HRMS Admin Panel
2. Go to Claim Management
3. Add a new claim category (e.g., "Travel Allowance")
4. Note the recruiterId from your profile

#### As Employee:
1. Login to Employee Portal
2. Go to Claims section
3. Click "Submit New Claim"
4. Check the Category dropdown
5. You should now see the categories added by your admin

## Verification Checklist

- [ ] Debug script shows matching companyId and recruiterId
- [ ] Employee can see claim categories in dropdown
- [ ] Employee can submit a claim with a category
- [ ] Submitted claim appears in the claims list
- [ ] Console logs show correct data being fetched
- [ ] No errors in browser console
- [ ] No errors in backend logs

## Expected Behavior

### When Categories Exist:
- Employee sees all categories in dropdown
- Can select and submit claims
- Claims appear in the list with correct category

### When No Categories Exist:
- Employee sees message: "No claim categories found. Please contact your HR admin to add claim categories."
- Submit button is still available but category field shows helpful message

## Console Logs to Check

### Backend Logs (when employee fetches categories):
```
=== GET CLAIM CATEGORIES DEBUG ===
Employee ID: EMP001
Employee Email: employee@example.com
Company ID (recruiterId): REC_123456
✅ Found 3 categories for companyId: REC_123456
Categories: [ { name: 'Travel', id: 'CAT_001' }, ... ]
```

### Frontend Logs (in browser console):
```
Fetching claim categories...
Categories response: { success: true, data: [...] }
Received 3 categories: [...]
```

## Troubleshooting

### Issue: Still no categories showing
**Check:**
1. Employee's companyId matches category's recruiterId
2. Categories have entityType = 'CATEGORY'
3. Employee token is valid and contains companyId
4. API endpoint is correct (/employee/claims/categories)

**Solution:**
```bash
# Re-run debug script
node debug-claim-categories.js

# Check if employee user exists
# Check if categories exist for that recruiterId
```

### Issue: 401 Unauthorized error
**Check:**
1. Employee is logged in
2. Token is stored in localStorage
3. Token is not expired

**Solution:**
- Logout and login again
- Check browser console for token

### Issue: Empty companyId in logs
**Check:**
1. Employee user record has companyId field
2. JWT token includes companyId

**Solution:**
```bash
# Run fix script
node fix-employee-company-ids.js
```

## Data Structure Reference

### Claim Category Structure:
```javascript
{
  claimmanagement: "CATEGORY#CAT_123",
  categoryId: "CAT_123",
  entityType: "CATEGORY",
  recruiterId: "REC_123456",  // Must match employee's companyId
  name: "Travel Allowance",
  description: "For travel expenses",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Employee User Structure:
```javascript
{
  userId: "USER_EMP001_1234567890",
  employeeId: "EMP001",
  email: "employee@example.com",
  companyId: "REC_123456",  // Must match category's recruiterId
  roleId: "ROLE_EMPLOYEE",
  isActive: true,
  isFirstLogin: false
}
```

### Employee Main Record Structure:
```javascript
{
  employeeId: "EMP001",
  recruiterId: "REC_123456",  // Source of truth for companyId
  fullName: "John Doe",
  email: "employee@example.com",
  department: "IT",
  designation: "Developer"
}
```

## API Endpoints

### Employee Portal Endpoints:
- `GET /api/v1/employee/claims/categories` - Get claim categories
- `GET /api/v1/employee/claims` - Get employee's claims
- `POST /api/v1/employee/claims` - Submit new claim

### Admin HRMS Endpoints:
- `GET /api/v1/hrms/claims/categories` - Get categories (admin)
- `POST /api/v1/hrms/claims/categories` - Create category (admin)
- `PUT /api/v1/hrms/claims/categories/:id` - Update category (admin)
- `DELETE /api/v1/hrms/claims/categories/:id` - Delete category (admin)

## Testing Scenarios

### Scenario 1: New Employee Onboarding
1. Admin creates employee with employeeId "EMP001"
2. System auto-creates employee user with companyId = recruiterId
3. Employee logs in
4. Employee should see all categories for that recruiterId

### Scenario 2: Multiple Recruiters
1. Recruiter A (REC_001) creates categories: Travel, Food
2. Recruiter B (REC_002) creates categories: Medical, Transport
3. Employee of Recruiter A should only see: Travel, Food
4. Employee of Recruiter B should only see: Medical, Transport

### Scenario 3: No Categories Yet
1. New recruiter with no categories
2. Employee logs in
3. Should see helpful message to contact admin
4. Should not see empty dropdown

## Maintenance

### Regular Checks:
1. Run debug script monthly to check for inconsistencies
2. Monitor backend logs for category fetch errors
3. Ensure new employees get correct companyId on creation

### When Adding New Employees:
- Verify companyId is set correctly during creation
- Test category visibility immediately after onboarding

### When Changing Employee's Company:
- Update both main employee record and employee user record
- Verify category visibility after change

## Summary

The fix ensures that:
1. ✅ Employee's companyId matches category's recruiterId
2. ✅ API endpoints are correct
3. ✅ Error handling provides clear feedback
4. ✅ Logging helps debug issues
5. ✅ Data inconsistencies can be detected and fixed
6. ✅ User experience is improved with helpful messages

After applying these fixes, claim categories will be properly visible to employees in the Employee Portal.
