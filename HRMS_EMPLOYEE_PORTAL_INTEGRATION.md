# HRMS - Employee Portal Integration Guide

## Overview

This document describes the complete integration between Staffinn HRMS (Admin/Recruiter Portal) and the Employee HRMS Portal with proper data isolation and real-time synchronization.

## Key Features Implemented

### 1. Employee Portal Sidebar (Updated)

The Employee Portal now includes the following modules:

- **Dashboard** - Overview of attendance, leaves, and tasks
- **Attendance** - View and mark attendance
- **Leave** - Apply and manage leaves
- **Payroll** - View payslips
- **Claim Management** - Submit and track claims
- **Tasks & Performance** - View assigned tasks and performance ratings
- **Grievances** - Submit and track grievances
- **Organogram** - View organizational hierarchy
- **Profile** - Manage personal information

### 2. Data Isolation Strategy

**Critical Rule**: Each employee can ONLY access data from the HRMS where they were onboarded.

**Matching Logic**:
- `recruiterId` / `companyId` - Identifies which HRMS the employee belongs to
- `employeeId` - Unique employee identifier
- `employeeEmail` - Employee email address (backup identifier)

**Filter Pattern**:
```javascript
FilterExpression: 'recruiterId = :rid AND (employeeId = :eid OR employeeEmail = :email)'
```

### 3. Module Details

#### A. Organogram (Auto-Fetch Hierarchy)

**Employee Portal**: `/organogram`
**API Endpoint**: `GET /api/employee-portal/organogram`

**Functionality**:
- Automatically fetches reporting hierarchy from HRMS database
- Shows logged-in employee at the lowest level
- Displays all managers and team leads above them
- Only shows hierarchy from the employee's HRMS

**Data Flow**:
1. Employee logs in with email/employeeId
2. System fetches all org nodes for that recruiterId
3. Builds hierarchy path from root to employee
4. Displays hierarchy with employee highlighted

#### B. Claim Management Integration

**Employee Portal**: `/claims`
**API Endpoints**:
- `GET /api/employee-portal/claims` - Get employee's claims
- `GET /api/employee-portal/claims/categories` - Get claim categories
- `POST /api/employee-portal/claims` - Submit new claim

**HRMS Admin View**:
- Claims appear in HRMS Claim Management table
- Filtered by recruiterId
- Admin can approve/reject from HRMS

**Real-Time Sync**:
- Employee submits claim → Instantly visible in HRMS
- Admin updates status → Visible in employee portal

**Data Structure**:
```javascript
{
  claimId: "unique-id",
  recruiterId: "recruiter-id",
  employeeId: "employee-id",
  employeeEmail: "employee@email.com",
  category: "Travel",
  amount: 5000,
  status: "Pending",
  submittedDate: "2025-01-15T10:30:00Z"
}
```

#### C. Tasks & Performance Integration

**Employee Portal**: `/tasks`
**API Endpoints**:
- `GET /api/employee-portal/tasks` - Get assigned tasks
- `PUT /api/employee-portal/tasks/:taskId` - Update task status
- `GET /api/employee-portal/performance/ratings` - Get performance ratings

**HRMS Admin Flow**:
1. Admin assigns task in HRMS with employeeId/employeeEmail
2. Task saved with recruiterId
3. Employee sees task in real-time in portal
4. Employee updates progress
5. Admin sees updates in HRMS

**Data Structure**:
```javascript
{
  taskId: "unique-id",
  recruiterId: "recruiter-id",
  employeeId: "employee-id",
  employeeEmail: "employee@email.com",
  title: "Complete Project Report",
  status: "In Progress",
  completionPercentage: 50,
  deadline: "2025-01-20"
}
```

#### D. Grievances Integration

**Employee Portal**: `/grievances`
**API Endpoints**:
- `GET /api/employee-portal/grievances` - Get employee's grievances
- `POST /api/employee-portal/grievances` - Submit new grievance

**HRMS Admin View**:
- Grievances appear in HRMS Grievance Management
- Filtered by recruiterId
- Shows employee details and grievance content

**Data Structure**:
```javascript
{
  grievanceId: "unique-id",
  recruiterId: "recruiter-id",
  employeeId: "employee-id",
  employeeEmail: "employee@email.com",
  title: "Workplace Issue",
  category: "Work Environment",
  status: "submitted",
  submittedDate: "2025-01-15T10:30:00Z"
}
```

## Authentication & Authorization

### Employee Authentication

**Login Flow**:
1. Employee logs in with email and password
2. System validates credentials from `staffinn-hrms-employee-users` table
3. JWT token generated with:
   - `userId` (employeeId)
   - `employeeId`
   - `companyId` (recruiterId)
   - `email`
   - `roleId`

**Middleware**: `authenticateEmployee`
- Validates JWT token
- Attaches user object to request
- Ensures user is active

### Data Access Control

Every API endpoint filters data using:
```javascript
const { employeeId, companyId, email } = req.user;

// Filter pattern
FilterExpression: 'recruiterId = :rid AND (employeeId = :eid OR employeeEmail = :email)'
ExpressionAttributeValues: {
  ':rid': companyId,
  ':eid': employeeId,
  ':email': email
}
```

## Database Tables

### 1. HRMS-Claim-Management
- Stores claims from both HRMS and Employee Portal
- Partition Key: `claimmanagement`
- Sort Key: `claimId`
- GSI: `recruiterId-index`

### 2. HRMS-Task-Management
- Stores tasks and performance ratings
- Partition Key: `taskId`
- GSI: `recruiterId-index`, `employeeId-index`

### 3. HRMS-Grievances
- Stores employee grievances
- Partition Key: `grievanceId`
- GSI: `recruiterId-index`, `employeeId-index`

### 4. HRMS-Organization-Chart
- Stores organizational hierarchy
- Partition Key: `nodeId`
- GSI: `recruiterId-index`

### 5. staffinn-hrms-employees
- Stores employee master data
- Partition Key: `employeeId`
- GSI: `recruiterId-index`

### 6. staffinn-hrms-employee-users
- Stores employee login credentials
- Partition Key: `userId`
- Contains: `employeeId`, `companyId`, `email`, `roleId`

## Real-Time Synchronization

All modules work in real-time:

**Employee → HRMS**:
- Employee submits claim → HRMS claim table updated instantly
- Employee updates task → HRMS sees update instantly
- Employee submits grievance → HRMS grievance panel updated instantly

**HRMS → Employee**:
- Admin assigns task → Employee portal task list updated instantly
- Admin approves claim → Employee sees status change instantly
- Admin updates grievance status → Employee sees update instantly

## Multi-Recruiter Isolation

**Scenario**:
- Recruiter A → HRMS A → Employees (E1, E2, E3)
- Recruiter B → HRMS B → Employees (E4, E5, E6)

**Isolation Rules**:
- Employee E1 can ONLY see data from HRMS A
- Employee E4 can ONLY see data from HRMS B
- Recruiter A can ONLY see E1, E2, E3 activities
- Recruiter B can ONLY see E4, E5, E6 activities

**Implementation**:
- Every query includes `recruiterId` filter
- Employee authentication includes `companyId` (recruiterId)
- All data writes include `recruiterId`

## API Endpoints Summary

### Employee Portal APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/employee-portal/claims` | GET | Get employee claims |
| `/api/employee-portal/claims/categories` | GET | Get claim categories |
| `/api/employee-portal/claims` | POST | Submit new claim |
| `/api/employee-portal/tasks` | GET | Get assigned tasks |
| `/api/employee-portal/tasks/:taskId` | PUT | Update task status |
| `/api/employee-portal/performance/ratings` | GET | Get performance ratings |
| `/api/employee-portal/grievances` | GET | Get employee grievances |
| `/api/employee-portal/grievances` | POST | Submit new grievance |
| `/api/employee-portal/organogram` | GET | Get organizational hierarchy |

### HRMS Admin APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hrms/claims` | GET | Get all claims (filtered by recruiterId) |
| `/api/hrms/claims/:claimId/status` | PUT | Update claim status |
| `/api/hrms/tasks/assign` | POST | Assign task to employees |
| `/api/hrms/tasks` | GET | Get all tasks (filtered by recruiterId) |
| `/api/hrms/grievances` | GET | Get all grievances (filtered by recruiterId) |
| `/api/hrms/grievances/:id/status` | PUT | Update grievance status |
| `/api/hrms/organization/chart` | GET | Get organization chart |

## Testing the Integration

### 1. Test Claim Flow
```bash
# Employee submits claim
POST /api/employee-portal/claims
{
  "category": "Travel",
  "amount": 5000,
  "description": "Client meeting travel"
}

# Verify in HRMS
GET /api/hrms/claims?employeeId=<employee-id>

# Admin approves
PUT /api/hrms/claims/<claim-id>/status
{
  "status": "Approved"
}

# Verify in Employee Portal
GET /api/employee-portal/claims
```

### 2. Test Task Flow
```bash
# Admin assigns task
POST /api/hrms/tasks/assign
{
  "employeeIds": ["emp-123"],
  "title": "Complete Report",
  "deadline": "2025-01-20"
}

# Verify in Employee Portal
GET /api/employee-portal/tasks

# Employee updates task
PUT /api/employee-portal/tasks/<task-id>
{
  "status": "In Progress",
  "completionPercentage": 50
}

# Verify in HRMS
GET /api/hrms/tasks?employeeId=emp-123
```

## Security Considerations

1. **JWT Token Validation**: All endpoints require valid JWT token
2. **Data Isolation**: Every query filters by recruiterId
3. **Employee Verification**: Employees can only access their own data
4. **Role-Based Access**: Permissions checked via roleId
5. **Email + ID Matching**: Dual identifier system for reliability

## Deployment Checklist

- [ ] Update Employee Portal frontend with new pages
- [ ] Deploy updated backend controllers
- [ ] Update API routes
- [ ] Test data isolation between recruiters
- [ ] Verify real-time sync for all modules
- [ ] Test organogram hierarchy display
- [ ] Validate claim submission and approval flow
- [ ] Test task assignment and updates
- [ ] Verify grievance submission and tracking

## Troubleshooting

### Issue: Employee sees data from wrong HRMS
**Solution**: Check that `companyId` in JWT token matches `recruiterId` in database

### Issue: Claims not appearing in HRMS
**Solution**: Verify `recruiterId` is correctly set when creating claim

### Issue: Organogram not showing hierarchy
**Solution**: Ensure organization chart nodes have correct `recruiterId` and `parentId`

### Issue: Tasks not visible to employee
**Solution**: Check that task has either `employeeId` or `employeeEmail` matching the logged-in employee

## Conclusion

This integration provides a complete, secure, and real-time connection between Staffinn HRMS and Employee Portal with proper data isolation ensuring each employee only accesses their own HRMS data.
