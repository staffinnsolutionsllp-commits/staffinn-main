# 📊 Attendance Sync Flow Diagram

## Current Problem (Production) ❌

```
┌─────────────────────┐
│  Biometric Device   │
│   (192.168.1.100)   │
└──────────┬──────────┘
           │ Punch Attendance
           ▼
┌─────────────────────┐
│  Staffinn Bridge    │
│   (Your Desktop)    │
│  localhost:3002     │
└──────────┬──────────┘
           │ Tries to send to localhost:3002
           │ ❌ FAILS - localhost doesn't exist on remote server
           ▼
┌─────────────────────┐
│   ??? Nothing ???   │
│                     │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Production Server  │
│  api.staffinn.com   │
│  ❌ Never receives  │
│     the data        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     DynamoDB        │
│  ❌ No data saved   │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│   HRMS Frontend     │
│ hrms.staffinn.com   │
│ ❌ No attendance    │
│    showing          │
└─────────────────────┘
```

---

## Working Solution (Localhost) ✅

```
┌─────────────────────┐
│  Biometric Device   │
│   (192.168.1.100)   │
└──────────┬──────────┘
           │ Punch Attendance
           ▼
┌─────────────────────┐
│  Staffinn Bridge    │
│   (Your Desktop)    │
│  localhost:3002     │
└──────────┬──────────┘
           │ Sends to localhost:4001
           │ ✅ SUCCESS - both on same machine
           ▼
┌─────────────────────┐
│   Local Backend     │
│  localhost:4001     │
│  ✅ Receives data   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     DynamoDB        │
│  ✅ Data saved      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   HRMS Frontend     │
│   localhost:5173    │
│ ✅ Attendance shows │
└─────────────────────┘
```

---

## Fixed Solution (Production) ✅

```
┌─────────────────────┐
│  Biometric Device   │
│   (192.168.1.100)   │
└──────────┬──────────┘
           │ Punch Attendance
           ▼
┌─────────────────────┐
│  Staffinn Bridge    │
│   (Your Desktop)    │
│  Configured with:   │
│  api.staffinn.com   │
└──────────┬──────────┘
           │ Sends to https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance
           │ ✅ SUCCESS - correct endpoint
           ▼
┌─────────────────────┐
│  Production Server  │
│  api.staffinn.com   │
│  ✅ Receives data   │
│  ✅ Has HRMS tables │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     DynamoDB        │
│  ✅ Data saved to   │
│  HRMS_ATTENDANCE    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   HRMS Frontend     │
│ hrms.staffinn.com   │
│ ✅ Attendance shows │
│    in real-time     │
└─────────────────────┘
```

---

## Detailed Data Flow

### Step 1: Employee Punches Attendance
```
Employee → Biometric Device
         → Device captures:
            - Employee ID (from fingerprint/face)
            - Timestamp
            - Device ID
```

### Step 2: Bridge Software Captures Data
```
Biometric Device → Bridge Software
                → Bridge formats data:
                   {
                     "employeeId": "EMP001",
                     "timestamp": "2024-01-20T09:00:00Z",
                     "deviceId": "DEVICE001",
                     "verifyMode": "fingerprint"
                   }
```

### Step 3: Bridge Sends to Backend
```
Bridge Software → HTTP POST Request
               → Endpoint: /api/v1/hrms/attendance/bridge-attendance
               → Headers:
                  - Content-Type: application/json
                  - x-company-id: COMP123
                  - x-api-key: sk_live_abc123
               → Body: attendance data
```

### Step 4: Backend Processes Data
```
Backend Server → Validates request
              → Checks if employee exists
              → Checks if attendance already exists for today
              → If first punch: Creates check-in record
              → If second punch: Updates with check-out time
              → Calculates hours worked
              → Determines status (present/late)
```

### Step 5: Backend Saves to Database
```
Backend → DynamoDB
       → Table: staffinn-hrms-attendance
       → Record:
          {
            "attendanceId": "ATT-12345",
            "employeeId": "EMP001",
            "recruiterId": "REC-001",
            "date": "2024-01-20",
            "checkIn": "09:00",
            "checkOut": "",
            "hours": 0,
            "status": "present",
            "source": "biometric"
          }
```

### Step 6: Frontend Displays Data
```
HRMS Frontend → Polls backend every 30 seconds
             → GET /api/v1/hrms/attendance/stats
             → GET /api/v1/hrms/attendance/date/2024-01-20
             → Displays attendance in table
             → Updates statistics
```

---

## Configuration Comparison

### Before Fix ❌

**Local .env:**
```env
HRMS_ATTENDANCE_TABLE=staffinn-hrms-attendance ✅
BRIDGE_SERVICE_URL=http://localhost:3002 ✅
```

**Production .env.production:**
```env
# Missing HRMS tables ❌
# Missing BRIDGE_SERVICE_URL ❌
```

**Controller:**
```javascript
const BRIDGE_SERVICE_URL = 'http://localhost:3002'; // Hardcoded ❌
```

**Bridge Software:**
```
API Endpoint: http://localhost:4001 ❌
```

---

### After Fix ✅

**Local .env:**
```env
HRMS_ATTENDANCE_TABLE=staffinn-hrms-attendance ✅
BRIDGE_SERVICE_URL=http://localhost:3002 ✅
```

**Production .env.production:**
```env
HRMS_ATTENDANCE_TABLE=staffinn-hrms-attendance ✅
BRIDGE_SERVICE_URL=https://api.staffinn.com/api/v1 ✅
```

**Controller:**
```javascript
const BRIDGE_SERVICE_URL = process.env.BRIDGE_SERVICE_URL || 'http://localhost:3002'; // Dynamic ✅
```

**Bridge Software:**
```
API Endpoint: https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance ✅
Company ID: COMP123 ✅
API Key: sk_live_abc123 ✅
```

---

## Network Flow Diagram

### Local Environment
```
┌──────────────────────────────────────────────────────┐
│                  Your Desktop (localhost)             │
│                                                       │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────┐ │
│  │   Bridge    │───▶│   Backend    │───▶│  HRMS   │ │
│  │ :3002       │    │   :4001      │    │  :5173  │ │
│  └─────────────┘    └──────────────┘    └─────────┘ │
│         ▲                   │                         │
│         │                   ▼                         │
│  ┌─────────────┐    ┌──────────────┐                │
│  │  Biometric  │    │   DynamoDB   │                │
│  │   Device    │    │   (Cloud)    │                │
│  └─────────────┘    └──────────────┘                │
└──────────────────────────────────────────────────────┘
```

### Production Environment
```
┌──────────────────┐                    ┌─────────────────────────┐
│  Your Desktop    │                    │    AWS Cloud            │
│                  │                    │                         │
│  ┌────────────┐  │  Internet         │  ┌──────────────┐      │
│  │   Bridge   │──┼──────────────────▶│  │   Backend    │      │
│  │            │  │  HTTPS             │  │ EC2/ECS      │      │
│  └────────────┘  │                    │  └──────┬───────┘      │
│        ▲         │                    │         │               │
│        │         │                    │         ▼               │
│  ┌────────────┐  │                    │  ┌──────────────┐      │
│  │ Biometric  │  │                    │  │  DynamoDB    │      │
│  │  Device    │  │                    │  │              │      │
│  └────────────┘  │                    │  └──────┬───────┘      │
└──────────────────┘                    │         │               │
                                        │         ▼               │
┌──────────────────┐                    │  ┌──────────────┐      │
│  User Browser    │  Internet          │  │   HRMS       │      │
│                  │◀───────────────────┼──│  Frontend    │      │
│  HRMS Portal     │  HTTPS             │  │  S3/CloudFr. │      │
└──────────────────┘                    │  └──────────────┘      │
                                        └─────────────────────────┘
```

---

## API Endpoint Structure

### Bridge Attendance Endpoint
```
POST /api/v1/hrms/attendance/bridge-attendance

Headers:
  Content-Type: application/json
  x-company-id: <company-id>
  x-api-key: <api-key>

Request Body:
  {
    "employeeId": "EMP001",
    "checkIn": "09:00",
    "date": "2024-01-20",
    "source": "biometric",
    "deviceId": "DEVICE001"
  }

Response (Success):
  {
    "success": true,
    "message": "Attendance marked successfully",
    "data": {
      "attendanceId": "ATT-12345",
      "employeeId": "EMP001",
      "checkIn": "09:00",
      "date": "2024-01-20",
      "status": "present"
    }
  }

Response (Error):
  {
    "success": false,
    "message": "Employee not found",
    "statusCode": 404
  }
```

---

## Timeline Comparison

### Before Fix ❌
```
09:00:00 - Employee punches attendance
09:00:01 - Device captures data
09:00:02 - Bridge receives data
09:00:03 - Bridge tries to send to localhost
09:00:04 - ❌ Connection fails (localhost not found)
09:00:05 - Bridge retries...
09:00:10 - Bridge gives up
∞        - Data never reaches production
∞        - HRMS shows no attendance
```

### After Fix ✅
```
09:00:00 - Employee punches attendance
09:00:01 - Device captures data
09:00:02 - Bridge receives data
09:00:03 - Bridge sends to api.staffinn.com
09:00:04 - ✅ Backend receives data
09:00:05 - Backend validates and saves to DynamoDB
09:00:06 - ✅ Data saved successfully
09:00:07 - HRMS polls backend
09:00:08 - ✅ HRMS displays attendance
```

**Total Time: 8 seconds** ⚡

---

## Summary

### The Problem
- Bridge software sending data to wrong endpoint (localhost)
- Production backend missing HRMS table configurations
- No connection between Bridge and production server

### The Solution
- Configure Bridge to use production API endpoint
- Add HRMS table configurations to production .env
- Make Bridge URL dynamic in code

### The Result
- Real-time attendance sync (< 10 seconds)
- No manual intervention required
- Consistent behavior across environments
