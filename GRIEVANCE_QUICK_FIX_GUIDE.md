# Grievance Module - Quick Fix Guide

## 🚀 Quick Start

### 1. Run Diagnostic (IMPORTANT - Do this first!)
```bash
cd d:\Staffinn-main
node check-org-hierarchy.js
```

### 2. Fix Common Issues

#### If "No managers found":
```
✅ Ensure employee is in organization chart
✅ Ensure employee has a parent node (manager)
✅ Ensure parent node has an employee assigned
```

#### If complaint assigns to wrong person:
```
✅ Verify target employee is in organization chart
✅ Verify target employee has a manager (parent node)
✅ Check backend logs for assignment details
```

---

## 📋 What Was Fixed

### Issue 1: Manager Not Showing ✅
- **Before:** "No managers found in your reporting hierarchy"
- **After:** Shows immediate manager and next-level manager from organogram
- **Fix:** Simplified lookup logic, removed problematic recruiterId filter

### Issue 2: Wrong Assignment ✅
- **Before:** Complaint assigned to the employee directly
- **After:** Complaint assigned to the employee's manager
- **Fix:** Improved validation and error messages

---

## 🔍 Verification Steps

### Test Manager Dropdown:
1. Login as employee
2. Grievances → Submit Grievance
3. Select "General Grievance"
4. Check "Assign to Manager" dropdown
5. Should show your managers

### Test Complaint Assignment:
1. Login as employee
2. Grievances → Submit Grievance
3. Select "Complaint Against Employee"
4. Select an employee
5. Submit
6. Login as that employee's manager
7. Check "Assigned to Me" tab
8. Should see the complaint

---

## ⚠️ Prerequisites

**CRITICAL:** Employees MUST be in the organization chart!

### How to Add Employees to Org Chart:
1. Go to HRMS Admin Panel
2. Organization Chart / Organogram
3. Create nodes for each position
4. Assign employees to nodes
5. Set parent-child relationships

---

## 🐛 Debugging

### Check Browser Console:
```javascript
// Look for these logs:
🔍 Fetching reporting managers...
📊 Reporting managers response: {...}
✅ Managers data: {...}
```

### Check Backend Logs:
```javascript
// Look for these logs:
🔍 getReportingManagers called
👤 User info: {...}
📋 Current node found: Yes (nodeId: ...)
✅ Immediate manager: ...
```

### Common Error Messages:

| Error | Meaning | Solution |
|-------|---------|----------|
| "Employee not found in organization hierarchy" | Employee not in org chart | Add to org chart |
| "Selected employee does not have a manager" | No parent node | Assign manager |
| "Manager not found in organization hierarchy" | Parent node invalid | Fix parent reference |
| "No managers found in your reporting hierarchy" | You're not in org chart | Add yourself to org chart |

---

## 📞 Still Having Issues?

1. ✅ Run diagnostic script
2. ✅ Check all employees are in org chart
3. ✅ Verify parent-child relationships
4. ✅ Check browser console
5. ✅ Check backend logs
6. ✅ Share diagnostic output for support

---

## 📁 Modified Files

- `EmployeePortal/src/services/api.js`
- `EmployeePortal/src/pages/Grievances.jsx`
- `Backend/controllers/hrms/hrmsGrievanceController.js`

## 📁 New Files

- `check-org-hierarchy.js` (Diagnostic tool)
- `GRIEVANCE_FIXES_DETAILED_SUMMARY.md` (Full documentation)
- `GRIEVANCE_QUICK_FIX_GUIDE.md` (This file)
