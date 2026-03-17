# HRMS-Employee Portal Integration - Quick Reference

## What Was Implemented

### ✅ Frontend (Employee Portal)

**New Pages Created:**
1. `Claims.jsx` - Claim submission and tracking
2. `Tasks.jsx` - Task management and performance ratings
3. `Grievances.jsx` - Grievance submission and tracking
4. `Organogram.jsx` - Organizational hierarchy display

**Updated Files:**
- `Layout.jsx` - Added new sidebar menu items
- `App.jsx` - Added routes for new pages

**New Sidebar Menu:**
```
Dashboard
Attendance
Leave
Payroll
Claim Management ← NEW
Tasks & Performance ← NEW
Grievances ← NEW
Organogram ← NEW
Profile
```

### ✅ Backend (API)

**Updated Controllers:**
- `employeePortalController.js` - Added 9 new methods:
  - `getMyClaims()` - Get employee claims
  - `getClaimCategories()` - Get claim categories
  - `submitClaim()` - Submit new claim
  - `getMyTasks()` - Get assigned tasks
  - `updateMyTask()` - Update task status
  - `getMyRatings()` - Get performance ratings
  - `getMyGrievances()` - Get grievances
  - `submitGrievance()` - Submit grievance
  - `getMyHierarchy()` - Get org hierarchy

**Updated Routes:**
- `employeePortalRoutes.js` - Added 9 new endpoints

**Enhanced HRMS Controllers:**
- `hrmsClaimController.js` - Added `employeeEmail` support
- `hrmsTaskController.js` - Added `employeeEmail` support
- `hrmsGrievanceController.js` - Added `recruiterId` and `employeeEmail` support

## Data Isolation Implementation

### Key Principle
**Every employee can ONLY see data from their own HRMS (recruiter)**

### How It Works

**1. Employee Authentication:**
```javascript
// JWT Token contains:
{
  userId: "employee-id",
  employeeId: "employee-id",
  companyId: "recruiter-id",  // ← This is the key!
  email: "employee@email.com",
  roleId: "role-id"
}
```

**2. Data Filtering Pattern:**
```javascript
// Every query uses this pattern:
const { employeeId, companyId, email } = req.user;

FilterExpression: 'recruiterId = :rid AND (employeeId = :eid OR employeeEmail = :email)'
ExpressionAttributeValues: {
  ':rid': companyId,      // Ensures data from correct HRMS
  ':eid': employeeId,     // Matches employee ID
  ':email': email         // Backup match using email
}
```

**3. Data Writing Pattern:**
```javascript
// Every write includes:
{
  recruiterId: companyId,     // Links to correct HRMS
  employeeId: employeeId,     // Employee identifier
  employeeEmail: email,       // Backup identifier
  // ... other fields
}
```

## Real-Time Sync Flow

### Claim Management
```
Employee Portal                    HRMS Admin
     |                                |
     | Submit Claim                   |
     |------------------------------>|
     |                               | Claim appears instantly
     |                               | in Claim Management
     |                               |
     |                               | Admin approves/rejects
     |<------------------------------|
     | Status updated instantly      |
```

### Task Management
```
HRMS Admin                      Employee Portal
     |                                |
     | Assign Task                    |
     |------------------------------>|
     |                               | Task appears instantly
     |                               | in Tasks section
     |                               |
     |                               | Employee updates status
     |<------------------------------|
     | Update visible instantly      |
```

### Grievance Management
```
Employee Portal                    HRMS Admin
     |                                |
     | Submit Grievance               |
     |------------------------------>|
     |                               | Grievance appears instantly
     |                               | in Grievance Management
     |                               |
     |                               | Admin updates status
     |<------------------------------|
     | Status updated instantly      |
```

## API Endpoints Quick Reference

### Employee Portal APIs

```javascript
// Claims
GET    /api/employee-portal/claims
GET    /api/employee-portal/claims/categories
POST   /api/employee-portal/claims

// Tasks & Performance
GET    /api/employee-portal/tasks
PUT    /api/employee-portal/tasks/:taskId
GET    /api/employee-portal/performance/ratings

// Grievances
GET    /api/employee-portal/grievances
POST   /api/employee-portal/grievances

// Organogram
GET    /api/employee-portal/organogram
```

### HRMS Admin APIs (Already Existing, Enhanced)

```javascript
// Claims
GET    /api/hrms/claims
POST   /api/hrms/claims
PUT    /api/hrms/claims/:claimId/status

// Tasks
POST   /api/hrms/tasks/assign
GET    /api/hrms/tasks
PUT    /api/hrms/tasks/:taskId/status

// Grievances
GET    /api/hrms/grievances
PUT    /api/hrms/grievances/:id/status

// Organization
GET    /api/hrms/organization/chart
POST   /api/hrms/organization/node
```

## Database Tables Used

| Table Name | Purpose | Key Fields |
|------------|---------|------------|
| `HRMS-Claim-Management` | Store claims | `recruiterId`, `employeeId`, `employeeEmail` |
| `HRMS-Task-Management` | Store tasks & ratings | `recruiterId`, `employeeId`, `employeeEmail` |
| `HRMS-Grievances` | Store grievances | `recruiterId`, `employeeId`, `employeeEmail` |
| `HRMS-Organization-Chart` | Store org hierarchy | `recruiterId`, `employeeId`, `parentId` |
| `staffinn-hrms-employees` | Employee master data | `recruiterId`, `employeeId` |
| `staffinn-hrms-employee-users` | Employee login | `companyId`, `employeeId`, `email` |

## Testing Scenarios

### Scenario 1: Multi-Recruiter Isolation
```
Setup:
- Recruiter A (ID: rec-001) has employees: E1, E2
- Recruiter B (ID: rec-002) has employees: E3, E4

Test:
1. E1 logs in → Should see only data from rec-001
2. E3 logs in → Should see only data from rec-002
3. E1 submits claim → Should appear only in rec-001 HRMS
4. E3 submits claim → Should appear only in rec-002 HRMS

Expected: ✅ Complete data isolation
```

### Scenario 2: Real-Time Sync
```
Test:
1. Admin (rec-001) assigns task to E1
2. E1 refreshes portal → Task appears immediately
3. E1 updates task to "In Progress"
4. Admin refreshes HRMS → Update visible immediately

Expected: ✅ Real-time synchronization
```

### Scenario 3: Organogram Display
```
Test:
1. E1 (Junior Developer) logs in
2. Opens Organogram
3. Should see hierarchy:
   - CEO (Top)
   - CTO
   - Team Lead
   - E1 (Highlighted)

Expected: ✅ Correct hierarchy with E1 at bottom
```

## Files Modified/Created

### Frontend Files
```
EmployeePortal/src/
├── components/
│   └── Layout.jsx (MODIFIED)
├── pages/
│   ├── Claims.jsx (NEW)
│   ├── Tasks.jsx (NEW)
│   ├── Grievances.jsx (NEW)
│   └── Organogram.jsx (NEW)
└── App.jsx (MODIFIED)
```

### Backend Files
```
Backend/
├── controllers/hrms/
│   ├── employeePortalController.js (MODIFIED - Added 9 methods)
│   ├── hrmsClaimController.js (MODIFIED - Added email support)
│   ├── hrmsTaskController.js (MODIFIED - Added email support)
│   └── hrmsGrievanceController.js (MODIFIED - Added recruiterId filter)
└── routes/hrms/
    └── employeePortalRoutes.js (MODIFIED - Added 9 routes)
```

## Next Steps

1. **Test the Integration:**
   - Start backend server
   - Start employee portal
   - Login as employee
   - Test each new module

2. **Verify Data Isolation:**
   - Create multiple recruiter accounts
   - Onboard employees to different recruiters
   - Verify employees see only their HRMS data

3. **Test Real-Time Sync:**
   - Submit claim from employee portal
   - Check HRMS admin panel
   - Approve claim from HRMS
   - Check employee portal

4. **Deploy:**
   - Deploy backend changes
   - Deploy frontend changes
   - Update environment variables if needed

## Important Notes

⚠️ **Critical**: Always filter by `recruiterId` in HRMS queries
⚠️ **Critical**: Always include `employeeId` AND `employeeEmail` in employee queries
⚠️ **Critical**: JWT token must contain `companyId` (recruiterId)

✅ **Benefits**:
- Complete data isolation between recruiters
- Real-time synchronization
- Dual identifier system (ID + Email) for reliability
- Scalable architecture for multiple HRMS instances

## Support

For issues or questions, refer to:
- Full documentation: `HRMS_EMPLOYEE_PORTAL_INTEGRATION.md`
- Backend code: `Backend/controllers/hrms/employeePortalController.js`
- Frontend code: `EmployeePortal/src/pages/`
