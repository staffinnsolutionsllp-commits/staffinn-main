# 🆔 Employee ID Configuration Guide

## ⚠️ IMPORTANT: Device Limitation

**MORX BioFace device sirf NUMERIC User IDs support karta hai!**

```
Device User ID Field:
├── Allowed: 1, 2, 3, 1001, 2024, etc.
└── NOT Allowed: EMP001, STF-001, A123, etc.
```

---

## ✅ Option 1: Pure Numeric IDs (RECOMMENDED)

**Sabse simple aur reliable approach**

### Configuration:

```
HRMS aur Device dono mein SAME numeric ID use karo
```

### Example:

```
┌─────────────────────────────────────────────┐
│ HRMS Onboarding                             │
├─────────────────────────────────────────────┤
│ Employee ID: 1001                           │
│ Name: Rahul Kumar                           │
│ Department: IT                              │
│ Phone: 9876543210                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Device Enrollment                           │
├─────────────────────────────────────────────┤
│ User ID: 1001 (SAME!)                       │
│ Name: Rahul Kumar                           │
│ Fingerprint: Scan                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Attendance Flow                             │
├─────────────────────────────────────────────┤
│ Device sends: { employeeId: "1001" }        │
│ Backend checks: 1001 exists in HRMS? ✓      │
│ Attendance saved: 1001 - Rahul Kumar        │
└─────────────────────────────────────────────┘
```

### Employee ID Format:

```
Department-wise numbering:
├── IT Department: 1001, 1002, 1003, ...
├── HR Department: 2001, 2002, 2003, ...
├── Sales Department: 3001, 3002, 3003, ...
└── Admin Department: 4001, 4002, 4003, ...

OR

Sequential numbering:
├── 1001 - First employee
├── 1002 - Second employee
├── 1003 - Third employee
└── ...
```

### Pros:
- ✅ Simple aur straightforward
- ✅ No mapping needed
- ✅ No confusion
- ✅ Easy to manage
- ✅ Device directly supports

### Cons:
- ❌ Alphanumeric IDs nahi use kar sakte

---

## ✅ Option 2: Alphanumeric IDs with Mapping

**Agar aap HRMS mein alphanumeric IDs use karna chahte ho**

### Configuration:

```
HRMS: Alphanumeric (EMP001)
Device: Numeric (1001)
Backend: Mapping table
```

### Example:

```
┌─────────────────────────────────────────────┐
│ HRMS Onboarding                             │
├─────────────────────────────────────────────┤
│ Employee ID: EMP001 (Alphanumeric)          │
│ Device ID: 1001 (Numeric - for mapping)     │
│ Name: Rahul Kumar                           │
│ Department: IT                              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Device Enrollment                           │
├─────────────────────────────────────────────┤
│ User ID: 1001 (Numeric only)                │
│ Name: Rahul Kumar                           │
│ Fingerprint: Scan                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Backend Mapping                             │
├─────────────────────────────────────────────┤
│ 1001 → EMP001                               │
│ 1002 → EMP002                               │
│ 1003 → EMP003                               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Attendance Flow                             │
├─────────────────────────────────────────────┤
│ Device sends: { employeeId: "1001" }        │
│ Backend maps: 1001 → EMP001                 │
│ Backend checks: EMP001 exists in HRMS? ✓    │
│ Attendance saved: EMP001 - Rahul Kumar      │
└─────────────────────────────────────────────┘
```

### Backend Configuration:

**File:** `Backend/routes/hrms/biometricWebhookRoutes.js`

```javascript
// Employee ID mapping (Device numeric → HRMS alphanumeric)
const EMPLOYEE_ID_MAP = {
    '1001': 'EMP001',
    '1002': 'EMP002',
    '1003': 'EMP003',
    '1004': 'EMP004',
    // Add more mappings as needed
};
```

### HRMS Database Schema:

```javascript
// staffinn-hrms-employees table
{
  employeeId: "EMP001",        // Primary key (alphanumeric)
  deviceId: "1001",            // Device numeric ID
  name: "Rahul Kumar",
  department: "IT",
  phone: "9876543210"
}
```

### Pros:
- ✅ HRMS mein readable IDs (EMP001)
- ✅ Professional looking
- ✅ Department codes use kar sakte ho

### Cons:
- ❌ Extra mapping maintain karna padega
- ❌ Backend code update needed
- ❌ Mapping errors ka risk

---

## 🎯 Recommended: Option 1 (Pure Numeric)

**Kyun?**
1. Simple aur reliable
2. No extra configuration
3. No mapping errors
4. Easy to troubleshoot
5. Device directly supports

---

## 📋 Implementation Steps

### For Option 1 (Pure Numeric):

#### Step 1: HRMS Onboarding
```
1. Login to HRMS
2. Go to Onboarding
3. Add Employee:
   ├── Employee ID: 1001 ← Numeric only
   ├── Name: Rahul Kumar
   ├── Department: IT
   └── Save
```

#### Step 2: Device Enrollment
```
1. Device → Menu → User Management → Enroll
2. User ID: 1001 ← Type using device keypad
3. Part: [1]
4. Name: Rahul Kumar ← Optional
5. Level: User
6. OK → Scan fingerprint
7. Save
```

#### Step 3: Test
```
1. Employee fingerprint scan
2. Device: "1001 - Verified ✓"
3. Check logs: pm2 logs staffinn-backend
4. Expected: "Attendance marked: Rahul Kumar (1001)"
```

---

### For Option 2 (Alphanumeric with Mapping):

#### Step 1: Update Backend Code
```bash
# Edit biometricWebhookRoutes.js
nano /home/ec2-user/staffinn-backend/routes/hrms/biometricWebhookRoutes.js

# Add mapping:
const EMPLOYEE_ID_MAP = {
    '1001': 'EMP001',
    '1002': 'EMP002',
    // Add all employees
};

# Restart server
pm2 restart staffinn-backend
```

#### Step 2: HRMS Onboarding
```
1. Add Employee:
   ├── Employee ID: EMP001 ← Alphanumeric
   ├── Device ID: 1001 ← Numeric (for mapping)
   ├── Name: Rahul Kumar
   └── Save
```

#### Step 3: Device Enrollment
```
1. Device → Enroll
2. User ID: 1001 ← Numeric (matches deviceId)
3. Scan fingerprint
4. Save
```

#### Step 4: Test
```
1. Employee scan
2. Device sends: 1001
3. Backend maps: 1001 → EMP001
4. Attendance saved: EMP001
```

---

## 🔧 Device Configuration (Host PC Address)

### Current Settings (From Screenshot):

```
✅ Event Transfer Mode: TCP/IP (Perfect!)
✅ Host PC Port: 4001 (Perfect!)
❌ Host PC Addr: (Empty - Need to add)
```

### How to Add EC2 IP:

```
1. Get EC2 Public IP:
   ssh ec2-user@<ec2-ip>
   curl http://checkip.amazonaws.com
   
   Example output: 13.232.45.67

2. Device Settings:
   Menu → Communication → Communication Settings
   
3. Select "Host PC Addr"
   
4. Device keypad open hoga
   
5. Enter IP: 13.232.45.67
   ├── Press: 1, 3, ., 2, 3, 2, ., 4, 5, ., 6, 7
   └── Use device numeric keypad
   
6. Press OK
   
7. Save Settings
   
8. Restart Device
```

### Final Device Settings:

```
┌─────────────────────────────────────┐
│ Communication Password: No          │
│ Server-Client Mode: LogClient       │
│ Event Transfer Mode: TCP/IP         │
│ Host PC Addr: 13.232.45.67         │ ← Added
│ Host PC Port: 4001                  │
└─────────────────────────────────────┘
```

---

## ✅ Complete Example (Option 1 - Recommended)

### Employee 1:
```
HRMS:
├── Employee ID: 1001
├── Name: Rahul Kumar
└── Department: IT

Device:
├── User ID: 1001
└── Fingerprint: Registered

Attendance:
├── Device sends: 1001
├── Backend validates: 1001 exists ✓
└── Saved: 1001 - Rahul Kumar - Present
```

### Employee 2:
```
HRMS:
├── Employee ID: 1002
├── Name: Priya Singh
└── Department: HR

Device:
├── User ID: 1002
└── Fingerprint: Registered

Attendance:
├── Device sends: 1002
├── Backend validates: 1002 exists ✓
└── Saved: 1002 - Priya Singh - Present
```

---

## 🎯 Decision Matrix

| Feature | Option 1 (Numeric) | Option 2 (Mapping) |
|---------|-------------------|-------------------|
| Simplicity | ✅ Very Simple | ❌ Complex |
| Setup Time | ✅ 5 minutes | ❌ 30 minutes |
| Maintenance | ✅ Easy | ❌ Needs updates |
| Error Risk | ✅ Low | ⚠️ Medium |
| Professional Look | ⚠️ Numbers only | ✅ EMP001 format |
| Device Support | ✅ Direct | ⚠️ Via mapping |

---

## 📞 Recommendation

**Use Option 1 (Pure Numeric IDs)**

Reasons:
1. Device limitation (numeric only)
2. Simple to implement
3. Easy to maintain
4. No mapping errors
5. Works out of the box

**Employee ID Format:**
```
1001, 1002, 1003, ... (Sequential)
OR
1001-1999 (IT Dept)
2001-2999 (HR Dept)
3001-3999 (Sales Dept)
```

---

## 🚀 Next Steps

1. ✅ Decide: Option 1 or Option 2
2. ✅ Configure Host PC Addr with EC2 IP
3. ✅ Register employees (numeric IDs)
4. ✅ Test attendance
5. ✅ Go live!

**Questions? Check QUICK_REFERENCE.md**
