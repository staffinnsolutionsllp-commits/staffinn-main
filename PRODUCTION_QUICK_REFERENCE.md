# 🚀 PRODUCTION SYSTEM - QUICK REFERENCE

## ✅ ALL SYSTEMS DEPLOYED & RUNNING

---

## 🌐 LIVE URLs

| Service | URL | Status |
|---------|-----|--------|
| Main Website | https://staffinn.com | ✅ Live |
| HRMS Portal | https://hrms.staffinn.com | ✅ Live |
| Employee Portal | https://employee.staffinn.com | ✅ Live |
| Backend API | https://api.staffinn.com | ✅ Live |
| Bridge Installer | [Download Link](https://staffinn-files.s3.ap-south-1.amazonaws.com/downloads/StaffInn-Attendance-Bridge-Setup.exe) | ✅ Available |

---

## 🔑 PRODUCTION CREDENTIALS

### Test Company:
```
Company ID: COMP-F86D581E
API Key: sk_live_53fc1758834557b03157f9acf9649cdb123234f8be49f0987986303a8cf89a56
Recruiter ID: 7e0dd1ad-e456-444f-8992-5a66af451238
```

### Test Employee:
```
Employee ID: 5678
Device User ID: 5678
```

---

## 📱 CLIENT SETUP (3 STEPS)

### 1. Download & Install
```
https://staffinn-files.s3.ap-south-1.amazonaws.com/downloads/StaffInn-Attendance-Bridge-Setup.exe
```

### 2. Enter Credentials
- Company ID: `COMP-F86D581E`
- API Key: `sk_live_53fc...`

### 3. Connect Device
- Device IP: `192.168.1.224`
- Port: `5005`

**Done!** Auto-sync starts automatically (every 10 seconds)

---

## 🔄 ATTENDANCE FLOW

```
👆 Fingerprint → 🖥️ Device → 🔧 Bridge → ☁️ API → 💾 Database → 📡 WebSocket → 📊 Dashboard
```

**Timing**: Real-time (10 second sync interval)

---

## 🧪 QUICK TEST

### Test Attendance API:
```powershell
Invoke-RestMethod -Uri "https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance" `
  -Method POST `
  -Headers @{
    "x-company-id" = "COMP-F86D581E"
    "x-api-key" = "sk_live_53fc1758834557b03157f9acf9649cdb123234f8be49f0987986303a8cf89a56"
    "Content-Type" = "application/json"
  } `
  -Body '{"employeeId":"5678","checkIn":"18:10","date":"2026-05-14","source":"biometric"}' | ConvertTo-Json
```

**Expected**: `success: true` with attendanceId

---

## 🚨 COMMON ISSUES & FIXES

| Issue | Solution |
|-------|----------|
| Bridge not connecting | Check internet, verify credentials |
| Device not found | Verify IP (192.168.1.224), check LAN |
| Attendance not syncing | Clear device logs (ClearTime_Log) |
| Real-time not working | Refresh dashboard, check WebSocket |

---

## 🔧 BACKEND MANAGEMENT

### SSH to Server:
```bash
ssh -i "D:\staffinn-key.pem" ec2-user@3.109.94.100
```

### Check Logs:
```bash
cd /home/ec2-user/Backend
pm2 logs staffinn-backend --lines 50
```

### Restart Backend:
```bash
pm2 restart staffinn-backend --update-env
```

### Check Status:
```bash
pm2 status
```

---

## 📊 MONITORING

### Health Check:
```bash
curl https://api.staffinn.com/health
```

### Backend Status:
```bash
pm2 monit
```

---

## 🎯 KEY FEATURES

✅ **Real-time Sync**: 10 second interval
✅ **Smart Logic**: Auto check-in/check-out detection
✅ **Offline Support**: Queue + auto-retry
✅ **Duplicate Prevention**: 1-minute threshold
✅ **WebSocket Updates**: Instant dashboard refresh
✅ **Security**: Company-level authentication
✅ **Data Isolation**: Recruiter-based filtering

---

## 📞 SUPPORT CONTACTS

**Backend Server**: EC2 (3.109.94.100)
**Process Manager**: PM2
**Database**: DynamoDB (ap-south-1)
**CDN**: CloudFront

---

## 🎉 DEPLOYMENT STATUS

| Component | Status | Last Updated |
|-----------|--------|--------------|
| Backend API | ✅ Running | 2026-05-14 |
| HRMS Frontend | ✅ Deployed | 2026-05-14 |
| Main Frontend | ✅ Deployed | 2026-05-14 |
| Bridge Software | ✅ Ready | 2026-05-14 |
| Database | ✅ Active | 2026-05-14 |
| WebSocket | ✅ Connected | 2026-05-14 |

---

**System Status**: 🟢 ALL SYSTEMS OPERATIONAL

**Production Ready**: ✅ YES

**Next Action**: Test fingerprint punch and verify real-time sync
