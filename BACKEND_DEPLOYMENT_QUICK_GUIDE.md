# 🚀 BACKEND DEPLOYMENT - QUICK GUIDE

**EC2 Instance**: `3.109.94.100` (staffinn-backend-server)
**Status**: Running ✅

---

## ⚡ FASTEST WAY (Automated Script)

### Option 1: Batch Script (Windows CMD)
```cmd
cd d:\Staffinn-main
deploy-backend-now.bat "path\to\your\staffinn-key.pem"
```

### Option 2: PowerShell
```powershell
cd d:\Staffinn-main
.\deploy-backend-now.ps1 -SshKeyPath "path\to\your\staffinn-key.pem"
```

**Script will automatically**:
1. ✅ Test SSH connection
2. ✅ Create backup
3. ✅ Pull latest code (commit `088675b`)
4. ✅ Install dependencies
5. ✅ Restart PM2
6. ✅ Show logs

---

## 🔧 MANUAL DEPLOYMENT (If Script Fails)

### Step 1: SSH to EC2
```bash
ssh -i "path\to\staffinn-key.pem" ubuntu@3.109.94.100
```

### Step 2: Deploy
```bash
cd /home/ubuntu/staffinn-backend

# Backup (optional)
cp -r . ../backup-$(date +%Y%m%d-%H%M%S)

# Pull latest
git pull origin main

# Install
npm install --production

# Restart
pm2 restart staffinn-backend
pm2 save

# Check logs
pm2 logs staffinn-backend --lines 50
```

---

## 🧪 VERIFICATION

### 1. Health Check
```bash
curl https://api.staffinn.com/health
```
**Expected**: `{"status":"OK",...}`

### 2. Test Forgot Password API
```bash
curl -X POST https://api.staffinn.com/api/v1/employee/auth/forgot-password/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```
**Expected**: `{"success":true,"message":"Password reset code sent..."}`

### 3. Check Logs
```bash
ssh -i "key.pem" ubuntu@3.109.94.100
pm2 logs staffinn-backend
```

---

## ❓ TROUBLESHOOTING

### Issue: "Permission denied (publickey)"
**Fix**: Check SSH key permissions
```powershell
# Windows: Right-click key.pem > Properties > Security > Advanced
# Remove all users except yourself with Read-only permission
```

### Issue: "Connection timeout"
**Fix**: Check EC2 security group allows SSH from your IP
```bash
# Add your IP to security group (EC2 Console)
# Or use AWS CLI:
aws ec2 authorize-security-group-ingress \
  --group-id sg-XXXXX \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP/32
```

### Issue: "Git pull failed"
**Check**: SSH to EC2 and check git status
```bash
ssh -i key.pem ubuntu@3.109.94.100
cd /home/ubuntu/staffinn-backend
git status
git pull origin main
```

### Issue: "PM2 not found"
**Fix**: Install PM2 globally
```bash
npm install -g pm2
```

---

## 📊 POST-DEPLOYMENT CHECKLIST

After deployment:

- [ ] Health check returns 200 OK
- [ ] Forgot password API works
- [ ] PM2 shows backend as "online"
- [ ] No errors in PM2 logs
- [ ] Test actual forgot password flow on https://hrms.staffinn.in

---

## 🎯 COMPLETE DEPLOYMENT STATUS

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✅ LIVE | https://staffinn.in |
| Employee Portal | ✅ LIVE | https://hrms.staffinn.in |
| Master Admin | ✅ LIVE | https://admin.staffinn.in |
| News Admin | ✅ LIVE | https://news-admin.staffinn.in |
| Backend | ⏳ PENDING | https://api.staffinn.com |

---

## 📞 NEED HELP?

**If deployment fails**, check:
1. SSH key is correct and has proper permissions
2. EC2 instance is running
3. Security group allows SSH from your IP
4. PM2 is installed and configured

**View full logs**:
```bash
ssh -i key.pem ubuntu@3.109.94.100
cd /home/ubuntu/staffinn-backend
pm2 logs staffinn-backend
tail -f logs/error.log  # if exists
```

---

## 🎉 AFTER SUCCESSFUL DEPLOYMENT

**Test the complete flow**:
1. Visit https://hrms.staffinn.com
2. Click "Forgot your password?"
3. Enter email
4. Check email for OTP
5. Enter OTP
6. Reset password
7. Login with new password

**Everything should work! 🚀**

---

**Quick Commands**:
```bash
# Deploy
deploy-backend-now.bat "your-key.pem"

# Check status
ssh -i key.pem ubuntu@3.109.94.100 "pm2 status"

# View logs
ssh -i key.pem ubuntu@3.109.94.100 "pm2 logs staffinn-backend --lines 50 --nostream"

# Restart if needed
ssh -i key.pem ubuntu@3.109.94.100 "pm2 restart staffinn-backend"
```

---

**Last Updated**: $(date)
**EC2 IP**: 3.109.94.100
**Git Commit**: 088675b
