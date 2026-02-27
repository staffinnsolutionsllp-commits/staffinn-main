# 🎯 Biometric Bridge Software + HRMS Integration Plan

## ✅ Current Status (What's Already Done)

### 1. **Bridge Software** ✅ COMPLETE
- **Location**: `D:\StaffInn-Attendance-Bridge\`
- **Status**: Fully functional, tested with device
- **Features**:
  - Device connection (192.168.1.24:5005)
  - Offline SQLite storage
  - Auto-sync to backend
  - Company ID + API Key authentication UI
- **Endpoint Used**: `POST /api/v1/biometric/device-punch`

### 2. **Backend API** ✅ DEPLOYED
- **Server**: EC2 (3.109.94.100:4001)
- **Biometric Endpoint**: `/api/v1/biometric/device-punch` ✅ Working
- **HRMS Routes**: All deployed and working
  - `/api/v1/hrms/auth/*` - Login/Register
  - `/api/v1/hrms/employees/*` - Employee management  
  - `/api/v1/hrms/attendance/*` - Attendance
  - `/api/v1/hrms/candidates/*` - Recruitment (used for employees)
  - `/api/v1/hrms/organization/*` - Org chart
  - `/api/v1/hrms/leaves/*` - Leave management

### 3. **HRMS Frontend** ✅ EXISTS
- **Location**: `D:\Staffinn-main\HRMS Staffinn\Staffinn HR Manager_files\`
- **Tech Stack**: React + TypeScript + Vite
- **Features Already Working**:
  - ✅ Employee Onboarding (Onboarding.tsx)
  - ✅ Manual Attendance Marking (Attendance.tsx)
  - ✅ Organogram/Hierarchy
  - ✅ Leave Management
  - ✅ Grievances
  - ✅ Dashboard with stats
- **API Connection**: `http://localhost:4001/api/v1/hrms`

### 4. **Database Tables** ✅ EXIST
Based on your HRMS code, these tables are already being used:
- `staffinn-hrms-candidates` (used as employees table)
- `staffinn-hrms-attendance` (attendance records)
- `staffinn-hrms-organization` (org chart)
- `staffinn-hrms-leaves` (leave management)
- `staffinn-hrms-grievances` (complaints)

---

## ❌ What's Missing (Integration Gaps)

### **Gap 1: Company ID & API Key System**

**Problem**: Bridge software asks for Company ID + API Key but there's NO system to generate them!

**Current Situation**:
- Bridge app has login UI asking for credentials
- No backend endpoint to validate these credentials
- No table to store company/organization data
- No API key generation system

**What Needs to Be Built**:

#### A. New DynamoDB Table: `staffinn-hrms-companies`
```javascript
{
  companyId: "COMP-12345",           // Primary Key
  companyName: "ABC Corporation",
  apiKey: "sk_live_abc123xyz...",    // Secret key for bridge auth
  adminEmail: "admin@abc.com",
  adminUserId: "user-123",           // Link to HRMS user
  subscription: "active",
  devices: [
    {
      deviceId: "192.168.1.24",
      deviceName: "Main Office Device",
      macAddress: "00:23:79:bb:a1:ab",
      registeredAt: "2026-02-20T10:00:00Z",
      status: "active"
    }
  ],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-02-20T00:00:00Z"
}
```

#### B. New Backend Routes Needed:

**File**: `Backend/routes/hrms/hrmsCompanyRoutes.js`
```javascript
// POST /api/v1/hrms/company/register
// Register new company and generate API key

// GET /api/v1/hrms/company/profile
// Get company details

// POST /api/v1/hrms/company/regenerate-key
// Regenerate API key

// POST /api/v1/hrms/company/register-device
// Register new biometric device

// GET /api/v1/hrms/company/devices
// List all registered devices
```

#### C. New Controller: `Backend/controllers/hrms/hrmsCompanyController.js`
Functions needed:
- `registerCompany()` - Create company + generate API key
- `getCompanyProfile()` - Get company details
- `regenerateApiKey()` - Generate new API key
- `registerDevice()` - Add device to company
- `getDevices()` - List devices

#### D. Bridge Software Authentication Update:

**File**: `D:\StaffInn-Attendance-Bridge\src\services\authService.js`

Current code (line ~15):
```javascript
// TODO: Replace with actual API call
return {
  success: true,
  companyId,
  companyName: 'Demo Company'
};
```

**Needs to become**:
```javascript
const response = await fetch('http://3.109.94.100:4001/api/v1/biometric/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ companyId, apiKey })
});

const data = await response.json();
if (data.success) {
  return {
    success: true,
    companyId: data.companyId,
    companyName: data.companyName
  };
}
```

---

### **Gap 2: Employee ID Sync Between HRMS & Biometric Device**

**Problem**: HRMS generates random employee IDs but device needs numeric IDs (1001, 1002, etc.)

**Current Situation**:
- HRMS creates employees with UUID: `emp-abc-123-xyz`
- Biometric device stores: `1001`, `1002`, `1003`
- No mapping between them!

**Solution Options**:

#### Option A: Add Biometric ID Field (RECOMMENDED)
Update employee table to include `biometricId`:

**File**: `Backend/controllers/hrms/hrmsCandidateController.js`
```javascript
const employeeData = {
  employeeId: uuidv4(),              // HRMS internal ID
  biometricId: "1001",               // Device ID (numeric)
  name: "John Doe",
  email: "john@company.com",
  // ... other fields
};
```

**HRMS Frontend Update**:
`HRMS Staffinn/Staffinn HR Manager_files/src/components/Onboarding.tsx`

Add field in form (around line 50):
```typescript
const [formData, setFormData] = useState({
  // ... existing fields
  biometricId: '',  // NEW FIELD
  // ... rest of fields
});
```

Add input in Step 4 (around line 600):
```tsx
<input 
  type="text" 
  placeholder="Biometric ID (e.g., 1001) *" 
  value={formData.biometricId}
  onChange={(e) => handleInputChange('biometricId', e.target.value)}
  className="p-3 border rounded-lg" 
  required 
/>
```

#### Option B: Auto-generate Sequential IDs
Backend automatically assigns next available number:
- First employee: 1001
- Second employee: 1002
- etc.

---

### **Gap 3: Biometric Webhook Needs Company Validation**

**Problem**: Current webhook doesn't validate which company the attendance belongs to

**Current Code** (`Backend/routes/hrms/biometricWebhookRoutes.js`):
```javascript
router.post('/device-punch', async (req, res) => {
  const { employeeId, deviceId, timestamp, punchType } = req.body;
  
  // ❌ No company validation!
  // ❌ No API key check!
  
  // Check employee exists
  const employee = await getEmployee(employeeId);
  // Save attendance...
});
```

**Needs to become**:
```javascript
router.post('/device-punch', async (req, res) => {
  const { companyId, apiKey, employeeId, deviceId, timestamp, punchType } = req.body;
  
  // ✅ Step 1: Validate company + API key
  const company = await validateCompany(companyId, apiKey);
  if (!company) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  // ✅ Step 2: Check device is registered to this company
  const deviceRegistered = company.devices.find(d => d.deviceId === deviceId);
  if (!deviceRegistered) {
    return res.status(403).json({ success: false, message: 'Device not registered' });
  }
  
  // ✅ Step 3: Check employee belongs to this company
  const employee = await getEmployee(employeeId, companyId);
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }
  
  // ✅ Step 4: Save attendance with company context
  await saveAttendance({
    companyId,
    employeeId,
    deviceId,
    timestamp,
    punchType
  });
});
```

---

### **Gap 4: Bridge Software Needs to Send Company Context**

**Problem**: Bridge currently sends only employee data, not company info

**Current Code** (`D:\StaffInn-Attendance-Bridge\src\services\syncService.js`):
```javascript
const payload = {
  employeeId: record.employeeId,
  deviceId: record.deviceId,
  timestamp: record.timestamp,
  punchType: record.punchType
};
```

**Needs to become**:
```javascript
const companyId = localStorage.getItem('companyId');
const apiKey = localStorage.getItem('apiKey');

const payload = {
  companyId,        // ✅ Add company context
  apiKey,           // ✅ Add authentication
  employeeId: record.employeeId,
  deviceId: record.deviceId,
  timestamp: record.timestamp,
  punchType: record.punchType
};
```

---

## 🔄 Complete Integration Flow (After Fixes)

### **Setup Phase** (One-time per company):

1. **Admin registers company in HRMS**:
   ```
   POST /api/v1/hrms/company/register
   {
     "companyName": "ABC Corp",
     "adminEmail": "admin@abc.com",
     "adminPassword": "secure123"
   }
   
   Response:
   {
     "success": true,
     "companyId": "COMP-12345",
     "apiKey": "sk_live_abc123xyz..."
   }
   ```

2. **Admin adds employees with biometric IDs**:
   ```
   POST /api/v1/hrms/candidates
   {
     "name": "John Doe",
     "email": "john@abc.com",
     "biometricId": "1001",  // ← Device ID
     "department": "IT",
     ...
   }
   ```

3. **Admin registers biometric device**:
   ```
   POST /api/v1/hrms/company/register-device
   {
     "deviceId": "192.168.1.24",
     "deviceName": "Main Office",
     "macAddress": "00:23:79:bb:a1:ab"
   }
   ```

4. **Admin downloads bridge software**:
   - Install on office computer
   - Enter Company ID: `COMP-12345`
   - Enter API Key: `sk_live_abc123xyz...`
   - Configure device IP: `192.168.1.24`

### **Daily Operation**:

1. **Employee punches on device** (ID: 1001)
2. **Bridge software fetches attendance** (every 5 min)
3. **Bridge sends to backend**:
   ```
   POST /api/v1/biometric/device-punch
   {
     "companyId": "COMP-12345",
     "apiKey": "sk_live_abc123xyz...",
     "employeeId": "1001",
     "deviceId": "192.168.1.24",
     "timestamp": "2026-02-20T09:15:00Z",
     "punchType": "IN"
   }
   ```
4. **Backend validates**:
   - ✅ Company exists
   - ✅ API key matches
   - ✅ Device registered
   - ✅ Employee 1001 exists in company
5. **Backend saves attendance** to DynamoDB
6. **HRMS dashboard shows real-time data**

---

## 📋 Implementation Checklist

### **Phase 1: Company Management System** (Priority: HIGH)

- [ ] Create `staffinn-hrms-companies` DynamoDB table
- [ ] Create `hrmsCompanyController.js`
- [ ] Create `hrmsCompanyRoutes.js`
- [ ] Add company registration endpoint
- [ ] Add API key generation logic (use crypto.randomBytes)
- [ ] Add device registration endpoint
- [ ] Test company creation via Postman

### **Phase 2: Employee Biometric ID** (Priority: HIGH)

- [ ] Add `biometricId` field to candidate schema
- [ ] Update `hrmsCandidateController.js` to handle biometricId
- [ ] Update HRMS Onboarding form to include biometricId input
- [ ] Add validation: biometricId must be numeric
- [ ] Add uniqueness check: no duplicate biometricIds per company
- [ ] Test employee creation with biometricId

### **Phase 3: Webhook Security** (Priority: HIGH)

- [ ] Update `biometricWebhookRoutes.js` to require companyId + apiKey
- [ ] Add company validation middleware
- [ ] Add device registration check
- [ ] Add employee-company relationship check
- [ ] Update attendance save to include companyId
- [ ] Test webhook with valid/invalid credentials

### **Phase 4: Bridge Software Updates** (Priority: MEDIUM)

- [ ] Update `authService.js` to call real API
- [ ] Update `syncService.js` to send companyId + apiKey
- [ ] Store credentials securely in localStorage
- [ ] Add error handling for auth failures
- [ ] Test end-to-end flow

### **Phase 5: HRMS UI Enhancements** (Priority: LOW)

- [ ] Add "Company Settings" page
- [ ] Show Company ID + API Key (with copy button)
- [ ] Add "Regenerate API Key" button
- [ ] Add "Registered Devices" list
- [ ] Add "Download Bridge Software" button
- [ ] Add setup instructions/wizard

### **Phase 6: Production Deployment** (Priority: MEDIUM)

- [ ] Fix EC2 Security Group (open port 4001)
- [ ] Add SSL certificate
- [ ] Update bridge software to use HTTPS
- [ ] Update HRMS API URL to production
- [ ] Test complete flow in production

---

## 🚀 Quick Start (What to Do First)

### **Step 1: Create Company Table** (30 mins)
```bash
# SSH to EC2
ssh -i D:\staffinn-key.pem ec2-user@3.109.94.100

# Run script
node Backend/scripts/create-hrms-companies-table.js
```

### **Step 2: Add Company Routes** (1 hour)
Create these files:
- `Backend/controllers/hrms/hrmsCompanyController.js`
- `Backend/routes/hrms/hrmsCompanyRoutes.js`
- Register route in `server.js`

### **Step 3: Test Company Registration** (15 mins)
```bash
curl -X POST http://localhost:4001/api/v1/hrms/company/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company",
    "adminEmail": "admin@test.com",
    "adminPassword": "test123"
  }'
```

### **Step 4: Update Biometric Webhook** (30 mins)
Add company validation to `biometricWebhookRoutes.js`

### **Step 5: Update Bridge Software** (30 mins)
Update `authService.js` and `syncService.js`

### **Step 6: Test End-to-End** (30 mins)
1. Create company
2. Add employee with biometricId
3. Configure bridge with credentials
4. Punch on device
5. Check HRMS dashboard

---

## 💡 Key Insights

1. **Your HRMS is 90% ready** - Just needs company/API key system
2. **Bridge software is complete** - Just needs real API integration
3. **Backend routes exist** - Just need company validation layer
4. **Main gap is authentication** - No way to validate bridge software currently
5. **Employee ID mapping is critical** - Must link HRMS ID ↔ Device ID

---

## 🎯 Recommended Approach

**Start with Company Management first**, then everything else falls into place:

1. Build company registration system
2. Generate API keys
3. Update webhook to validate keys
4. Update bridge to use real auth
5. Add biometric ID field to employees
6. Test complete flow

**Estimated Time**: 1-2 days for full integration

---

## 📞 Next Steps

**Tell me which phase you want to start with:**
- Phase 1: Company Management (recommended)
- Phase 2: Employee Biometric ID
- Phase 3: Webhook Security
- Phase 4: Bridge Updates

I'll create the exact code files you need! 🚀
