# HRMS Data Isolation - Visual Explanation

## BEFORE (The Problem)

```
┌─────────────────────────────────────────────────────────────────┐
│                        StaffInn System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Recruiter A (REC123)          Recruiter B (REC456)            │
│       │                              │                          │
│       │ Opens HRMS                   │ Opens HRMS              │
│       ↓                              ↓                          │
│  ┌─────────────────────────────────────────────────┐           │
│  │              HRMS System (Broken)                │           │
│  ├─────────────────────────────────────────────────┤           │
│  │                                                  │           │
│  │  Registration:                                   │           │
│  │  ❌ No recruiterId captured                      │           │
│  │  ❌ No duplicate check                           │           │
│  │                                                  │           │
│  │  JWT Token:                                      │           │
│  │  { userId, email, role }                         │           │
│  │  ❌ No recruiterId in token                      │           │
│  │                                                  │           │
│  │  Employee Queries:                               │           │
│  │  SELECT * FROM employees                         │           │
│  │  ❌ No filtering by recruiterId                  │           │
│  │                                                  │           │
│  └─────────────────────────────────────────────────┘           │
│                        ↓                                        │
│  ┌─────────────────────────────────────────────────┐           │
│  │         DynamoDB - HRMS Employees                │           │
│  ├─────────────────────────────────────────────────┤           │
│  │  EMP001 (no recruiterId) ← Recruiter A's        │           │
│  │  EMP002 (no recruiterId) ← Recruiter A's        │           │
│  │  EMP003 (no recruiterId) ← Recruiter B's        │           │
│  │  EMP004 (no recruiterId) ← Recruiter B's        │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  ❌ PROBLEM: Both recruiters see ALL employees!                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## AFTER (The Solution)

```
┌─────────────────────────────────────────────────────────────────┐
│                        StaffInn System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Recruiter A (REC123)          Recruiter B (REC456)            │
│       │                              │                          │
│       │ Opens HRMS                   │ Opens HRMS              │
│       │ (passes REC123)              │ (passes REC456)         │
│       ↓                              ↓                          │
│  ┌─────────────────────────────────────────────────┐           │
│  │              HRMS System (Fixed)                 │           │
│  ├─────────────────────────────────────────────────┤           │
│  │                                                  │           │
│  │  Step 1: Check Registration                      │           │
│  │  GET /check-recruiter/REC123                     │           │
│  │  ✅ Returns: isRegistered: true/false            │           │
│  │                                                  │           │
│  │  Step 2: Registration (if needed)                │           │
│  │  POST /register                                  │           │
│  │  { name, email, password, recruiterId }          │           │
│  │  ✅ Stores recruiterId with user                 │           │
│  │  ✅ Prevents duplicate registration              │           │
│  │                                                  │           │
│  │  Step 3: JWT Token                               │           │
│  │  { userId, email, role, recruiterId }            │           │
│  │  ✅ Includes recruiterId in token                │           │
│  │                                                  │           │
│  │  Step 4: Employee Operations                     │           │
│  │  - Create: Adds recruiterId from token           │           │
│  │  - Read: Filters by recruiterId from token       │           │
│  │  ✅ Automatic data isolation                     │           │
│  │                                                  │           │
│  └─────────────────────────────────────────────────┘           │
│           ↓                              ↓                      │
│  ┌──────────────────────┐    ┌──────────────────────┐         │
│  │  Recruiter A's View  │    │  Recruiter B's View  │         │
│  ├──────────────────────┤    ├──────────────────────┤         │
│  │  EMP001 (REC123)     │    │  EMP003 (REC456)     │         │
│  │  EMP002 (REC123)     │    │  EMP004 (REC456)     │         │
│  └──────────────────────┘    └──────────────────────┘         │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │         DynamoDB - HRMS Employees                │           │
│  ├─────────────────────────────────────────────────┤           │
│  │  EMP001 (recruiterId: REC123) ← Recruiter A's   │           │
│  │  EMP002 (recruiterId: REC123) ← Recruiter A's   │           │
│  │  EMP003 (recruiterId: REC456) ← Recruiter B's   │           │
│  │  EMP004 (recruiterId: REC456) ← Recruiter B's   │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  ✅ SOLUTION: Each recruiter sees ONLY their employees!        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Comparison

### BEFORE (Broken)
```
User Login → HRMS Registration → JWT Token (no recruiterId)
                                      ↓
                              Employee Creation
                                      ↓
                          Save to DB (no recruiterId)
                                      ↓
                              View Employees
                                      ↓
                          Query: SELECT * FROM employees
                                      ↓
                          ❌ Returns ALL employees
```

### AFTER (Fixed)
```
User Login → HRMS Registration → JWT Token (with recruiterId: REC123)
                                      ↓
                              Employee Creation
                                      ↓
                    Extract recruiterId from token: REC123
                                      ↓
                    Save to DB (with recruiterId: REC123)
                                      ↓
                              View Employees
                                      ↓
                    Extract recruiterId from token: REC123
                                      ↓
            Query: SELECT * FROM employees WHERE recruiterId = 'REC123'
                                      ↓
                    ✅ Returns ONLY recruiter's employees
```

## Registration Flow Comparison

### BEFORE (Broken)
```
┌──────────────────────────────────────────────────────────┐
│ Recruiter A Opens HRMS                                   │
│   ↓                                                       │
│ Shows Registration Form                                  │
│   ↓                                                       │
│ Fills: name, email, password                             │
│   ↓                                                       │
│ Creates HRMS User (no recruiterId)                       │
│   ↓                                                       │
│ ❌ No link to StaffInn recruiter                         │
│                                                           │
│ Recruiter B Opens HRMS                                   │
│   ↓                                                       │
│ Shows Registration Form (again!)                         │
│   ↓                                                       │
│ Fills: name, email, password                             │
│   ↓                                                       │
│ Creates Another HRMS User (no recruiterId)               │
│   ↓                                                       │
│ ❌ No link to StaffInn recruiter                         │
│ ❌ Can register multiple times                           │
│ ❌ Both see same employee pool                           │
└──────────────────────────────────────────────────────────┘
```

### AFTER (Fixed)
```
┌──────────────────────────────────────────────────────────┐
│ Recruiter A (REC123) Opens HRMS                          │
│   ↓                                                       │
│ Check: Is REC123 registered?                             │
│   ↓                                                       │
│ No → Shows Registration Form                             │
│   ↓                                                       │
│ Fills: name, email, password                             │
│   ↓                                                       │
│ Creates HRMS User (with recruiterId: REC123)             │
│   ↓                                                       │
│ ✅ Linked to StaffInn recruiter REC123                   │
│                                                           │
│ Recruiter B (REC456) Opens HRMS                          │
│   ↓                                                       │
│ Check: Is REC456 registered?                             │
│   ↓                                                       │
│ No → Shows Registration Form                             │
│   ↓                                                       │
│ Fills: name, email, password                             │
│   ↓                                                       │
│ Creates HRMS User (with recruiterId: REC456)             │
│   ↓                                                       │
│ ✅ Linked to StaffInn recruiter REC456                   │
│ ✅ Sees only their own employees                         │
│                                                           │
│ Recruiter A (REC123) Opens HRMS Again                    │
│   ↓                                                       │
│ Check: Is REC123 registered?                             │
│   ↓                                                       │
│ Yes → Shows Login Form (not registration!)               │
│   ↓                                                       │
│ ✅ Cannot register again                                 │
│ ✅ Sees only their own employees                         │
└──────────────────────────────────────────────────────────┘
```

## Security Model

### BEFORE (Insecure)
```
┌─────────────────────────────────────────┐
│  Client sends request                   │
│  ↓                                       │
│  JWT Token: { userId, email, role }     │
│  ↓                                       │
│  Backend receives request                │
│  ↓                                       │
│  Query: SELECT * FROM employees          │
│  ↓                                       │
│  ❌ No filtering                         │
│  ❌ Returns all data                     │
└─────────────────────────────────────────┘
```

### AFTER (Secure)
```
┌─────────────────────────────────────────────────────┐
│  Client sends request                               │
│  ↓                                                   │
│  JWT Token: { userId, email, role, recruiterId }    │
│  ↓                                                   │
│  Backend validates token                            │
│  ↓                                                   │
│  Extract recruiterId from token (not request body)  │
│  ↓                                                   │
│  Query: SELECT * FROM employees                     │
│         WHERE recruiterId = :tokenRecruiterId       │
│  ↓                                                   │
│  ✅ Automatic filtering                             │
│  ✅ Returns only recruiter's data                   │
│  ✅ Cannot be tampered with                         │
└─────────────────────────────────────────────────────┘
```

## Key Differences

| Aspect | BEFORE (Broken) | AFTER (Fixed) |
|--------|----------------|---------------|
| **recruiterId Storage** | ❌ Not stored | ✅ Stored with user |
| **JWT Token** | ❌ No recruiterId | ✅ Includes recruiterId |
| **Duplicate Registration** | ❌ Allowed | ✅ Prevented |
| **Employee Filtering** | ❌ No filtering | ✅ Auto-filtered |
| **Data Isolation** | ❌ Broken | ✅ Complete |
| **Security** | ❌ Insecure | ✅ Secure |
| **Scalability** | ❌ Limited | ✅ Unlimited recruiters |

## Summary

The fix ensures that:
1. ✅ Each recruiter has a unique HRMS account linked to their StaffInn ID
2. ✅ Recruiters can only register once
3. ✅ All employee data is automatically filtered by recruiterId
4. ✅ No data leakage between different recruiters
5. ✅ Security is enforced at the backend level
6. ✅ The solution is scalable and maintainable

The backend changes are complete. Frontend changes are needed to pass the recruiterId during registration and check if a recruiter is already registered.
