# 🚀 Quick Command Reference

## Essential Commands

### Run Diagnostic Tool
```bash
cd d:\Staffinn-main
node check-org-hierarchy.js
```

### Start Backend Server
```bash
cd d:\Staffinn-main\Backend
npm start
```

### Start Frontend (Employee Portal)
```bash
cd d:\Staffinn-main\EmployeePortal
npm run dev
```

---

## 📋 Quick Checks

### Check if employees are in org chart
```bash
node check-org-hierarchy.js | grep "EMPLOYEES NOT IN ORGANIZATION CHART"
```

### Check for orphaned nodes
```bash
node check-org-hierarchy.js | grep "ORPHANED NODES"
```

---

## 🔍 Debugging Commands

### View Backend Logs (if using PM2)
```bash
pm2 logs backend
```

### View Backend Logs (if using npm)
```bash
# Logs will appear in the terminal where you ran npm start
```

### Clear Browser Cache
```
1. Open browser
2. Press Ctrl + Shift + Delete
3. Clear cache and cookies
4. Reload page (Ctrl + F5)
```

---

## 📁 File Locations

### Frontend Files
```
d:\Staffinn-main\EmployeePortal\src\pages\Grievances.jsx
d:\Staffinn-main\EmployeePortal\src\services\api.js
```

### Backend Files
```
d:\Staffinn-main\Backend\controllers\hrms\hrmsGrievanceController.js
d:\Staffinn-main\Backend\routes\hrms\hrmsGrievanceRoutes.js
```

### Documentation Files
```
d:\Staffinn-main\COMPLETE_FIX_SUMMARY.md
d:\Staffinn-main\GRIEVANCE_QUICK_FIX_GUIDE.md
d:\Staffinn-main\GRIEVANCE_FIXES_DETAILED_SUMMARY.md
d:\Staffinn-main\ORG_CHART_SETUP_GUIDE.md
d:\Staffinn-main\QUICK_COMMANDS.md (this file)
```

### Diagnostic Tool
```
d:\Staffinn-main\check-org-hierarchy.js
```

---

## 🛠️ Common Tasks

### Task 1: Check System Health
```bash
cd d:\Staffinn-main
node check-org-hierarchy.js
```
Look for:
- ✅ All employees are assigned to the organization chart!
- ✅ No orphaned nodes found!

### Task 2: Test Grievance Module
```
1. Open browser → http://localhost:5177 (or your port)
2. Login as employee
3. Go to Grievances
4. Click "Submit Grievance"
5. Test both types:
   - General Grievance
   - Complaint Against Employee
```

### Task 3: View API Response
```
1. Open browser console (F12)
2. Go to Network tab
3. Submit a grievance
4. Look for API calls:
   - /api/v1/employee/grievances/reporting-managers
   - /api/v1/employee/grievances
5. Check response data
```

---

## 🔧 Troubleshooting Commands

### Problem: Manager dropdown is empty

**Step 1:** Check if employee is in org chart
```bash
node check-org-hierarchy.js
```

**Step 2:** Check browser console
```
1. Press F12
2. Go to Console tab
3. Look for errors
```

**Step 3:** Check backend logs
```
Look for:
🔍 getReportingManagers called
👤 User info: {...}
📋 Current node found: Yes/No
```

### Problem: Complaint assigns to wrong person

**Step 1:** Check target employee's manager
```bash
node check-org-hierarchy.js
```
Find the target employee and verify their parent node

**Step 2:** Check backend logs
```
Look for:
🚨 Complaint against employee: [ID]
👤 Complaint against: [Name]
✅ Assigning complaint to manager: [Manager Name]
```

---

## 📊 Useful Grep Commands

### Find specific employee in diagnostic output
```bash
node check-org-hierarchy.js | grep "Employee Name"
```

### Count total employees
```bash
node check-org-hierarchy.js | grep "Total Employees"
```

### Count total nodes
```bash
node check-org-hierarchy.js | grep "Total Organization Nodes"
```

---

## 🔄 Restart Services

### Restart Backend
```bash
# If using npm
Ctrl + C (to stop)
npm start (to restart)

# If using PM2
pm2 restart backend
```

### Restart Frontend
```bash
# If using npm
Ctrl + C (to stop)
npm run dev (to restart)
```

---

## 📝 Quick Notes

### Important Ports
- Frontend: Usually 5177 or 3000
- Backend: Usually 4001

### Important Environment Variables
```
VITE_API_URL=http://localhost:4001/api/v1
```

### Database Tables
- HRMS_ORGANIZATION_CHART_TABLE
- HRMS_EMPLOYEES_TABLE
- HRMS_GRIEVANCES_TABLE

---

## 🆘 Emergency Commands

### If everything is broken
```bash
# 1. Stop all services
Ctrl + C (in all terminals)

# 2. Clear node_modules and reinstall
cd d:\Staffinn-main\Backend
rm -rf node_modules
npm install

cd d:\Staffinn-main\EmployeePortal
rm -rf node_modules
npm install

# 3. Restart services
cd d:\Staffinn-main\Backend
npm start

# In new terminal:
cd d:\Staffinn-main\EmployeePortal
npm run dev

# 4. Run diagnostic
cd d:\Staffinn-main
node check-org-hierarchy.js
```

---

## 📚 Documentation Quick Links

| Need | File |
|------|------|
| Overview | `COMPLETE_FIX_SUMMARY.md` |
| Quick fix | `GRIEVANCE_QUICK_FIX_GUIDE.md` |
| Setup org chart | `ORG_CHART_SETUP_GUIDE.md` |
| Technical details | `GRIEVANCE_FIXES_DETAILED_SUMMARY.md` |
| Commands | `QUICK_COMMANDS.md` (this file) |

---

## ✅ Daily Checklist

```
[ ] Backend server running
[ ] Frontend server running
[ ] No errors in console
[ ] Diagnostic script passes
[ ] Test grievance submission
```

---

**💡 Pro Tip:** Bookmark this file for quick reference!

**🔖 Quick Access:**
```bash
# Windows
notepad d:\Staffinn-main\QUICK_COMMANDS.md

# Or open in VS Code
code d:\Staffinn-main\QUICK_COMMANDS.md
```
