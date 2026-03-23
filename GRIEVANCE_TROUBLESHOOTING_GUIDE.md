# Grievance Employee List Troubleshooting Guide

## 🐛 Issues Identified

### Issue 1: No Managers Showing in "General Grievance"
**Symptom**: Dropdown shows "Select Manager" but no options available

### Issue 2: "No employees found" in "Complaint Against Employee"
**Symptom**: Card grid shows "No employees found" message

---

## 🔍 Root Cause Analysis

### Problem: Employee Portal vs HRMS Data Mismatch

**Employee Portal** uses different authentication:
- Table: `staffinn-hrms-employee-users`
- JWT contains: `userId`, `employeeId`, `companyId`
- Missing: `recruiterId` in JWT token

**HRMS Employees** table structure:
- Table: `staffinn-hrms-employees`
- Key field: `employeeId`
- Filter field: `recruiterId`

**Mismatch**: 
- Employee Portal JWT has `companyId`
- Backend code was looking for `recruiterId`
- Need to map `companyId` → `recruiterId`

---

## ✅ Fixes Applied

### 1. Backend Controller Updates

#### File: `Backend/controllers/hrms/hrmsGrievanceController.js`

**getReportingManagers()** - Enhanced logging and fixed field mapping:
```javascript
const employeeId = req.user.userId || req.user.employeeId;
const recruiterId = req.user.companyId || req.user.recruiterId;

console.log('🔍 getReportingManagers called');
console.log('👤 User info:', { employeeId, recruiterId, user: req.user });
```

**getOrganizationEmployees()** - Fixed recruiterId extraction:
```javascript
const recruiterId = req.user?.companyId || req.user?.recruiterId;
const currentEmployeeId = req.user?.employeeId || req.user?.userId;

console.log('🔍 getOrganizationEmployees called');
console.log('👤 Current user:', { recruiterId, currentEmployeeId, fullUser: req.user });
```

### 2. Auth Controller Update

#### File: `Backend/controllers/hrms/employeeAuthController.js`

**getProfile()** - Enriched user data with recruiterId:
```javascript
// Get employee details from HRMS table
const empResult = await docClient.send(new GetCommand({
  TableName: 'staffinn-hrms-employees',
  Key: { employeeId }
}));

// Add recruiterId to user object
const enrichedUser = {
  ...userWithoutPassword,
  recruiterId: empResult.Item.recruiterId || companyId,
  fullName: empResult.Item.fullName,
  designation: empResult.Item.designation,
  department: empResult.Item.department
};
```

### 3. Frontend Context Update

#### File: `EmployeePortal/src/context/AuthContext.jsx`

**loadUser()** - Added logging:
```javascript
const userData = response.data.data;
console.log('👤 User loaded:', userData);
console.log('🏢 Recruiter ID:', userData.recruiterId || userData.companyId);
```

---

## 🧪 Testing Steps

### Step 1: Check Backend Logs

1. **Start Backend with Logs**:
```bash
cd Backend
npm run dev
```

2. **Login to Employee Portal**

3. **Check Console for**:
```
🔍 getProfile called for employeeId: EMP123
📋 Employee found: Priya Sharma
📤 Returning profile with recruiterId: REC456
```

### Step 2: Check Frontend Console

1. **Open Browser Console** (F12)

2. **Navigate to Grievances**

3. **Check for User Data**:
```
👤 User loaded: {userId: "...", employeeId: "...", recruiterId: "..."}
🏢 Recruiter ID: REC456
```

### Step 3: Test General Grievance

1. **Click "Submit Grievance"**

2. **Select "General Grievance"**

3. **Check Backend Logs**:
```
🔍 getReportingManagers called
👤 User info: {employeeId: "EMP123", recruiterId: "REC456"}
📋 Employee found: Priya Sharma
🔍 Looking for immediate manager: EMP789
✅ Immediate manager: Lakshya Sharma
```

4. **Check Frontend**:
- Dropdown should show managers
- Example: "Lakshya Sharma - nbv (Immediate Manager)"

### Step 4: Test Complaint Against Employee

1. **Select "Complaint Against Employee"**

2. **Check Backend Logs**:
```
🔍 getOrganizationEmployees called
👤 Current user: {recruiterId: "REC456", currentEmployeeId: "EMP123"}
📊 Total employees in DB: 5
✅ Filtered employees: 4
📤 Returning employee list: 4 employees
```

3. **Check Frontend Console**:
```
🔍 Fetching organization employees...
📊 Organization employees response: {success: true, data: Array(4)}
✅ Employees loaded: 4 [{...}, {...}, ...]
```

4. **Check UI**:
- Employee cards should display
- With avatars and names

---

## 🔧 Manual Debugging

### Check Employee Record in Database

**Using AWS CLI**:
```bash
aws dynamodb get-item \
  --table-name staffinn-hrms-employees \
  --key '{"employeeId": {"S": "YOUR_EMPLOYEE_ID"}}'
```

**Check for**:
- `employeeId`: Should match logged-in user
- `recruiterId`: Should exist and match company
- `managerId`: Should point to manager's employeeId
- `fullName`, `designation`, `department`: Should be populated

### Check Manager Record

```bash
aws dynamodb get-item \
  --table-name staffinn-hrms-employees \
  --key '{"employeeId": {"S": "MANAGER_EMPLOYEE_ID"}}'
```

### Check All Employees for Company

```bash
aws dynamodb scan \
  --table-name staffinn-hrms-employees \
  --filter-expression "recruiterId = :rid" \
  --expression-attribute-values '{":rid": {"S": "YOUR_RECRUITER_ID"}}'
```

---

## 🎯 Expected Results

### General Grievance - Success
```
Dropdown shows:
┌─────────────────────────────────────────────┐
│ Select Manager                            ▼ │
├─────────────────────────────────────────────┤
│ Lakshya Sharma - nbv (Immediate Manager)   │
│ Jasraj Bhavsar - fgf (Next Level Manager)  │
└─────────────────────────────────────────────┘
```

### Complaint Against Employee - Success
```
Card Grid shows:
┌──────────────────┐  ┌──────────────────┐
│ [LS] Lakshya     │  │ [JB] Jasraj      │
│ nbv              │  │ fgf              │
│ hg               │  │ it               │
└──────────────────┘  └──────────────────┘
┌──────────────────┐  ┌──────────────────┐
│ [A] Atul         │  │ [PS] Priya       │
│ hdhj             │  │ MERN             │
│ IT               │  │ Human Resources  │
└──────────────────┘  └──────────────────┘
```

---

## ❌ Common Issues & Solutions

### Issue: "Employee not found"

**Cause**: employeeId in JWT doesn't exist in HRMS employees table

**Solution**:
1. Check if employee record exists
2. Verify employeeId matches between tables
3. Check if employee was created in HRMS

**Fix**:
```sql
-- Add employee to HRMS table if missing
-- Or update employeeId in employee-users table
```

### Issue: "No managers found in your reporting hierarchy"

**Cause**: Employee record has no `managerId` field

**Solution**:
1. Check employee record in database
2. Update employee with managerId
3. Ensure manager exists in employees table

**Fix**:
```javascript
// Update employee with manager
await dynamoClient.send(new UpdateCommand({
  TableName: 'staffinn-hrms-employees',
  Key: { employeeId: 'EMP123' },
  UpdateExpression: 'SET managerId = :mid',
  ExpressionAttributeValues: {
    ':mid': 'MANAGER_EMP_ID'
  }
}));
```

### Issue: "No employees found"

**Cause**: recruiterId mismatch or no employees in company

**Solution**:
1. Check backend logs for recruiterId
2. Verify employees exist with same recruiterId
3. Check if employees are marked as deleted

**Debug**:
```javascript
// In backend, add this temporarily
console.log('All employees:', mockDB().scan(HRMS_EMPLOYEES_TABLE));
console.log('Recruiter IDs:', [...new Set(allEmployees.map(e => e.recruiterId))]);
```

### Issue: recruiterId is undefined

**Cause**: Employee record missing recruiterId field

**Solution**:
1. Update all employee records with recruiterId
2. Ensure recruiterId matches companyId from JWT

**Fix**:
```javascript
// Bulk update all employees
const employees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
employees.forEach(emp => {
  if (!emp.recruiterId && emp.companyId) {
    emp.recruiterId = emp.companyId;
    mockDB().put(HRMS_EMPLOYEES_TABLE, emp);
  }
});
```

---

## 📊 Data Verification Checklist

### Employee Record Must Have:
- [ ] `employeeId` - Unique identifier
- [ ] `recruiterId` - Company identifier
- [ ] `fullName` - Employee name
- [ ] `email` - Email address
- [ ] `designation` - Job title
- [ ] `department` - Department name
- [ ] `managerId` - Manager's employeeId (if not top-level)
- [ ] `isDeleted` - false or not set

### Manager Record Must Have:
- [ ] Same fields as employee
- [ ] Valid `employeeId`
- [ ] Same `recruiterId` as employee
- [ ] May have own `managerId` for escalation

### JWT Token Must Have:
- [ ] `userId` or `employeeId`
- [ ] `companyId` or `recruiterId`
- [ ] `email`
- [ ] `roleId`

---

## 🚀 Quick Fix Commands

### Restart Backend
```bash
cd Backend
pm2 restart staffinn-backend
# or
npm run dev
```

### Clear Browser Cache
```javascript
// In browser console
localStorage.clear();
location.reload();
```

### Re-login
1. Logout from Employee Portal
2. Clear browser cache
3. Login again
4. Check console logs

---

## 📞 Support Checklist

If issues persist, collect this information:

### Backend Logs
```
🔍 getReportingManagers called
👤 User info: {...}
📋 Employee found: ...
⚠️ Employee has no managerId set
```

### Frontend Console
```
👤 User loaded: {...}
🔍 Fetching organization employees...
❌ Failed to fetch employees: {...}
```

### Database State
- Employee record JSON
- Manager record JSON
- JWT token payload
- recruiterId values

### Screenshots
- Grievance form (empty dropdowns)
- Browser console (errors)
- Network tab (API responses)
- Backend logs (terminal output)

---

## ✅ Success Criteria

After fixes, you should see:

1. **Backend Logs**:
```
✅ Immediate manager: Lakshya Sharma
✅ Filtered employees: 4
📤 Returning employee list: 4 employees
```

2. **Frontend Console**:
```
✅ Employees loaded: 4 [{...}, {...}, ...]
```

3. **UI**:
- Managers dropdown populated
- Employee cards displayed
- No error messages

---

**Last Updated**: January 2025  
**Status**: Fixes Applied ✅  
**Next Steps**: Test with real data and verify all scenarios
