# 🚀 Backend Deployment Guide - Device Status Feature

## ⚠️ SSH Connection Issue
The automated deployment cannot connect to EC2 (13.233.105.122). This could be due to:
- Security group rules blocking your current IP
- VPN/network connectivity issues
- EC2 instance might be stopped

## 📋 Manual Deployment Steps

### Option 1: Using SSH (Once Connection is Restored)

1. **Connect to EC2:**
   ```bash
   ssh -i "D:\staffinn-key.pem" ec2-user@13.233.105.122
   ```

2. **Navigate to backend directory:**
   ```bash
   cd /home/ec2-user/Backend/controllers/hrms
   ```

3. **Create backup:**
   ```bash
   cp hrmsAttendanceController.js hrmsAttendanceController.js.backup.$(date +%Y%m%d_%H%M%S)
   ```

4. **Upload the updated file:**
   From your local machine:
   ```bash
   scp -i "D:\staffinn-key.pem" "d:\Staffinn-main\Backend\controllers\hrms\hrmsAttendanceController.js" ec2-user@13.233.105.122:/home/ec2-user/Backend/controllers/hrms/
   ```

5. **Restart PM2:**
   ```bash
   cd /home/ec2-user/Backend
   pm2 restart staffinn-backend
   ```

6. **Verify deployment:**
   ```bash
   pm2 logs staffinn-backend --lines 30
   ```

### Option 2: Using AWS Systems Manager (Session Manager)

If SSH is blocked, use AWS Console:

1. Go to AWS Console → EC2 → Instances
2. Select your instance (13.233.105.122)
3. Click "Connect" → "Session Manager" → "Connect"
4. Run the same commands as Option 1

### Option 3: Manual File Edit via Nano/Vim

1. **SSH to server:**
   ```bash
   ssh -i "D:\staffinn-key.pem" ec2-user@13.233.105.122
   ```

2. **Edit the file:**
   ```bash
   cd /home/ec2-user/Backend/controllers/hrms
   nano hrmsAttendanceController.js
   ```

3. **Find the `getDeviceStatus` function** (around line 300-350)

4. **Replace it with the updated version** (see below)

5. **Save:** Ctrl+X, then Y, then Enter

6. **Restart PM2:**
   ```bash
   cd /home/ec2-user/Backend
   pm2 restart staffinn-backend
   ```

---

## ✅ Updated getDeviceStatus Function

The function is already updated in your local file at:
`d:\Staffinn-main\Backend\controllers\hrms\hrmsAttendanceController.js`

**Key Changes:**
- Extracts `recruiterId` from JWT token (`req.user.recruiterId`)
- Queries `staffinn-hrms-companies` table using `recruiterId-index` GSI
- Gets `companyId` from the company record
- Checks heartbeat using `companyId` instead of `deviceId`
- Returns connection status based on 30-second heartbeat window

---

## 🧪 Testing After Deployment

1. **Check PM2 status:**
   ```bash
   pm2 status
   pm2 logs staffinn-backend --lines 50
   ```

2. **Test the endpoint:**
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        https://api.staffinn.com/api/v1/hrms/attendance/device-status
   ```

3. **Expected Response:**
   ```json
   {
     "success": true,
     "data": {
       "connected": true,
       "lastSeen": "2026-05-09T06:30:00.000Z",
       "companyId": "abc123"
     },
     "message": "Device status retrieved"
   }
   ```

---

## 🔍 Troubleshooting

### If SSH times out:
1. Check EC2 instance status in AWS Console
2. Verify security group allows SSH (port 22) from your IP
3. Check if you're on VPN/corporate network blocking SSH
4. Try AWS Systems Manager Session Manager instead

### If PM2 restart fails:
```bash
pm2 delete staffinn-backend
pm2 start /home/ec2-user/Backend/server.js --name staffinn-backend
pm2 save
```

### If device status shows disconnected:
1. Verify Bridge Software is running
2. Check Bridge is sending heartbeats to `/heartbeat` endpoint
3. Verify `companyId` matches between Bridge and database
4. Check backend logs: `pm2 logs staffinn-backend`

---

## 📊 Current Status

✅ Frontend deployed to S3 + CloudFront
✅ Local backend file updated
⏳ Backend deployment pending (SSH connection issue)

**Next Step:** Restore SSH connection and run deployment commands above.

---

## 🆘 Quick Fix Commands

If you can SSH, run this one-liner:
```bash
ssh -i "D:\staffinn-key.pem" ec2-user@13.233.105.122 "cd /home/ec2-user/Backend && pm2 restart staffinn-backend && pm2 logs staffinn-backend --lines 20 --nostream"
```
