# HRMS-Employee Portal Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STAFFINN ECOSYSTEM                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│   HRMS Admin Portal      │         │   Employee Portal        │
│   (Recruiter/Admin)      │         │   (Employees)            │
├──────────────────────────┤         ├──────────────────────────┤
│ • Dashboard              │         │ • Dashboard              │
│ • Employee Management    │         │ • Attendance             │
│ • Attendance Management  │         │ • Leave                  │
│ • Leave Management       │         │ • Payroll                │
│ • Payroll Management     │         │ • Claim Management ✨    │
│ • Claim Management       │         │ • Tasks & Performance ✨ │
│ • Task Assignment        │         │ • Grievances ✨          │
│ • Grievance Management   │         │ • Organogram ✨          │
│ • Organization Chart     │         │ • Profile                │
└──────────┬───────────────┘         └──────────┬───────────────┘
           │                                    │
           │         ┌──────────────────────────┘
           │         │
           ▼         ▼
    ┌─────────────────────────────────┐
    │      Backend API Server         │
    │   (Node.js + Express)           │
    ├─────────────────────────────────┤
    │ • Authentication Middleware     │
    │ • Data Isolation Logic          │
    │ • Real-Time Sync                │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │      DynamoDB Tables            │
    ├─────────────────────────────────┤
    │ • HRMS-Claim-Management         │
    │ • HRMS-Task-Management          │
    │ • HRMS-Grievances               │
    │ • HRMS-Organization-Chart       │
    │ • staffinn-hrms-employees       │
    │ • staffinn-hrms-employee-users  │
    └─────────────────────────────────┘
```

## Data Flow: Claim Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAIM SUBMISSION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

Employee Portal                Backend API              HRMS Admin
     │                            │                          │
     │ 1. Submit Claim            │                          │
     │ {category, amount}         │                          │
     ├───────────────────────────>│                          │
     │                            │                          │
     │                            │ 2. Validate & Save       │
     │                            │ + recruiterId            │
     │                            │ + employeeId             │
     │                            │ + employeeEmail          │
     │                            │                          │
     │                            │ 3. Write to DB           │
     │                            │ [HRMS-Claim-Management]  │
     │                            │                          │
     │ 4. Success Response        │                          │
     │<───────────────────────────┤                          │
     │                            │                          │
     │                            │ 5. Admin Queries Claims  │
     │                            │<─────────────────────────┤
     │                            │                          │
     │                            │ 6. Filter by recruiterId │
     │                            │ Return matching claims   │
     │                            │──────────────────────────>│
     │                            │                          │
     │                            │ 7. Admin Approves        │
     │                            │<─────────────────────────┤
     │                            │                          │
     │                            │ 8. Update Status         │
     │                            │                          │
     │ 9. Employee Queries        │                          │
     │ Claims                     │                          │
     ├───────────────────────────>│                          │
     │                            │                          │
     │ 10. Return Updated Claims  │                          │
     │<───────────────────────────┤                          │
     │ (Status: Approved)         │                          │
```

## Data Flow: Task Assignment

```
┌─────────────────────────────────────────────────────────────────┐
│                    TASK ASSIGNMENT FLOW                         │
└─────────────────────────────────────────────────────────────────┘

HRMS Admin                 Backend API              Employee Portal
     │                            │                          │
     │ 1. Assign Task             │                          │
     │ {employeeId, title}        │                          │
     ├───────────────────────────>│                          │
     │                            │                          │
     │                            │ 2. Create Task           │
     │                            │ + recruiterId            │
     │                            │ + employeeId             │
     │                            │ + employeeEmail          │
     │                            │                          │
     │                            │ 3. Write to DB           │
     │                            │ [HRMS-Task-Management]   │
     │                            │                          │
     │ 4. Success Response        │                          │
     │<───────────────────────────┤                          │
     │                            │                          │
     │                            │ 5. Employee Queries      │
     │                            │<─────────────────────────┤
     │                            │                          │
     │                            │ 6. Filter by:            │
     │                            │ - recruiterId            │
     │                            │ - employeeId/email       │
     │                            │                          │
     │                            │ 7. Return Tasks          │
     │                            │──────────────────────────>│
     │                            │                          │
     │                            │ 8. Employee Updates      │
     │                            │<─────────────────────────┤
     │                            │                          │
     │                            │ 9. Update Task Status    │
     │                            │                          │
     │ 10. Admin Queries Tasks    │                          │
     ├───────────────────────────>│                          │
     │                            │                          │
     │ 11. Return Updated Tasks   │                          │
     │<───────────────────────────┤                          │
```

## Data Isolation Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-RECRUITER ISOLATION                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   Recruiter A        │         │   Recruiter B        │
│   (ID: rec-001)      │         │   (ID: rec-002)      │
└──────────┬───────────┘         └──────────┬───────────┘
           │                                │
           │                                │
    ┌──────▼──────┐                  ┌─────▼───────┐
    │  HRMS A     │                  │  HRMS B     │
    └──────┬──────┘                  └─────┬───────┘
           │                                │
    ┌──────▼──────────────┐          ┌─────▼──────────────┐
    │ Employees:          │          │ Employees:         │
    │ • E1 (emp-001)      │          │ • E3 (emp-003)     │
    │ • E2 (emp-002)      │          │ • E4 (emp-004)     │
    └─────────────────────┘          └────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Claims Table:                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Claim 1: recruiterId=rec-001, employeeId=emp-001       │   │
│  │ Claim 2: recruiterId=rec-001, employeeId=emp-002       │   │
│  │ Claim 3: recruiterId=rec-002, employeeId=emp-003       │   │
│  │ Claim 4: recruiterId=rec-002, employeeId=emp-004       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Query from E1:                                                 │
│  Filter: recruiterId=rec-001 AND employeeId=emp-001             │
│  Result: Claim 1 only ✅                                        │
│                                                                 │
│  Query from E3:                                                 │
│  Filter: recruiterId=rec-002 AND employeeId=emp-003             │
│  Result: Claim 3 only ✅                                        │
│                                                                 │
│  Query from Recruiter A:                                        │
│  Filter: recruiterId=rec-001                                    │
│  Result: Claim 1, Claim 2 ✅                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Organogram Hierarchy Display

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORGANOGRAM STRUCTURE                         │
└─────────────────────────────────────────────────────────────────┘

Database Structure:
┌────────────────────────────────────────────────────────────────┐
│ Node 1: CEO (level=0, parentId=null)                          │
│ Node 2: CTO (level=1, parentId=Node1)                         │
│ Node 3: Team Lead (level=2, parentId=Node2)                   │
│ Node 4: Employee E1 (level=3, parentId=Node3) ← Logged In     │
└────────────────────────────────────────────────────────────────┘

Employee Portal Display:
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  👤 CEO                                              │    │
│  │  Chief Executive Officer                             │    │
│  │  ceo@company.com                                     │    │
│  └──────────────────────────────────────────────────────┘    │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  👤 CTO                                              │    │
│  │  Chief Technology Officer                            │    │
│  │  cto@company.com                                     │    │
│  └──────────────────────────────────────────────────────┘    │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  👤 Team Lead                                        │    │
│  │  Engineering Team Lead                               │    │
│  │  lead@company.com                                    │    │
│  └──────────────────────────────────────────────────────┘    │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  👤 Employee E1 (You) ← HIGHLIGHTED                  │    │
│  │  Software Developer                                  │    │
│  │  e1@company.com                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMPLOYEE LOGIN FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Employee                   Backend                    Database
   │                          │                           │
   │ 1. Login Request         │                           │
   │ {email, password}        │                           │
   ├─────────────────────────>│                           │
   │                          │                           │
   │                          │ 2. Query User             │
   │                          │ [employee-users table]    │
   │                          ├──────────────────────────>│
   │                          │                           │
   │                          │ 3. Return User Data       │
   │                          │<──────────────────────────┤
   │                          │ {userId, employeeId,      │
   │                          │  companyId, email}        │
   │                          │                           │
   │                          │ 4. Verify Password        │
   │                          │                           │
   │                          │ 5. Generate JWT Token     │
   │                          │ {                         │
   │                          │   userId,                 │
   │                          │   employeeId,             │
   │                          │   companyId, ← recruiterId│
   │                          │   email,                  │
   │                          │   roleId                  │
   │                          │ }                         │
   │                          │                           │
   │ 6. Return Token          │                           │
   │<─────────────────────────┤                           │
   │                          │                           │
   │ 7. Store Token           │                           │
   │ (localStorage)           │                           │
   │                          │                           │
   │ 8. Subsequent Requests   │                           │
   │ Header: Bearer <token>   │                           │
   ├─────────────────────────>│                           │
   │                          │                           │
   │                          │ 9. Verify Token           │
   │                          │ Extract: companyId,       │
   │                          │          employeeId,      │
   │                          │          email            │
   │                          │                           │
   │                          │ 10. Query with Filters    │
   │                          │ recruiterId=companyId     │
   │                          │ employeeId=employeeId     │
   │                          │──────────────────────────>│
   │                          │                           │
   │                          │ 11. Return Filtered Data  │
   │                          │<──────────────────────────┤
   │                          │                           │
   │ 12. Response             │                           │
   │<─────────────────────────┤                           │
```

## Key Security Features

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                              │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Authentication
├─ JWT Token Validation
├─ Token Expiry Check
└─ User Active Status Check

Layer 2: Authorization
├─ Role-Based Permissions
├─ Permission Validation
└─ Resource Access Control

Layer 3: Data Isolation
├─ Recruiter ID Filter (companyId)
├─ Employee ID Filter
├─ Email Filter (Backup)
└─ Cross-Recruiter Prevention

Layer 4: Input Validation
├─ Required Field Validation
├─ Data Type Validation
└─ SQL Injection Prevention

Layer 5: Audit Trail
├─ Created At Timestamp
├─ Updated At Timestamp
└─ Action Logging
```

## Summary

✅ **Complete Integration**: All 4 new modules fully integrated
✅ **Data Isolation**: 100% separation between recruiters
✅ **Real-Time Sync**: Instant updates between HRMS and Employee Portal
✅ **Dual Identifier**: employeeId + employeeEmail for reliability
✅ **Secure**: Multi-layer security with JWT and filters
✅ **Scalable**: Supports unlimited recruiters and employees
