# Complete Deployment Guide - Staffinn Platform

## 🎯 What Needs to be Deployed

### 1. **Backend Changes**
- ✅ Razorpay payment integration
- ✅ Payment routes and controllers
- ✅ HRMS notification system
- ✅ Notification service and controllers
- ✅ WebSocket notification support
- ✅ Claim approval notifications
- ✅ Grievance notifications with detailed logging

### 2. **Frontend Changes**
- ✅ Payment modal component
- ✅ Course detail page with payment
- ✅ Payment API methods

### 3. **Employee Portal Changes**
- ✅ Notification bell component
- ✅ Notification API integration
- ✅ Layout with notification bell
- ✅ Real-time WebSocket connection

### 4. **Database Changes**
- ✅ DynamoDB table: `payment-transactions`
- ✅ DynamoDB table: `staffinn-hrms-notifications`

### 5. **Environment Variables**
- ✅ Razorpay keys (test/live)

---

## 📦 Deployment Steps

### **Step 1: Prepare Backend for Deployment**

#### 1.1 Update Environment Variables
```bash
cd Backend
```

Edit `.env.production` file:
```env
# Add these new variables
RAZORPAY_KEY_ID=your_live_razorpay_key_id
RAZORPAY_KEY_SECRET=your_live_razorpay_key_secret

# Make sure these exist
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

#### 1.2 Install Dependencies (if not already)
```bash
npm install
```

#### 1.3 Test Backend Locally
```bash
npm run dev
```
Check if everything works without errors.

---

### **Step 2: Deploy Backend to EC2**

#### Option A: Using Git (Recommended)

```bash
# On your local machine
cd Backend
git add .
git commit -m "Added payment integration and notification system"
git push origin main
```

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to backend directory
cd /path/to/Staffinn-main/Backend

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart PM2 process
pm2 restart staffinn-backend

# Check logs
pm2 logs staffinn-backend
```

#### Option B: Using SCP (Manual File Transfer)

```bash
# From your local machine
scp -i your-key.pem -r Backend/* ubuntu@your-ec2-ip:/path/to/Staffinn-main/Backend/

# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate and restart
cd /path/to/Staffinn-main/Backend
npm install
pm2 restart staffinn-backend
```

---

### **Step 3: Deploy Frontend to S3/CloudFront**

#### 3.1 Build Frontend
```bash
cd Frontend
npm install
npm run build
```

#### 3.2 Upload to S3
```bash
# Using AWS CLI
aws s3 sync dist/ s3://your-frontend-bucket/ --delete

# Or using S3 Console
# 1. Go to AWS S3 Console
# 2. Open your bucket
# 3. Upload all files from Frontend/dist/
# 4. Make sure to set public read permissions
```

#### 3.3 Invalidate CloudFront Cache (if using CloudFront)
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

---

### **Step 4: Deploy Employee Portal**

#### 4.1 Update Environment Variables
```bash
cd EmployeePortal
```

Edit `.env` or `.env.production`:
```env
VITE_API_URL=https://your-backend-domain.com/api/v1
```

#### 4.2 Build Employee Portal
```bash
npm install
npm run build
```

#### 4.3 Deploy to Server
```bash
# Option 1: Deploy to separate S3 bucket
aws s3 sync dist/ s3://your-employee-portal-bucket/ --delete

# Option 2: Deploy to EC2 (if serving via Nginx)
scp -i your-key.pem -r dist/* ubuntu@your-ec2-ip:/var/www/employee-portal/
```

---

### **Step 5: Verify DynamoDB Tables**

#### 5.1 Check if tables exist
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to backend
cd /path/to/Staffinn-main/Backend

# Run table creation scripts
node scripts/createPaymentTransactionsTable.js
```

#### 5.2 Verify in AWS Console
1. Go to AWS DynamoDB Console
2. Check if these tables exist:
   - `payment-transactions`
   - `staffinn-hrms-notifications`

---

### **Step 6: Configure Razorpay**

#### 6.1 Get Live API Keys
1. Login to Razorpay Dashboard: https://dashboard.razorpay.com
2. Go to Settings → API Keys
3. Generate Live Keys (if not already)
4. Copy Key ID and Key Secret

#### 6.2 Update Backend .env
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Edit .env file
cd /path/to/Staffinn-main/Backend
nano .env

# Add/Update
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
RAZORPAY_KEY_SECRET=your_live_secret

# Save and exit (Ctrl+X, Y, Enter)

# Restart backend
pm2 restart staffinn-backend
```

#### 6.3 Update Frontend .env
Update Razorpay key in Frontend build:
```bash
# Local machine
cd Frontend
nano .env.production

# Add
VITE_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX

# Rebuild and redeploy
npm run build
aws s3 sync dist/ s3://your-frontend-bucket/ --delete
```

---

### **Step 7: Test Everything**

#### 7.1 Test Backend
```bash
# Check if backend is running
curl https://your-backend-domain.com/api/v1/health

# Check payment routes
curl https://your-backend-domain.com/api/v1/payments/test
```

#### 7.2 Test Frontend
1. Open your website: https://your-domain.com
2. Go to any course
3. Click "Buy Now"
4. Check if payment modal opens
5. Try test payment

#### 7.3 Test Employee Portal
1. Open: https://your-employee-portal-domain.com
2. Login as employee
3. Check notification bell appears
4. Submit a claim
5. Approve from HRMS
6. Check if notification appears

#### 7.4 Test Notifications
1. Login to Employee Portal
2. Submit grievance
3. Check if manager gets notification
4. Manager updates status
5. Check if employee gets notification

---

## 🔧 Common Deployment Issues & Fixes

### Issue 1: Backend not starting
```bash
# Check PM2 logs
pm2 logs staffinn-backend

# Check if port is in use
sudo lsof -i :4001

# Restart PM2
pm2 restart staffinn-backend
```

### Issue 2: Frontend showing old version
```bash
# Clear CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"

# Clear browser cache
# Press Ctrl+Shift+R (hard refresh)
```

### Issue 3: Razorpay not working
```bash
# Check if keys are correct
cd Backend
cat .env | grep RAZORPAY

# Check backend logs
pm2 logs staffinn-backend | grep razorpay
```

### Issue 4: Notifications not appearing
```bash
# Check if WebSocket is working
# Open browser console
# Look for "WebSocket connected" message

# Check backend logs
pm2 logs staffinn-backend | grep WebSocket
```

### Issue 5: DynamoDB table not found
```bash
# Create tables manually
cd Backend
node scripts/createPaymentTransactionsTable.js

# Or create via AWS Console
# Go to DynamoDB → Create Table
```

---

## 📊 Post-Deployment Verification Checklist

- [ ] Backend is running without errors
- [ ] Frontend loads correctly
- [ ] Employee Portal loads correctly
- [ ] Payment modal opens on course page
- [ ] Razorpay checkout works
- [ ] Notification bell appears in Employee Portal
- [ ] Notifications are received in real-time
- [ ] Claim approval sends notification
- [ ] Grievance submission sends notification
- [ ] WebSocket connection is established
- [ ] All API endpoints are working
- [ ] DynamoDB tables are accessible

---

## 🚨 Rollback Plan (If Something Goes Wrong)

### Rollback Backend
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to backend
cd /path/to/Staffinn-main/Backend

# Checkout previous commit
git log --oneline  # Find previous commit hash
git checkout <previous-commit-hash>

# Restart
pm2 restart staffinn-backend
```

### Rollback Frontend
```bash
# Local machine
cd Frontend
git checkout <previous-commit-hash>
npm run build
aws s3 sync dist/ s3://your-frontend-bucket/ --delete
```

---

## 📞 Support Commands

### Check Backend Status
```bash
pm2 status
pm2 logs staffinn-backend --lines 100
```

### Check Nginx Status (if using)
```bash
sudo systemctl status nginx
sudo nginx -t
sudo systemctl restart nginx
```

### Check Database Connection
```bash
cd Backend
node -e "require('./config/dynamodb-wrapper'); console.log('DB Connected')"
```

### Monitor Real-time Logs
```bash
pm2 logs staffinn-backend --lines 100 --raw
```

---

## 🎉 Deployment Complete!

After successful deployment:
1. Test all features thoroughly
2. Monitor logs for any errors
3. Check user feedback
4. Keep backup of working version

---

## 📝 Important Notes

1. **Always test in staging before production**
2. **Keep backup of .env files**
3. **Document any custom configurations**
4. **Monitor server resources (CPU, Memory)**
5. **Set up error monitoring (Sentry, CloudWatch)**
6. **Enable HTTPS for all domains**
7. **Set up automated backups for DynamoDB**

---

## 🔐 Security Checklist

- [ ] HTTPS enabled on all domains
- [ ] API keys stored in .env (not in code)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] Authentication tokens secure
- [ ] Sensitive data encrypted

---

## 📈 Monitoring & Maintenance

### Set up CloudWatch Alarms
1. CPU usage > 80%
2. Memory usage > 80%
3. API error rate > 5%
4. Response time > 2 seconds

### Regular Maintenance
- Weekly: Check logs for errors
- Monthly: Update dependencies
- Quarterly: Security audit
- Yearly: Performance optimization

---

## 🆘 Emergency Contacts

- AWS Support: https://console.aws.amazon.com/support
- Razorpay Support: https://razorpay.com/support
- Your DevOps Team: [Add contact]

---

**Deployment Date:** [Add date after deployment]  
**Deployed By:** [Your name]  
**Version:** 2.0.0 (Payment + Notifications)
