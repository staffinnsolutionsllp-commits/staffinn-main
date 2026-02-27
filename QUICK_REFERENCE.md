# 📋 Quick Reference Card - Biometric Attendance System

## 🎯 Device Settings (MORX BioFace)

```
┌─────────────────────────────────────────┐
│ DEVICE CONFIGURATION                    │
├─────────────────────────────────────────┤
│ Device IP: 192.168.1.24                 │
│ Admin Password: 123456                  │
│                                         │
│ Communication Settings:                 │
│ ├─ Event Transfer Mode: YES            │
│ ├─ Host PC Addr: <EC2-Public-IP>       │
│ └─ Host PC Port: 4001                   │
└─────────────────────────────────────────┘
```

---

## 🖥️ EC2 Commands

### Setup
```bash
# Quick setup
cd /home/ec2-user/staffinn-backend
./scripts/setup-biometric-attendance.sh

# Manual setup
node scripts/create-hrms-attendance-table.js
npm install uuid
pm2 restart staffinn-backend
```

### Monitoring
```bash
# Check logs
pm2 logs staffinn-backend --lines 50

# Real-time monitoring
pm2 monit

# Check status
pm2 status

# Restart
pm2 restart staffinn-backend
```

### Testing
```bash
# Get public IP
curl http://checkip.amazonaws.com

# Test endpoint
curl http://localhost:4001/api/v1/biometric/test

# Test punch
curl -X POST http://localhost:4001/api/v1/biometric/device-punch \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"EMP001","punchType":"IN"}'
```

---

## 🔌 API Endpoints

### Device Webhook
```
POST http://<ec2-ip>:4001/api/v1/biometric/device-punch

Body:
{
  "employeeId": "EMP001",
  "deviceId": "MORX-001",
  "timestamp": "2024-01-20T09:15:30Z",
  "punchType": "IN"
}

Response:
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

### Get Records
```
GET http://<ec2-ip>:4001/api/v1/biometric/records?employeeId=EMP001&date=2024-01-20

Response:
{
  "success": true,
  "data": [
    {
      "attendanceId": "uuid",
      "employeeId": "EMP001",
      "employeeName": "Rahul Kumar",
      "date": "2024-01-20",
      "checkIn": "09:15:30",
      "checkOut": "18:30:00",
      "status": "Present"
    }
  ]
}
```

### Test Endpoint
```
GET http://<ec2-ip>:4001/api/v1/biometric/test

Response:
{
  "success": true,
  "message": "Biometric webhook endpoint is working!"
}
```

---

## 📊 DynamoDB Tables

### staffinn-hrms-employees
```
Partition Key: employeeId (String)

Schema:
{
  "employeeId": "EMP001",
  "name": "Rahul Kumar",
  "department": "IT",
  "phone": "9876543210",
  "email": "rahul@company.com",
  "status": "Active"
}
```

### staffinn-hrms-attendance
```
Partition Key: attendanceId (String)
GSI: employeeId-date-index

Schema:
{
  "attendanceId": "uuid",
  "employeeId": "EMP001",
  "employeeName": "Rahul Kumar",
  "department": "IT",
  "date": "2024-01-20",
  "checkIn": "2024-01-20T09:15:30Z",
  "checkOut": "2024-01-20T18:30:00Z",
  "status": "Present",
  "deviceId": "MORX-001",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 🔧 Troubleshooting Commands

### Check if table exists
```bash
aws dynamodb describe-table \
  --table-name staffinn-hrms-attendance \
  --region ap-south-1
```

### Query attendance
```bash
aws dynamodb query \
  --table-name staffinn-hrms-attendance \
  --index-name employeeId-date-index \
  --key-condition-expression "employeeId = :id" \
  --expression-attribute-values '{":id":{"S":"EMP001"}}' \
  --region ap-south-1
```

### Check employee exists
```bash
aws dynamodb get-item \
  --table-name staffinn-hrms-employees \
  --key '{"employeeId":{"S":"EMP001"}}' \
  --region ap-south-1
```

### Check port listening
```bash
sudo netstat -tlnp | grep 4001
```

### Check EC2 connectivity
```bash
# From device network
ping <ec2-ip>
curl http://<ec2-ip>:4001/health
```

---

## ⚠️ Common Errors & Solutions

### Error 1: Employee not found
```
Error: "Employee EMP001 not registered in HRMS"

Solution:
1. Check employee exists in HRMS
2. Verify employee ID exact match (case-sensitive)
3. Add employee in HRMS first
```

### Error 2: Connection failed
```
Error: Device shows "Connection Failed"

Solution:
1. Verify EC2 IP correct (public IP)
2. Check port 4001 open in Security Group
3. Verify Event Transfer Mode = YES
4. Restart device
```

### Error 3: No data in logs
```
Error: pm2 logs shows nothing

Solution:
1. Check device Event Transfer Mode = YES
2. Verify Host PC Addr = EC2 IP
3. Check device internet connectivity
4. Test with manual curl
```

### Error 4: Table not found
```
Error: "Cannot do operations on a non-existent table"

Solution:
1. Run: node scripts/create-hrms-attendance-table.js
2. Wait 30 seconds for table to be active
3. Restart backend: pm2 restart staffinn-backend
```

---

## 📱 Device Access

### Web Interface
```
URL: http://192.168.1.24
Username: admin
Password: 123456
```

### Device Screen
```
Touch screen → Admin password → Menu
├── Communication
│   ├── TCP/IP Settings
│   └── Communication Settings ← Configure here
├── User Management ← Register employees
└── System
    └── Restart Device
```

---

## ✅ Daily Checklist

### Morning (Office Open)
- [ ] Check device is on
- [ ] Verify network connection
- [ ] Check EC2 backend running: `pm2 status`
- [ ] Test endpoint: `curl http://localhost:4001/api/v1/biometric/test`

### During Day
- [ ] Monitor logs: `pm2 logs staffinn-backend`
- [ ] Check attendance records in HRMS
- [ ] Verify real-time updates

### Evening (Office Close)
- [ ] Verify all check-outs recorded
- [ ] Check DynamoDB entries
- [ ] Review any errors in logs

---

## 🎯 Quick Setup (New Employee)

```
Step 1: HRMS
├── Login to HRMS
├── Go to Onboarding
├── Add Employee
│   ├── Employee ID: EMP002
│   ├── Name: Priya Singh
│   └── Department: HR
└── Save

Step 2: Device
├── Device → Admin Mode
├── User Management → Add User
├── Employee ID: EMP002 (SAME!)
├── Scan Fingerprint/Face
└── Save

Step 3: Test
├── Employee does test punch
├── Check logs: pm2 logs staffinn-backend
└── Verify in HRMS dashboard
```

---

## 📞 Emergency Contacts

### System Issues
```
Backend: pm2 restart staffinn-backend
Device: Restart from device menu
Network: Check router/switch
```

### AWS Issues
```
EC2: Check instance status
DynamoDB: Check table status
Security Group: Verify port 4001 open
```

### Device Issues
```
MORX Support: Check device manual
Reset: Factory reset (last resort)
Firmware: Check for updates
```

---

## 📚 Documentation Links

- **Full Setup Guide**: BIOMETRIC_ATTENDANCE_SETUP_GUIDE.md
- **Device Config**: DEVICE_CONFIGURATION_GUIDE.md
- **Implementation**: BIOMETRIC_IMPLEMENTATION_SUMMARY.md
- **This Card**: QUICK_REFERENCE.md

---

## 🚀 Production Checklist

Before going live:
- [ ] All employees registered (HRMS + Device)
- [ ] Test punch successful for all
- [ ] Logs clean (no errors)
- [ ] DynamoDB entries correct
- [ ] HRMS frontend showing data
- [ ] Backup plan ready
- [ ] Support team trained
- [ ] Documentation shared

---

**Keep this card handy for quick reference! 📋**
