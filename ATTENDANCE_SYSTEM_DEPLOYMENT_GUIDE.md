# 🚀 COMPLETE ATTENDANCE SYSTEM - DEPLOYMENT GUIDE

## 📋 Table of Contents
1. [Database Setup](#database-setup)
2. [Backend Deployment](#backend-deployment)
3. [Bridge Software Update](#bridge-software-update)
4. [Frontend Configuration](#frontend-configuration)
5. [Testing Guide](#testing-guide)
6. [Production Checklist](#production-checklist)

---

## 🗄️ PART 1: DATABASE SETUP

### Step 1: Create Missing DynamoDB Tables

Run these scripts in order:

```bash
cd Backend/scripts

# Create all attendance tables
node setup-attendance-tables.js
```

This will create:
- `staffinn-hrms-employee-device-mappings`
- `staffinn-hrms-devices`

### Step 2: Verify Tables

```bash
# Check if tables exist
aws dynamodb list-tables --region ap-south-1
```

You should see:
- ✅ staffinn-hrms-attendance
- ✅ staffinn-hrms-employees
- ✅ staffinn-hrms-companies
- ✅ staffinn-hrms-employee-device-mappings (NEW)
- ✅ staffinn-hrms-devices (NEW)

---

## 🖥️ PART 2: BACKEND DEPLOYMENT

### Step 1: Install Dependencies

```bash
cd Backend
npm install
```

Socket.IO is already in package.json, so this will install it.

### Step 2: Update Environment Variables

Edit `Backend/.env`:

```env
PORT=4001
AWS_REGION=ap-south-1
NODE_ENV=production

# CORS Origins (add all your domains)
CORS_ORIGINS=https://hrms.staffinn.com,https://employee.staffinn.com,https://staffinn.com,http://localhost:5173,http://localhost:5174

# DynamoDB Tables
DYNAMODB_USERS_TABLE=staffinn-users
HRMS_EMPLOYEES_TABLE=staffinn-hrms-employees
HRMS_ATTENDANCE_TABLE=staffinn-hrms-attendance
HRMS_COMPANIES_TABLE=staffinn-hrms-companies
```

### Step 3: Test Locally

```bash
npm start
```

Check console output:
```
✅ SERVER STARTED SUCCESSFULLY!
✅ DynamoDB tables initialized
✅ WebSocket server initialized
📍 URL: http://localhost:4001
```

### Step 4: Test New Endpoints

```bash
# Test mapping endpoint (requires auth token)
curl -X GET "http://localhost:4001/api/v1/hrms/attendance/mappings" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test device endpoint
curl -X GET "http://localhost:4001/api/v1/hrms/attendance/devices" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 5: Deploy to Production (EC2)

```bash
# SSH to EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Navigate to backend
cd /home/ec2-user/Staffinn-main/Backend

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Restart PM2
pm2 restart staffinn-backend
pm2 save

# Check logs
pm2 logs staffinn-backend
```

Look for:
```
✅ WebSocket server initialized
✅ DynamoDB tables initialized
📡 Attendance update event emitted successfully
```

---

## 💻 PART 3: BRIDGE SOFTWARE UPDATE

### Step 1: Backup Current Bridge

```bash
# On Windows PC where Bridge is installed
cd D:\StaffInn-Attendance-Bridge
mkdir backup
copy src\main\syncService.js backup\syncService.js.backup
```

### Step 2: Update syncService.js

Replace `D:\StaffInn-Attendance-Bridge\src\main\syncService.js` with the new version:

```bash
# Copy the updated file
copy syncService-updated.js src\main\syncService.js
```

### Step 3: Install Socket.IO Client

```bash
cd D:\StaffInn-Attendance-Bridge
npm install socket.io-client@4.8.1
```

### Step 4: Update package.json

Edit `D:\StaffInn-Attendance-Bridge\package.json`:

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "electron-store": "^8.1.0",
    "sql.js": "^1.10.0",
    "ws": "^8.19.0",
    "socket.io-client": "^4.8.1"
  }
}
```

### Step 5: Test Bridge Locally

```bash
npm start
```

Check console:
```
✅ WebSocket connected
📥 Loading employee-device mappings...
✅ Loaded 5 employee mappings
✅ Auto-sync started (every 10 seconds)
```

### Step 6: Build Windows Installer

```bash
npm run build:win
```

Output: `dist/StaffInn-Attendance-Bridge-Setup-1.0.2.exe`

### Step 7: Deploy to Client

1. Send installer to client
2. Client installs on Windows PC
3. Client configures:
   - Company ID (from HRMS)
   - API Key (from HRMS)
   - Device IP (e.g., 192.168.1.24)
   - Device Port (e.g., 5005)

---

## 🎨 PART 4: FRONTEND CONFIGURATION

### Step 1: Update HRMS Frontend

The frontend already has WebSocket support! Just verify:

File: `HRMS Staffinn/Staffinn HR Manager_files/src/components/Attendance.tsx`

Check lines 45-95 - WebSocket listener is already there:

```typescript
socket.on('attendance-update', (data: any) => {
  console.log('📡 Real-time attendance update:', data)
  loadData()
  refreshStats(selectedDate)
})
```

### Step 2: Add Employee Mapping UI

Create new component: `DeviceMapping.tsx`

```typescript
import { useState, useEffect } from 'react'
import { apiService } from '../services/api'

export default function DeviceMapping() {
  const [employees, setEmployees] = useState([])
  const [mappings, setMappings] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [deviceUserId, setDeviceUserId] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [empRes, mapRes] = await Promise.all([
      apiService.getEmployees(),
      apiService.getMappings()
    ])
    setEmployees(empRes.data)
    setMappings(mapRes.data)
  }

  const handleCreateMapping = async () => {
    await apiService.createMapping({
      employeeId: selectedEmployee,
      deviceUserId
    })
    loadData()
    setSelectedEmployee('')
    setDeviceUserId('')
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Employee-Device Mapping</h2>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Add New Mapping</h3>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.fullName} ({emp.employeeId})
              </option>
            ))}
          </select>
          
          <input
            type="text"
            placeholder="Device User ID (e.g., 1001)"
            value={deviceUserId}
            onChange={(e) => setDeviceUserId(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
        
        <button
          onClick={handleCreateMapping}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Mapping
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Existing Mappings</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Employee ID</th>
              <th className="text-left p-2">Employee Name</th>
              <th className="text-left p-2">Device User ID</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map(mapping => {
              const emp = employees.find(e => e.employeeId === mapping.employeeId)
              return (
                <tr key={mapping.mappingId} className="border-b">
                  <td className="p-2">{mapping.employeeId}</td>
                  <td className="p-2">{emp?.fullName || 'Unknown'}</td>
                  <td className="p-2">{mapping.deviceUserId}</td>
                  <td className="p-2">
                    <button
                      onClick={() => apiService.deleteMapping(mapping.mappingId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### Step 3: Update API Service

Add to `src/services/api.ts`:

```typescript
// Mapping APIs
getMappings: async () => {
  return apiClient.get('/hrms/attendance/mappings')
},

createMapping: async (data: { employeeId: string; deviceUserId: string }) => {
  return apiClient.post('/hrms/attendance/mappings', data)
},

deleteMapping: async (mappingId: string) => {
  return apiClient.delete(`/hrms/attendance/mappings/${mappingId}`)
},

// Device APIs
getDevices: async () => {
  return apiClient.get('/hrms/attendance/devices')
},

registerDevice: async (data: any) => {
  return apiClient.post('/hrms/attendance/devices', data)
}
```

### Step 4: Deploy Frontend

```bash
cd "HRMS Staffinn/Staffinn HR Manager_files"
npm run build
aws s3 sync dist/ s3://hrms.staffinn.com --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## 🧪 PART 5: TESTING GUIDE

### Test 1: Database Tables

```bash
node Backend/scripts/setup-attendance-tables.js
```

Expected output:
```
✅ Table staffinn-hrms-employee-device-mappings created successfully!
✅ Table staffinn-hrms-devices created successfully!
```

### Test 2: Backend APIs

```bash
# Start backend
cd Backend
npm start

# In another terminal, test endpoints
curl http://localhost:4001/health
```

Expected:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

### Test 3: WebSocket Connection

Open browser console on HRMS frontend:

```javascript
// Should see in console:
"🔌 Connecting to WebSocket: https://api.staffinn.com"
"✅ WebSocket connected"
"📡 Joined room: recruiter-REC123"
```

### Test 4: Employee Mapping

1. Login to HRMS
2. Go to Attendance → Device Setup → Employee Mapping
3. Create mapping:
   - Employee: EMP001 (John Doe)
   - Device User ID: 1001
4. Click "Create Mapping"
5. Verify in table

### Test 5: Bridge Software

1. Install Bridge on Windows PC
2. Configure:
   - Company ID: COMP123
   - API Key: (from HRMS)
   - Device IP: 192.168.1.24
3. Click "Connect"
4. Check console:
   ```
   ✅ WebSocket connected
   📥 Loaded 1 employee mappings
   ✅ Auto-sync started
   ```

### Test 6: End-to-End Attendance Flow

1. Employee scans fingerprint on device (User ID: 1001)
2. Bridge detects punch
3. Bridge maps 1001 → EMP001
4. Bridge sends to backend
5. Backend creates attendance record
6. Backend broadcasts via WebSocket
7. HRMS frontend updates INSTANTLY
8. Verify in Attendance table: EMP001 | 09:15 | - | - | late

### Test 7: Check-Out Flow

1. Same employee scans again (6 hours later)
2. Bridge sends second punch
3. Backend detects existing record
4. Backend updates checkOut and calculates hours
5. WebSocket broadcast
6. Frontend updates: EMP001 | 09:15 | 15:15 | 6.0h | late

---

## ✅ PART 6: PRODUCTION CHECKLIST

### Database
- [ ] All tables created in production DynamoDB
- [ ] Tables have proper indexes (GSI)
- [ ] Backup strategy configured
- [ ] Monitoring enabled

### Backend
- [ ] Code deployed to EC2
- [ ] PM2 running and auto-restart enabled
- [ ] Environment variables set correctly
- [ ] CORS configured for production domains
- [ ] WebSocket server running
- [ ] Logs being captured (CloudWatch)
- [ ] Health check endpoint responding
- [ ] SSL certificate valid

### Bridge Software
- [ ] Installer built and tested
- [ ] Socket.IO client installed
- [ ] Mapping logic implemented
- [ ] Offline queue working
- [ ] WebSocket connection stable
- [ ] Error handling robust
- [ ] Logging comprehensive

### Frontend
- [ ] WebSocket listener active
- [ ] Employee mapping UI deployed
- [ ] Real-time updates working
- [ ] Device status indicator showing
- [ ] Attendance table auto-refreshing

### Security
- [ ] API keys secured
- [ ] Company credentials validated
- [ ] JWT tokens working
- [ ] HTTPS enforced
- [ ] Data isolation per recruiter
- [ ] No sensitive data in logs

### Performance
- [ ] Sync interval optimized (10 seconds)
- [ ] Batch processing working (20 records)
- [ ] Duplicate prevention active
- [ ] Database queries optimized
- [ ] WebSocket rooms isolated

### Monitoring
- [ ] Backend logs accessible
- [ ] Bridge logs accessible
- [ ] Error alerts configured
- [ ] Heartbeat monitoring
- [ ] Device status tracking
- [ ] Sync success rate tracking

---

## 🎯 SUCCESS CRITERIA

### Real-Time Performance
- ✅ Attendance appears in HRMS within 10 seconds of punch
- ✅ No manual refresh needed
- ✅ WebSocket connection stable

### Accuracy
- ✅ Check-in detected correctly
- ✅ Check-out detected correctly
- ✅ Hours calculated accurately
- ✅ Status (present/late/overtime) correct

### Reliability
- ✅ No duplicate punches
- ✅ Offline queue works
- ✅ Reconnection automatic
- ✅ Error handling graceful

### Scalability
- ✅ Multiple companies supported
- ✅ Multiple devices per company
- ✅ Hundreds of employees
- ✅ Thousands of punches per day

---

## 📞 SUPPORT

### Common Issues

**Issue: Mapping not found**
- Solution: Configure employee-device mapping in HRMS Device Setup

**Issue: WebSocket not connecting**
- Solution: Check CORS settings, verify backend URL

**Issue: Attendance not syncing**
- Solution: Check Bridge logs, verify API credentials

**Issue: Duplicate punches**
- Solution: Already handled - backend ignores punches within 1 minute

**Issue: Wrong timezone**
- Solution: Bridge converts to IST automatically

---

## 🚀 DEPLOYMENT COMMANDS

### Quick Deploy Script

```bash
#!/bin/bash

echo "🚀 Deploying Complete Attendance System..."

# 1. Database
echo "📊 Creating tables..."
cd Backend/scripts
node setup-attendance-tables.js

# 2. Backend
echo "🖥️ Deploying backend..."
cd ../
npm install
pm2 restart staffinn-backend

# 3. Frontend
echo "🎨 Deploying frontend..."
cd "../HRMS Staffinn/Staffinn HR Manager_files"
npm run build
aws s3 sync dist/ s3://hrms.staffinn.com --delete

# 4. Bridge
echo "💻 Building Bridge installer..."
cd "../../StaffInn-Attendance-Bridge"
npm install
npm run build:win

echo "✅ Deployment complete!"
echo "📦 Bridge installer: dist/StaffInn-Attendance-Bridge-Setup-1.0.2.exe"
```

---

## 📝 NOTES

- Bridge software must be installed on a Windows PC on the same network as the biometric device
- Each company needs their own Bridge installation with unique credentials
- Mappings must be configured before attendance will sync
- WebSocket provides real-time updates, but polling fallback exists
- Offline queue ensures no data loss during network outages

---

**Generated:** ${new Date().toISOString()}
**Version:** 1.0.0
**Status:** Production Ready ✅
