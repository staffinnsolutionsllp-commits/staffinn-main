# 🚀 Biometric Attendance System - Complete Setup Guide

## ✅ System Overview

```
MORX BioFace Device → Internet → AWS EC2 → DynamoDB → HRMS Frontend
                                    ↓
                        Validates Employee ID
                        Saves to staffinn-hrms-attendance
```

---

## 📋 Step 1: AWS EC2 Setup (5 minutes)

### 1.1 Create DynamoDB Table

```bash
# SSH into EC2
ssh ec2-user@<your-ec2-ip>

# Navigate to backend
cd /home/ec2-user/staffinn-backend

# Create attendance table
node scripts/create-hrms-attendance-table.js
```

**Expected Output:**
```
Creating table staffinn-hrms-attendance...
✅ Table staffinn-hrms-attendance created successfully!
   - Partition Key: attendanceId (String)
   - GSI: employeeId-date-index
```

### 1.2 Update Environment Variables

```bash
# Add to .env.production
echo "DYNAMODB_HRMS_ATTENDANCE_TABLE=staffinn-hrms-attendance" >> .env.production
echo "DYNAMODB_HRMS_EMPLOYEES_TABLE=staffinn-hrms-employees" >> .env.production
```

### 1.3 Install Dependencies (if needed)

```bash
npm install uuid
```

### 1.4 Restart Server

```bash
# If using PM2
pm2 restart staffinn-backend

# Check logs
pm2 logs staffinn-backend --lines 50
```

**Expected Output:**
```
✅ HRMS routes registered successfully:
   - /api/v1/biometric/* (Device Webhook)
```

### 1.5 Configure Security Group

```
AWS Console → EC2 → Security Groups → Your SG
Add Inbound Rule:
├── Type: Custom TCP
├── Port: 4001
├── Source: 0.0.0.0/0 (or specific device IP)
└── Description: Biometric Device Webhook
```

---

## 📋 Step 2: Device Configuration (10 minutes)

### 2.1 Get Your EC2 Public IP

```bash
# On EC2, run:
curl http://checkip.amazonaws.com

# Example output: 13.232.45.67
```

### 2.2 Configure MORX BioFace Device

**Access Device:**
- Device IP: `192.168.1.24`
- Browser: `http://192.168.1.24`
- OR: Use device screen directly

**Configuration Steps:**

```
1. Go to: Communication → TCP/IP Settings
   ├── Verify Network Settings:
   │   ├── IP Address: 192.168.1.24 ✓
   │   ├── Gateway: 192.168.1.1 ✓
   │   └── DHCP: ON ✓
   └── Save

2. Go to: Communication Settings
   ├── Server-Client Mode: LogClient ✓ (Already set)
   ├── Event Transfer Mode: YES (Change from No)
   ├── Host PC Addr: <Your-EC2-Public-IP>
   │   Example: 13.232.45.67
   ├── Host PC Port: 4001
   └── Save

3. Restart Device
```

### 2.3 Device Data Format

Device will send data in this format:
```json
{
  "employeeId": "EMP001",
  "deviceId": "MORX-001",
  "timestamp": "2024-01-20T09:15:30Z",
  "punchType": "IN"
}
```

---

## 📋 Step 3: Employee Registration (One-time per employee)

### 3.1 Add Employee in HRMS

```
HRMS → Onboarding → Add Employee
├── Employee ID: EMP001 (Important!)
├── Name: Rahul Kumar
├── Department: IT
├── Phone: 9876543210
└── Save → DynamoDB (staffinn-hrms-employees)
```

### 3.2 Register Employee in Device

```
Device → Admin Mode → User Management
├── Add New User
├── Employee ID: EMP001 (SAME as HRMS!)
├── Scan Fingerprint/Face
└── Save
```

**⚠️ CRITICAL: Employee ID must be EXACTLY same in both places!**

---

## 📋 Step 4: Testing (5 minutes)

### 4.1 Test API Endpoint

```bash
# From your local machine or EC2
curl http://<ec2-ip>:4001/api/v1/biometric/test

# Expected response:
{
  "success": true,
  "message": "Biometric webhook endpoint is working!",
  "endpoint": "/api/v1/biometric/device-punch"
}
```

### 4.2 Test Manual Punch (Optional)

```bash
curl -X POST http://<ec2-ip>:4001/api/v1/biometric/device-punch \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP001",
    "deviceId": "MORX-001",
    "timestamp": "2024-01-20T09:15:30Z",
    "punchType": "IN"
  }'

# Expected response:
{
  "success": true,
  "message": "Attendance recorded successfully",
  "data": {
    "employeeId": "EMP001",
    "employeeName": "Rahul Kumar",
    "date": "2024-01-20",
    "checkIn": "2024-01-20T09:15:30Z",
    "status": "Present"
  }
}
```

### 4.3 Test Real Device Punch

```
1. Employee fingerprint/face scan kare device pe
2. Device screen pe "Verified ✓" dikhega
3. Check EC2 logs:
   pm2 logs staffinn-backend --lines 20

4. Expected log:
   📥 Device webhook received: { employeeId: 'EMP001', ... }
   ✅ Attendance marked: Rahul Kumar (EMP001) - 2024-01-20
```

### 4.4 Verify in DynamoDB

```
AWS Console → DynamoDB → Tables → staffinn-hrms-attendance
→ Explore Items

Expected record:
{
  "attendanceId": "uuid-here",
  "employeeId": "EMP001",
  "employeeName": "Rahul Kumar",
  "department": "IT",
  "date": "2024-01-20",
  "checkIn": "2024-01-20T09:15:30Z",
  "checkOut": null,
  "status": "Present",
  "deviceId": "MORX-001"
}
```

---

## 📋 Step 5: Daily Usage

### Employee Workflow:

```
09:15 AM - Check-in
├── Employee fingerprint lagata hai
├── Device: "EMP001 - Verified ✓"
├── Device sends to EC2
├── Backend validates employee
├── Saves to DynamoDB
└── HRMS shows: "Rahul Kumar - Present - 09:15"

06:30 PM - Check-out
├── Employee fingerprint lagata hai
├── Device: "EMP001 - Verified ✓"
├── Backend updates same record
└── HRMS shows: "Rahul Kumar - 09:15 to 18:30"
```

---

## 🔍 Troubleshooting

### Issue 1: Device Not Sending Data

**Check:**
```bash
# 1. Device network connectivity
ping 192.168.1.24

# 2. Device can reach EC2
# (From device network, test):
curl http://<ec2-ip>:4001/api/v1/biometric/test

# 3. EC2 Security Group
# Port 4001 should be open
```

**Fix:**
- Verify device Event Transfer Mode = YES
- Verify Host PC Addr = EC2 Public IP
- Verify Host PC Port = 4001
- Restart device

### Issue 2: Employee Not Found Error

**Error:**
```json
{
  "success": false,
  "message": "Employee EMP001 not registered in HRMS"
}
```

**Fix:**
```bash
# Check if employee exists in DynamoDB
aws dynamodb get-item \
  --table-name staffinn-hrms-employees \
  --key '{"employeeId": {"S": "EMP001"}}'

# If not found, add employee in HRMS first
```

### Issue 3: Attendance Not Showing in HRMS

**Check:**
```bash
# 1. Check DynamoDB
aws dynamodb query \
  --table-name staffinn-hrms-attendance \
  --index-name employeeId-date-index \
  --key-condition-expression "employeeId = :id" \
  --expression-attribute-values '{":id":{"S":"EMP001"}}'

# 2. Check EC2 logs
pm2 logs staffinn-backend --lines 50

# 3. Check API endpoint
curl http://<ec2-ip>:4001/api/v1/biometric/records?employeeId=EMP001&date=2024-01-20
```

### Issue 4: Device Shows "Connection Failed"

**Fix:**
```bash
# 1. Check if EC2 is running
curl http://<ec2-ip>:4001/health

# 2. Check if port 4001 is listening
sudo netstat -tlnp | grep 4001

# 3. Restart backend
pm2 restart staffinn-backend
```

---

## 📊 API Endpoints

### 1. Device Webhook (POST)
```
URL: http://<ec2-ip>:4001/api/v1/biometric/device-punch
Method: POST
Body: {
  "employeeId": "EMP001",
  "deviceId": "MORX-001",
  "timestamp": "2024-01-20T09:15:30Z",
  "punchType": "IN"
}
```

### 2. Get Attendance Records (GET)
```
URL: http://<ec2-ip>:4001/api/v1/biometric/records
Method: GET
Query: ?employeeId=EMP001&date=2024-01-20
```

### 3. Test Endpoint (GET)
```
URL: http://<ec2-ip>:4001/api/v1/biometric/test
Method: GET
```

---

## ✅ Success Checklist

- [ ] DynamoDB table created (staffinn-hrms-attendance)
- [ ] Environment variables updated
- [ ] Server restarted successfully
- [ ] Security Group port 4001 open
- [ ] Device configured with EC2 IP
- [ ] Device Event Transfer Mode = YES
- [ ] Test endpoint working
- [ ] Employee registered in HRMS
- [ ] Employee registered in device
- [ ] Test punch successful
- [ ] Attendance visible in DynamoDB
- [ ] HRMS frontend showing attendance

---

## 📞 Support

**Logs Check:**
```bash
# Backend logs
pm2 logs staffinn-backend --lines 100

# System logs
tail -f /var/log/messages
```

**Common Commands:**
```bash
# Restart backend
pm2 restart staffinn-backend

# Check status
pm2 status

# Monitor logs
pm2 monit
```

---

## 🎯 Next Steps

1. ✅ Complete Step 1-5
2. ✅ Test with 1-2 employees
3. ✅ Register all employees
4. ✅ Monitor for 1 week
5. ✅ Setup automated reports (optional)

**System is now ready for production use! 🚀**
