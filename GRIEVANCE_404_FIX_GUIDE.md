# 404 Error Fix - Quick Guide

## ❌ Problem
```
Failed to load resource: the server responded with a status of 404 (Not Found)
/api/v1/employee/grievances/organization-employees
/api/v1/employee/grievances/reporting-managers
```

## ✅ Solution Applied

### Issue
Routes were not registered in Employee Portal routes file.

### Fix
Added missing routes to `Backend/routes/hrms/employeePortalRoutes.js`:

```javascript
// Import grievance-specific controllers
const { 
  getReportingManagers, 
  getOrganizationEmployees 
} = require('../../controllers/hrms/hrmsGrievanceController');

// Added routes
router.get('/grievances/reporting-managers', authenticateEmployee, getReportingManagers);
router.get('/grievances/organization-employees', authenticateEmployee, getOrganizationEmployees);
```

---

## 🚀 Restart Backend

### Option 1: Using PM2
```bash
cd Backend
pm2 restart staffinn-backend
pm2 logs staffinn-backend
```

### Option 2: Using npm
```bash
cd Backend
# Stop current process (Ctrl+C)
npm run dev
```

### Option 3: Using nodemon
```bash
cd Backend
# Stop current process (Ctrl+C)
nodemon server.js
```

---

## ✅ Verification Steps

### Step 1: Check Backend Started
Look for:
```
✅ Server running on port 4001
✅ Connected to DynamoDB
🚀 Starting Grievance Escalation Service
```

### Step 2: Test Routes Manually

**Test 1: Reporting Managers**
```bash
curl -X GET http://localhost:4001/api/v1/employee/grievances/reporting-managers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "immediateManager": {...},
    "nextLevelManager": {...}
  }
}
```

**Test 2: Organization Employees**
```bash
curl -X GET http://localhost:4001/api/v1/employee/grievances/organization-employees \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "employeeId": "...",
      "fullName": "...",
      "designation": "...",
      "department": "..."
    }
  ]
}
```

### Step 3: Check Frontend

1. **Refresh Browser** (Ctrl+R or F5)
2. **Open Console** (F12)
3. **Navigate to Grievances**
4. **Click "Submit Grievance"**

Expected Console Output:
```
🔍 Fetching organization employees...
📊 Organization employees response: {success: true, data: Array(X)}
✅ Employees loaded: X [{...}, {...}]
```

### Step 4: Check Backend Logs

Should see:
```
🔍 getReportingManagers called
👤 User info: {employeeId: "...", recruiterId: "..."}
📋 Employee found: [Name]
✅ Immediate manager: [Manager Name]

🔍 getOrganizationEmployees called
👤 Current user: {recruiterId: "...", currentEmployeeId: "..."}
📊 Total employees in DB: X
✅ Filtered employees: Y
📤 Returning employee list: Y employees
```

---

## 🎯 Expected Results

### General Grievance
```
Dropdown shows:
┌─────────────────────────────────────────────┐
│ Select Manager                            ▼ │
├─────────────────────────────────────────────┤
│ Lakshya Sharma - nbv (Immediate Manager)   │
│ Jasraj Bhavsar - fgf (Next Level Manager)  │
└─────────────────────────────────────────────┘
```

### Complaint Against Employee
```
Card Grid shows:
┌──────────────────┐  ┌──────────────────┐
│ [LS] Lakshya     │  │ [JB] Jasraj      │
│ nbv              │  │ fgf              │
│ hg               │  │ it               │
└──────────────────┘  └──────────────────┘
```

---

## 🐛 If Still Not Working

### Check 1: Routes File Updated
```bash
cd Backend
cat routes/hrms/employeePortalRoutes.js | grep "organization-employees"
```

Should show:
```javascript
router.get('/grievances/organization-employees', authenticateEmployee, getOrganizationEmployees);
```

### Check 2: Backend Restarted
```bash
ps aux | grep node
# Kill old process if needed
kill -9 [PID]
# Start fresh
npm run dev
```

### Check 3: Port Conflict
```bash
# Check if port 4001 is in use
netstat -ano | findstr :4001
# Kill process if needed
taskkill /PID [PID] /F
```

### Check 4: Import Statement
Verify in `employeePortalRoutes.js`:
```javascript
const { 
  getReportingManagers, 
  getOrganizationEmployees 
} = require('../../controllers/hrms/hrmsGrievanceController');
```

---

## 📋 Complete Checklist

- [ ] Routes added to `employeePortalRoutes.js`
- [ ] Import statement added for grievance controller
- [ ] Backend restarted
- [ ] No errors in backend console
- [ ] Browser refreshed
- [ ] Console shows no 404 errors
- [ ] Managers appear in dropdown
- [ ] Employees appear in card grid

---

## 🎉 Success Indicators

### Backend Console
```
✅ Server running on port 4001
🔍 getReportingManagers called
✅ Immediate manager: [Name]
🔍 getOrganizationEmployees called
✅ Filtered employees: X
```

### Frontend Console
```
✅ Employees loaded: X [{...}]
```

### UI
- ✅ No 404 errors
- ✅ Managers dropdown populated
- ✅ Employee cards displayed
- ✅ No "No employees found" message

---

## 📞 Still Having Issues?

Collect this information:

1. **Backend Console Output**
   - Copy full startup logs
   - Copy any error messages

2. **Frontend Console Output**
   - Copy all errors
   - Copy network tab responses

3. **Route File Content**
   ```bash
   cat Backend/routes/hrms/employeePortalRoutes.js
   ```

4. **Backend Process**
   ```bash
   ps aux | grep node
   netstat -ano | findstr :4001
   ```

---

**Last Updated**: January 2025  
**Status**: ✅ Routes Added - Restart Required  
**Next Step**: Restart backend and test
