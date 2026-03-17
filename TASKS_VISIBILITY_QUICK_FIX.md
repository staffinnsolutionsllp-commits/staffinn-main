# Quick Fix: Tasks Not Showing in Employee Portal

## Problem
Tasks assigned by HRMS admin are not appearing in the Employee Portal's Tasks & Performance section.

## Quick Fix (2 Steps)

### Step 1: Restart Backend
```bash
cd Backend
# Press Ctrl+C to stop
npm start
```

### Step 2: Restart Employee Portal
```bash
cd EmployeePortal
# Press Ctrl+C to stop
npm run dev
```

## Test
1. Login as admin in HRMS
2. Assign a task to an employee (use their Employee ID or Email)
3. Login as that employee in Employee Portal
4. Go to Tasks & Performance
5. Task should now appear ✅

## What Was Fixed

### Frontend Changes:
- ✅ Fixed API endpoints in `Tasks.jsx`
  - Changed `/employee-portal/tasks` → `/employee/tasks`
  - Changed `/employee-portal/performance/ratings` → `/employee/performance/ratings`
  - Changed `/employee-portal/tasks/:id` → `/employee/tasks/:id`
- ✅ Added comprehensive error logging
- ✅ Better error messages

### Backend Changes:
- ✅ Enhanced `employeePortalController.js` - Added logging to `getMyTasks`
- ✅ Enhanced `hrmsTaskController.js` - Added logging to `assignTask`
- ✅ Created `debug-tasks.js` - Debug script to verify task assignments

## How It Works

### Task Assignment Flow:
```
1. Admin assigns task in HRMS
   ↓
2. Task saved with:
   - recruiterId (admin's ID)
   - employeeId OR employeeEmail
   ↓
3. Employee logs into Employee Portal
   ↓
4. System queries tasks WHERE:
   - recruiterId = employee's companyId
   - AND (employeeId = employee's ID OR employeeEmail = employee's email)
   ↓
5. Tasks appear in Employee Portal ✅
```

## Verify Fix Worked

### Check Backend Logs (when employee fetches tasks):
```
=== GET MY TASKS DEBUG ===
Employee ID: EMP001
Employee Email: employee@example.com
Company ID (recruiterId): REC_123456
Found 3 total items for employee
✅ Found 3 tasks (filtered out 0 ratings)
Tasks: [ { title: 'Complete Report', status: 'Pending', taskId: 'TASK_001' }, ... ]
```

### Check Backend Logs (when admin assigns task):
```
=== ASSIGN TASK DEBUG ===
Recruiter ID: REC_123456
Request body: { employeeIds: ['EMP001'], title: 'Complete Report', ... }
Target employees: [ { employeeId: 'EMP001' } ]
Creating task: { taskId: 'TASK_001', employeeId: 'EMP001', title: 'Complete Report' }
✅ Successfully assigned 1 task(s)
```

### Check Browser Console:
```
Fetching tasks...
Tasks response: { success: true, data: [...] }
```

## Debug Issues

If tasks still don't show, run the debug script:
```bash
cd Backend
node debug-tasks.js
```

This shows:
- All tasks and their assignments
- All employees and their companyId
- Which employees should see which tasks
- Any orphaned tasks (tasks with no matching employee)

## Common Issues

### Issue 1: Employee's companyId doesn't match task's recruiterId
**Solution**: Run the fix script from the claims fix:
```bash
cd Backend
node fix-employee-company-ids.js
```

### Issue 2: Task assigned with wrong Employee ID or Email
**Check**:
- Verify employee ID in HRMS matches the ID used in task assignment
- Verify employee email in HRMS matches the email used in task assignment

**Solution**: Re-assign the task with correct Employee ID or Email

### Issue 3: Employee not logged in or token expired
**Solution**: Logout and login again

## Important Rules

1. ✅ Employee only sees tasks assigned to their own Employee ID or Email
2. ✅ Employee only sees tasks from their own recruiter (companyId match)
3. ✅ Tasks appear in real-time (no delay)
4. ✅ Ratings are filtered out from tasks list

## Task Assignment Best Practices

When assigning tasks in HRMS:
1. Use Employee ID (preferred) OR Employee Email
2. Verify the employee exists in your HRMS
3. Check that employee's companyId matches your recruiterId
4. Task will appear immediately in Employee Portal

## Summary

**Before**: Tasks not showing due to wrong API endpoints ❌  
**After**: Tasks appear immediately after assignment ✅

**Fix Time**: ~2 minutes  
**Complexity**: Low  
**Impact**: High
