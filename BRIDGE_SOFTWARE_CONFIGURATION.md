# 🔌 Staffinn Bridge Software Configuration Guide

## Overview
This guide explains how to configure the Staffinn Bridge software to send biometric attendance data to your HRMS system.

---

## 🎯 Configuration for Production

### API Endpoint Configuration

**Production API Endpoint:**
```
https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance
```

### Required Headers

```
Content-Type: application/json
x-company-id: <YOUR_COMPANY_ID>
x-api-key: <YOUR_API_KEY>
```

### Request Body Format

```json
{
  "employeeId": "EMP001",
  "checkIn": "09:00",
  "date": "2024-01-20",
  "source": "biometric",
  "deviceId": "DEVICE001"
}
```

---

## 🔧 Bridge Software Settings

### Step 1: Open Bridge Configuration

1. Open Staffinn Bridge application
2. Go to Settings/Configuration
3. Look for "API Configuration" or "Server Settings"

### Step 2: Configure API Endpoint

**For Production:**
- **Server URL**: `https://api.staffinn.com`
- **API Path**: `/api/v1/hrms/attendance/bridge-attendance`
- **Full URL**: `https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance`

**For Local Testing:**
- **Server URL**: `http://localhost:4001`
- **API Path**: `/api/v1/hrms/attendance/bridge-attendance`
- **Full URL**: `http://localhost:4001/api/v1/hrms/attendance/bridge-attendance`

### Step 3: Configure Authentication

**Company ID:**
- Get this from your HRMS Company Setup
- Format: Usually a UUID or company code
- Example: `COMP-12345` or `550e8400-e29b-41d4-a716-446655440000`

**API Key:**
- Get this from your HRMS Company Credentials
- Keep this secure and never share
- Example: `sk_live_abc123xyz789`

### Step 4: Configure Sync Settings

**Sync Mode:**
- ✅ **Real-time** (Recommended): Sends data immediately after punch
- ⏰ **Scheduled**: Sends data at intervals (e.g., every 5 minutes)

**Retry Settings:**
- **Max Retries**: 3
- **Retry Interval**: 30 seconds
- **Timeout**: 10 seconds

---

## 📝 Configuration File (If Applicable)

If your Bridge software uses a configuration file (e.g., `config.json`, `settings.ini`):

### config.json Example:

```json
{
  "api": {
    "baseUrl": "https://api.staffinn.com",
    "endpoint": "/api/v1/hrms/attendance/bridge-attendance",
    "timeout": 10000,
    "retries": 3
  },
  "auth": {
    "companyId": "YOUR_COMPANY_ID",
    "apiKey": "YOUR_API_KEY"
  },
  "sync": {
    "mode": "realtime",
    "interval": 300
  },
  "device": {
    "ip": "192.168.1.100",
    "port": 4370,
    "model": "ZKTeco"
  }
}
```

### settings.ini Example:

```ini
[API]
BaseUrl=https://api.staffinn.com
Endpoint=/api/v1/hrms/attendance/bridge-attendance
Timeout=10000
Retries=3

[Auth]
CompanyId=YOUR_COMPANY_ID
ApiKey=YOUR_API_KEY

[Sync]
Mode=realtime
Interval=300

[Device]
IP=192.168.1.100
Port=4370
Model=ZKTeco
```

---

## 🧪 Testing the Configuration

### Test 1: Connection Test

Most Bridge software has a "Test Connection" button. Click it to verify:
- ✅ Server is reachable
- ✅ API endpoint is correct
- ✅ Authentication is working

### Test 2: Manual Sync

1. Punch attendance on biometric device
2. Click "Sync Now" in Bridge software
3. Check Bridge logs for success message
4. Check HRMS Attendance section for new entry

### Test 3: Real-time Sync

1. Ensure Bridge is running
2. Punch attendance on biometric device
3. Wait 5-10 seconds
4. Check HRMS Attendance section
5. Entry should appear automatically

---

## 🔍 Troubleshooting

### Issue 1: Connection Failed

**Symptoms:**
- Bridge shows "Connection Failed" or "Server Unreachable"

**Solutions:**
1. Check internet connection
2. Verify server URL is correct
3. Check if firewall is blocking outbound connections
4. Try pinging the server: `ping api.staffinn.com`

### Issue 2: Authentication Failed

**Symptoms:**
- Bridge shows "401 Unauthorized" or "Invalid API Key"

**Solutions:**
1. Verify Company ID is correct
2. Verify API Key is correct
3. Check if API Key has expired
4. Regenerate API Key from HRMS

### Issue 3: Data Not Syncing

**Symptoms:**
- Bridge shows success but data doesn't appear in HRMS

**Solutions:**
1. Check if employee exists in HRMS
2. Verify employeeId matches between device and HRMS
3. Check HRMS backend logs for errors
4. Verify date/time format is correct

### Issue 4: Slow Sync

**Symptoms:**
- Data appears after long delay (>1 minute)

**Solutions:**
1. Change sync mode to "realtime"
2. Reduce sync interval
3. Check network latency
4. Verify server performance

---

## 📊 Bridge Software Logs

### Where to Find Logs

**Windows:**
```
C:\Program Files\Staffinn Bridge\logs\
C:\ProgramData\Staffinn Bridge\logs\
```

**Common Log Files:**
- `bridge.log` - Main application log
- `sync.log` - Sync operation log
- `error.log` - Error messages
- `api.log` - API request/response log

### What to Look For

**Success Message:**
```
[2024-01-20 09:00:15] INFO: Attendance synced successfully
[2024-01-20 09:00:15] INFO: Employee: EMP001, Time: 09:00, Status: 200 OK
```

**Error Message:**
```
[2024-01-20 09:00:15] ERROR: Failed to sync attendance
[2024-01-20 09:00:15] ERROR: Employee: EMP001, Error: Connection timeout
```

---

## 🔐 Security Best Practices

1. **Keep API Key Secure:**
   - Never share API key
   - Don't commit to version control
   - Rotate keys periodically

2. **Use HTTPS:**
   - Always use `https://` for production
   - Never use `http://` for production

3. **Restrict Access:**
   - Only allow Bridge software IP in firewall
   - Use VPN if possible

4. **Monitor Logs:**
   - Regularly check logs for suspicious activity
   - Set up alerts for failed authentication

---

## 📞 Support

If you need help configuring the Bridge software:

1. **Check Documentation**: Look for Bridge software manual
2. **Check Logs**: Review error messages in logs
3. **Test Manually**: Use curl/Postman to test API
4. **Contact Support**: Reach out to Staffinn support team

---

## ✅ Configuration Checklist

- [ ] Bridge software installed and running
- [ ] API endpoint configured correctly
- [ ] Company ID entered
- [ ] API Key entered
- [ ] Sync mode set to "realtime"
- [ ] Connection test successful
- [ ] Test punch successful
- [ ] Data appears in HRMS
- [ ] Logs show no errors
- [ ] Firewall configured correctly

---

## 🎉 Success Indicators

After proper configuration:

✅ Bridge shows "Connected" status
✅ Test connection succeeds
✅ Attendance data syncs within 5-10 seconds
✅ No errors in Bridge logs
✅ Data appears correctly in HRMS
✅ Employee names match correctly
✅ Timestamps are accurate

---

## 📝 Notes

- Keep Bridge software updated to latest version
- Backup configuration before making changes
- Test in local environment before production
- Document any custom configurations
- Keep Company ID and API Key in secure location
