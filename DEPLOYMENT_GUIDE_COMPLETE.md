# 🚀 PRODUCTION DEPLOYMENT - STEP BY STEP GUIDE

**Date**: $(Get-Date)
**Git Commit**: `088675b`

---

## 📋 PRE-DEPLOYMENT CHECKLIST

- [x] All changes committed to git
- [x] Builds completed successfully
- [x] Environment variables verified
- [x] AWS credentials configured

---

## 🎯 AUTOMATED DEPLOYMENT (RECOMMENDED)

### Option 1: PowerShell (Recommended for Windows)

```powershell
# Navigate to project root
cd d:\Staffinn-main

# Run deployment script
.\deploy-production.ps1
```

**Script will**:
- ✅ Upload Frontend to S3 (staffinn.com)
- ✅ Upload Employee Portal to S3 (hrms.staffinn.com)
- ✅ Upload Master Admin to S3 (admin.staffinn.com)
- ✅ Upload News Admin to S3 (news-admin.staffinn.com)
- ✅ Invalidate CloudFront caches (if IDs configured)
- ℹ️  Show Backend deployment instructions

### Option 2: Batch Script

```cmd
cd d:\Staffinn-main
deploy-all-production.bat
```

---

## 🔧 MANUAL DEPLOYMENT (If Automated Fails)

### 1️⃣ FRONTEND (staffinn.com)

```powershell
cd d:\Staffinn-main\Frontend

# Upload to S3
aws s3 sync dist/ s3://staffinn.com --delete

# Invalidate CloudFront (replace DISTRIBUTION_ID)
aws cloudfront create-invalidation --distribution-id EXXXXXXXXX --paths "/*"
```

**Verify**: https://staffinn.com

---

### 2️⃣ EMPLOYEE PORTAL (hrms.staffinn.com) ⭐ PRIORITY

```powershell
cd d:\Staffinn-main\EmployeePortal

# Upload to S3
aws s3 sync dist/ s3://hrms.staffinn.com --delete

# Invalidate CloudFront (replace DISTRIBUTION_ID)
aws cloudfront create-invalidation --distribution-id EXXXXXXXXX --paths "/*"
```

**Verify**: https://hrms.staffinn.com
**Test Forgot Password**: Click "Forgot your password?" and test full flow!

---

### 3️⃣ MASTER ADMIN (admin.staffinn.com)

```powershell
cd d:\Staffinn-main\MasterAdminPanel

# Upload to S3
aws s3 sync dist/ s3://admin.staffinn.com --delete

# Invalidate CloudFront (replace DISTRIBUTION_ID)
aws cloudfront create-invalidation --distribution-id EXXXXXXXXX --paths "/*"
```

**Verify**: https://admin.staffinn.com

---

### 4️⃣ NEWS ADMIN (news-admin.staffinn.com)

```powershell
cd d:\Staffinn-main\NewsAdminPanel

# Upload to S3
aws s3 sync dist/ s3://news-admin.staffinn.com --delete

# Invalidate CloudFront (replace DISTRIBUTION_ID)
aws cloudfront create-invalidation --distribution-id EXXXXXXXXX --paths "/*"
```

**Verify**: https://news-admin.staffinn.com

---

### 5️⃣ BACKEND (EC2)

**Option A: SSH + Run Script**

```bash
# Copy deployment script to EC2
scp -i path/to/staffinn-key.pem deploy-backend-ec2.sh ubuntu@YOUR_EC2_IP:/home/ubuntu/

# SSH and run
ssh -i path/to/staffinn-key.pem ubuntu@YOUR_EC2_IP
cd /home/ubuntu
chmod +x deploy-backend-ec2.sh
./deploy-backend-ec2.sh
```

**Option B: Direct SSH Commands**

```bash
# One-liner deployment
ssh -i path/to/staffinn-key.pem ubuntu@YOUR_EC2_IP "cd /home/ubuntu/staffinn-backend && git pull origin main && npm install --production && pm2 restart staffinn-backend && pm2 save"
```

**Verify Backend**:
```bash
# Health check
curl https://api.staffinn.com/health

# Test forgot password endpoint
curl -X POST https://api.staffinn.com/api/v1/employee/auth/forgot-password/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## ✅ POST-DEPLOYMENT TESTING

### Critical Tests (in order):

1. **Backend Health**
   - [ ] https://api.staffinn.com/health returns 200 OK
   
2. **Frontend (staffinn.com)**
   - [ ] Home page loads
   - [ ] Login/Registration works
   - [ ] Campus drive features visible
   
3. **Employee Portal (hrms.staffinn.com)** ⭐ MOST IMPORTANT
   - [ ] Login page loads
   - [ ] "Forgot your password?" link visible
   - [ ] **FORGOT PASSWORD FLOW**:
     - [ ] Enter email → Click "Send reset code"
     - [ ] Check email for OTP (check spam folder)
     - [ ] Enter 6-digit OTP
     - [ ] Enter new password (8+ chars, letter+number)
     - [ ] See success message
     - [ ] Redirect to login
     - [ ] Login with new password ✅
   - [ ] Dashboard loads after login
   - [ ] Attendance, Leave, Claims pages work
   
4. **Master Admin (admin.staffinn.com)**
   - [ ] Login works
   - [ ] Registration requests visible
   
5. **News Admin (news-admin.staffinn.com)**
   - [ ] Login works
   - [ ] News creation works

---

## 🔍 TROUBLESHOOTING

### Issue: AWS CLI "Profile not found"

```powershell
# Configure AWS credentials
aws configure

# Or use environment variables
$env:AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY"
$env:AWS_SECRET_ACCESS_KEY="YOUR_SECRET_KEY"
$env:AWS_DEFAULT_REGION="ap-south-1"
```

### Issue: S3 Upload "Access Denied"

Check:
1. AWS credentials are valid
2. S3 bucket names are correct
3. IAM user has S3 write permissions

### Issue: CloudFront Invalidation Fails

```powershell
# List CloudFront distributions to get IDs
aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,Aliases.Items]" --output table
```

### Issue: Backend Not Restarting

```bash
# SSH to EC2
ssh -i path/to/key.pem ubuntu@YOUR_EC2_IP

# Check PM2 status
pm2 list

# View logs
pm2 logs staffinn-backend

# Force restart
pm2 restart staffinn-backend --force

# If still failing, check manually
cd /home/ubuntu/staffinn-backend
npm install
node server.js  # Test directly
```

### Issue: Forgot Password Email Not Received

Check:
1. Backend `.env` has `RESEND_API_KEY=re_XDmEgB48_4nBWaP7nBrmrv5MgbLXBeJVw`
2. Backend logs: `pm2 logs staffinn-backend | grep -i "email"`
3. Check spam folder
4. Test with curl:
   ```bash
   curl -X POST https://api.staffinn.com/api/v1/employee/auth/forgot-password/send-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"your-test-email@gmail.com"}'
   ```

---

## 🔄 ROLLBACK PROCEDURE

### Rollback Frontend/Panels

```powershell
# Option 1: Re-upload previous build
cd path/to/previous/dist
aws s3 sync . s3://BUCKET_NAME --delete

# Option 2: Use S3 versioning (if enabled)
aws s3api list-object-versions --bucket BUCKET_NAME --prefix index.html
aws s3api get-object --bucket BUCKET_NAME --key index.html --version-id VERSION_ID index.html
```

### Rollback Backend

```bash
ssh -i key.pem ubuntu@EC2_IP
cd /home/ubuntu/staffinn-backend

# Revert git commit
git reset --hard HEAD~1

# Reinstall dependencies
npm install --production

# Restart
pm2 restart staffinn-backend
```

---

## 📊 DEPLOYMENT SUMMARY

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | https://staffinn.com | 🟢 Ready |
| Employee Portal | https://hrms.staffinn.com | 🟢 Ready |
| Master Admin | https://admin.staffinn.com | 🟢 Ready |
| News Admin | https://news-admin.staffinn.com | 🟢 Ready |
| Backend API | https://api.staffinn.com | 🟢 Ready |

---

## 🎉 NEW FEATURES DEPLOYED

### 🔐 HRMS Forgot Password (Employee Portal)
- Users can reset password via email OTP
- 6-digit OTP sent to registered email
- Password reset with proper validation
- Confirmation email on success

### 📦 Other Updates
- Frontend: Campus drive tracking, news redesign
- Backend: Email service enhancements
- All panels: UI/UX improvements

---

## 📞 SUPPORT

**If deployment fails or issues occur:**
- Check logs: `pm2 logs staffinn-backend`
- Test APIs: Use Postman/curl
- Contact: support@staffinn.com

---

**Status: 🟢 READY FOR PRODUCTION DEPLOYMENT**

**Last Updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
