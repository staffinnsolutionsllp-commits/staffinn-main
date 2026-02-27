# HRMS Attendance Setup - Complete Guide

## Current Status
✅ Employee Onboarding: Done (Employee ID: 1001)
⚠️ Attendance Page: Employees not showing
❌ Device Setup: Pending

## Troubleshooting Steps

### 1. Check if Employees are Loading

Open browser console (F12) and check:

```
Candidates Response: { success: true, data: [...] }
```

If you see empty array `data: []`, then:
- Backend is not returning employees
- Check if employee was created in correct table

### 2. Verify Employee in Database

The employee should be in `staffinn-hrms-candidates` table with:
- employeeId: "1001"
- name: "Haarddikk"
- email: "lakshya1403005@gmail.com"

### 3. Check Backend Endpoint

Test the candidates endpoint:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4001/api/v1/hrms/candidates
```

## Complete Flow

### Phase 1: Verify Employee Data ✅
1. Employee created via Onboarding
2. Employee stored in DynamoDB
3. Employee has employeeId: "1001"

### Phase 2: Attendance Page Setup ⚠️
1. Open Attendance page
2. Check if employee "Haarddikk" appears in table
3. If not appearing:
   - Check browser console for errors
   - Verify API response
   - Check if token is valid

### Phase 3: Device Setup ❌
1. Click "Device Setup" button on Attendance page
2. Enter Company ID and API Key
3. Download Bridge Software
4. Install on Windows PC

### Phase 4: Biometric Device Configuration ❌
1. Connect biometric device to PC
2. Open Bridge Software
3. Configure:
   - Company ID
   - API Key
   - Device IP/Connection
4. Add employee to device:
   - Employee ID: 1001
   - Name: Haarddikk
   - Enroll fingerprint

### Phase 5: Test Attendance ❌
1. Scan fingerprint on device
2. Bridge software sends data to backend
3. Attendance appears in HRMS
4. Real-time sync working

## Common Issues

### Issue 1: Employees not showing in Attendance page
**Cause**: API not returning data or token expired
**Solution**: 
- Refresh page
- Re-login
- Check browser console

### Issue 2: "No employees found" message
**Cause**: No employees in database
**Solution**:
- Go to Onboarding page
- Add employee with ID 1001
- Return to Attendance page

### Issue 3: Device not connecting
**Cause**: Bridge software not configured
**Solution**:
- Check Company ID and API Key
- Verify device is on same network
- Check firewall settings

## Next Steps

### Immediate Action Required:
1. **Open Attendance page**
2. **Check browser console (F12)**
3. **Look for "Candidates Response" log**
4. **Share the response here**

If employees are showing:
- ✅ Proceed to Device Setup
- ✅ Download Bridge Software
- ✅ Configure device

If employees NOT showing:
- ❌ Need to debug backend
- ❌ Check employee creation
- ❌ Verify API endpoint

## API Endpoints Used

1. **Get Candidates**: `GET /api/v1/hrms/candidates`
   - Returns list of all employees
   - Used in Attendance page

2. **Get Attendance**: `GET /api/v1/hrms/attendance/date/:date`
   - Returns attendance for specific date
   - Used to show check-in/out times

3. **Mark Attendance**: `POST /api/v1/hrms/attendance`
   - Manual attendance marking
   - Used when device not available

## Device Setup Requirements

### Hardware:
- Biometric fingerprint device (ZKTeco, eSSL, Mantra, etc.)
- Windows PC (for Bridge Software)
- Network connection

### Software:
- Bridge Software (download from HRMS)
- Device SDK (included in Bridge)
- .NET Framework 4.7.2+

### Network:
- Device and PC on same network
- Port 4001 accessible
- Internet connection for API calls

## Testing Checklist

- [ ] Employee appears in Onboarding page
- [ ] Employee appears in Attendance page
- [ ] Can manually mark attendance
- [ ] Device Setup page accessible
- [ ] Company credentials available
- [ ] Bridge Software downloaded
- [ ] Device connected to PC
- [ ] Employee added to device
- [ ] Fingerprint enrolled
- [ ] Test scan successful
- [ ] Attendance synced to HRMS

## Support

If stuck at any step:
1. Check browser console for errors
2. Check backend logs
3. Verify database entries
4. Test API endpoints manually
