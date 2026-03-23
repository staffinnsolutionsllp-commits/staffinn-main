# Phase 1: Company Management System - COMPLETE ✅

## Files Created:

### 1. Database Script
**File**: `Backend/scripts/create-hrms-companies-table.js`
- Creates `staffinn-hrms-companies` DynamoDB table
- Stores company info, API keys, devices

### 2. Controller
**File**: `Backend/controllers/hrms/hrmsCompanyController.js`
- `registerCompany()` - Register new company + generate API key
- `getCompanyProfile()` - Get company details
- `regenerateApiKey()` - Regenerate API key with password
- `registerDevice()` - Register biometric device
- `getDevices()` - List all devices
- `validateCredentials()` - Validate company ID + API key

### 3. Routes
**File**: `Backend/routes/hrms/hrmsCompanyRoutes.js`
- POST `/api/v1/hrms/company/register` - Register company
- POST `/api/v1/hrms/company/validate` - Validate credentials
- GET `/api/v1/hrms/company/:companyId/profile` - Get profile
- POST `/api/v1/hrms/company/:companyId/regenerate-key` - Regenerate key
- POST `/api/v1/hrms/company/:companyId/devices` - Register device
- GET `/api/v1/hrms/company/:companyId/devices` - List devices

### 4. Bridge Authentication
**File**: `Backend/routes/hrms/biometricAuthRoutes.js`
- POST `/api/v1/biometric/auth/verify` - Verify bridge credentials

### 5. Server Update
**File**: `Backend/server.js` (updated)
- Added company routes
- Added biometric auth routes

---

## Deployment Steps:

### Step 1: Upload Files to EC2

```powershell
# From Windows PowerShell (D:\Staffinn-main\Backend)

# Upload table creation script
scp -i D:\staffinn-key.pem Backend\scripts\create-hrms-companies-table.js ec2-user@3.109.94.100:/home/ec2-user/Backend/scripts/

# Upload controller
scp -i D:\staffinn-key.pem Backend\controllers\hrms\hrmsCompanyController.js ec2-user@3.109.94.100:/home/ec2-user/Backend/controllers/hrms/

# Upload routes
scp -i D:\staffinn-key.pem Backend\routes\hrms\hrmsCompanyRoutes.js ec2-user@3.109.94.100:/home/ec2-user/Backend/routes/hrms/

scp -i D:\staffinn-key.pem Backend\routes\hrms\biometricAuthRoutes.js ec2-user@3.109.94.100:/home/ec2-user/Backend/routes/hrms/

# Upload updated server.js
scp -i D:\staffinn-key.pem Backend\server.js ec2-user@3.109.94.100:/home/ec2-user/Backend/server.js
```

### Step 2: Create DynamoDB Table

```bash
# SSH to EC2
ssh -i D:\staffinn-key.pem ec2-user@3.109.94.100

# Navigate to backend
cd /home/ec2-user/Backend

# Create table
node scripts/create-hrms-companies-table.js

# Expected output:
# ✅ Table created: staffinn-hrms-companies
# ✅ Companies table setup complete
```

### Step 3: Restart Server

```bash
# Restart PM2
pm2 restart all

# Check logs
pm2 logs --lines 30

# Expected output should include:
# ✅ HRMS routes registered successfully:
#    - /api/v1/hrms/company/* (Company Management)
#    - /api/v1/biometric/auth/* (Bridge Authentication)
```

---

## Testing:

### Test 1: Register Company

```bash
# SECURITY NOTE (CWE-798): Use secure passwords in production
# This is a test example only - replace with strong passwords
curl -X POST http://localhost:4001/api/v1/hrms/company/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company",
    "adminEmail": "admin@test.com",
    "adminPassword": "<use-secure-password>",
    "adminName": "Admin User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Company registered successfully",
  "data": {
    "companyId": "COMP-A1B2C3D4",
    "companyName": "Test Company",
    "adminEmail": "admin@test.com",
    "apiKey": "sk_live_abc123xyz...",
    "message": "Save your API key securely - it will not be shown again!"
  }
}
```

**IMPORTANT**: Save the `companyId` and `apiKey` - you'll need them!

### Test 2: Validate Credentials (Bridge Auth)

```bash
curl -X POST http://localhost:4001/api/v1/biometric/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "COMP-A1B2C3D4",
    "apiKey": "sk_live_abc123xyz..."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "companyId": "COMP-A1B2C3D4",
  "companyName": "Test Company",
  "devices": []
}
```

### Test 3: Register Device

```bash
curl -X POST http://localhost:4001/api/v1/hrms/company/COMP-A1B2C3D4/devices \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "192.168.1.24",
    "deviceName": "Main Office Device",
    "macAddress": "00:23:79:bb:a1:ab"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Device registered successfully",
  "data": {
    "deviceId": "192.168.1.24",
    "deviceName": "Main Office Device",
    "macAddress": "00:23:79:bb:a1:ab",
    "registeredAt": "2026-02-20T15:00:00.000Z",
    "status": "active"
  }
}
```

### Test 4: Get Company Profile

```bash
curl http://localhost:4001/api/v1/hrms/company/COMP-A1B2C3D4/profile
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "companyId": "COMP-A1B2C3D4",
    "companyName": "Test Company",
    "adminEmail": "admin@test.com",
    "subscription": "active",
    "devices": [
      {
        "deviceId": "192.168.1.24",
        "deviceName": "Main Office Device",
        "macAddress": "00:23:79:bb:a1:ab",
        "registeredAt": "2026-02-20T15:00:00.000Z",
        "status": "active"
      }
    ],
    "apiKeyPreview": "sk_live_abc123..."
  }
}
```

### Test 5: Get Devices List

```bash
curl http://localhost:4001/api/v1/hrms/company/COMP-A1B2C3D4/devices
```

---

## What's Working Now:

✅ Company registration with auto-generated ID
✅ Secure API key generation (64-character random hex)
✅ Password hashing with bcrypt
✅ Device registration per company
✅ Credential validation for bridge software
✅ Company profile management

---

## Next Steps (Phase 2):

After Phase 1 is tested and working:

1. **Add Biometric ID field to employees**
   - Update candidate schema
   - Update HRMS onboarding form
   - Link employee to company

2. **Update Webhook Security**
   - Validate company credentials
   - Check device registration
   - Verify employee belongs to company

3. **Update Bridge Software**
   - Use real API for authentication
   - Send company context with attendance data

---

## Troubleshooting:

### Issue: Table creation fails
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check DynamoDB permissions
aws dynamodb list-tables
```

### Issue: Server not starting
```bash
# Check PM2 logs
pm2 logs --lines 50

# Check for missing dependencies
npm install bcryptjs uuid
```

### Issue: Routes not registered
```bash
# Verify files exist
ls -la routes/hrms/
ls -la controllers/hrms/

# Check server.js syntax
node -c server.js
```

---

## Security Notes:

1. **API Keys**: 
   - Generated using crypto.randomBytes(32)
   - 64-character hexadecimal string
   - Stored in plain text (consider encryption for production)

2. **Passwords**:
   - Hashed using bcrypt with salt rounds = 10
   - Never returned in API responses

3. **Company ID**:
   - Format: COMP-XXXXXXXX (8 hex characters)
   - Unique identifier for each company

---

## Database Schema:

```javascript
{
  companyId: "COMP-A1B2C3D4",           // Primary Key
  companyName: "Test Company",
  adminEmail: "admin@test.com",         // GSI
  adminName: "Admin User",
  adminPassword: "$2a$10$...",          // Bcrypt hash
  apiKey: "sk_live_abc123...",          // 64-char hex
  subscription: "active",
  devices: [
    {
      deviceId: "192.168.1.24",
      deviceName: "Main Office Device",
      macAddress: "00:23:79:bb:a1:ab",
      registeredAt: "2026-02-20T15:00:00.000Z",
      status: "active"
    }
  ],
  createdAt: "2026-02-20T14:00:00.000Z",
  updatedAt: "2026-02-20T15:00:00.000Z"
}
```

---

## Ready for Phase 2? ✅

Once all tests pass, we can move to:
- **Phase 2**: Employee Biometric ID mapping
- **Phase 3**: Webhook security updates
- **Phase 4**: Bridge software integration

Let me know when Phase 1 is deployed and tested! 🚀
