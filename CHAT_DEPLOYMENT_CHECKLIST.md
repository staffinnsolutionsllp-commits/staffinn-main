# Chat UI Improvements - Deployment Checklist

## Pre-Deployment Checklist

### 1. Code Review ✅
- [x] All code changes reviewed
- [x] No console.log statements in production code
- [x] Error handling implemented
- [x] Security measures in place
- [x] Code follows project standards

### 2. Environment Setup
- [ ] AWS credentials configured in .env
- [ ] S3 bucket created: `staffinn-files`
- [ ] S3 CORS configured
- [ ] S3 permissions set correctly
- [ ] Environment variables verified

### 3. Dependencies
- [x] Backend: multer installed (v1.4.5-lts.2)
- [x] Backend: @aws-sdk/client-s3 installed
- [x] Backend: @aws-sdk/s3-request-presigner installed
- [x] Frontend: No new dependencies needed
- [x] All dependencies up to date

### 4. Testing
- [ ] Profile photo display tested
- [ ] File upload tested (Document, Photo, Video)
- [ ] Send icon tested
- [ ] File display tested
- [ ] Data isolation verified
- [ ] Error handling tested
- [ ] Mobile responsive tested
- [ ] Cross-browser tested

---

## Environment Configuration

### Backend .env File
```env
# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET_NAME=staffinn-files

# Optional: CloudFront for faster delivery
CLOUDFRONT_URL=https://your-cloudfront-domain.cloudfront.net

# API Configuration
VITE_API_URL=http://localhost:4001/api/v1
```

### Frontend .env File
```env
VITE_API_URL=http://localhost:4001/api/v1
# or for production:
# VITE_API_URL=https://api.staffinn.com/api/v1
```

---

## AWS S3 Setup

### 1. Create S3 Bucket
```bash
# Using AWS CLI
aws s3 mb s3://staffinn-files --region ap-south-1
```

### 2. Configure CORS
Create file: `cors-config.json`
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Apply CORS:
```bash
aws s3api put-bucket-cors --bucket staffinn-files --cors-configuration file://cors-config.json
```

### 3. Set Bucket Policy
Create file: `bucket-policy.json`
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::staffinn-files/chat-files/*"
    }
  ]
}
```

Apply policy:
```bash
aws s3api put-bucket-policy --bucket staffinn-files --policy file://bucket-policy.json
```

### 4. Create Folder Structure
```bash
# Create chat-files folder
aws s3api put-object --bucket staffinn-files --key chat-files/
```

---

## Deployment Steps

### Step 1: Backend Deployment

#### 1.1 Install Dependencies
```bash
cd Backend
npm install
```

#### 1.2 Verify Environment Variables
```bash
# Check .env file exists
cat .env

# Verify AWS credentials
node -e "console.log(process.env.AWS_ACCESS_KEY_ID ? 'AWS credentials found' : 'AWS credentials missing')"
```

#### 1.3 Test Backend Locally
```bash
npm start
# Server should start on port 4001
```

#### 1.4 Test File Upload Endpoint
```bash
curl -X POST http://localhost:4001/api/v1/messages/send-file \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "receiverId=test-user-id" \
  -F "fileType=document"
```

#### 1.5 Deploy to Production
```bash
# Build and deploy (adjust based on your deployment method)
npm run build
# Deploy to EC2/ECS/Lambda
```

### Step 2: Frontend Deployment

#### 2.1 Install Dependencies
```bash
cd Frontend
npm install
```

#### 2.2 Update API URL
```bash
# Update .env for production
echo "VITE_API_URL=https://api.staffinn.com/api/v1" > .env.production
```

#### 2.3 Test Frontend Locally
```bash
npm run dev
# App should start on port 5173
```

#### 2.4 Build for Production
```bash
npm run build
# Creates dist/ folder
```

#### 2.5 Deploy to Production
```bash
# Deploy dist/ folder to S3/CloudFront/Netlify/Vercel
# Example for S3:
aws s3 sync dist/ s3://your-frontend-bucket --delete
```

---

## Post-Deployment Verification

### 1. Smoke Tests

#### Test 1: Profile Photo Display
- [ ] Open chat window
- [ ] Verify profile photo appears in header
- [ ] Verify fallback to letter if no photo

#### Test 2: Send Icon
- [ ] Type a message
- [ ] Verify send icon is visible
- [ ] Click send icon
- [ ] Verify message sends

#### Test 3: File Upload Menu
- [ ] Click plus icon
- [ ] Verify menu appears with 3 options
- [ ] Verify menu closes on selection

#### Test 4: Document Upload
- [ ] Upload a PDF file
- [ ] Verify file uploads successfully
- [ ] Verify document link appears in chat
- [ ] Click link to verify file opens

#### Test 5: Photo Upload
- [ ] Upload an image file
- [ ] Verify image uploads successfully
- [ ] Verify image displays inline
- [ ] Verify image is clickable

#### Test 6: Video Upload
- [ ] Upload a video file
- [ ] Verify video uploads successfully
- [ ] Verify video player appears
- [ ] Verify video plays

### 2. Integration Tests

#### Test 1: End-to-End Message Flow
```
1. User A logs in
2. User A opens chat with User B
3. User A sends text message
4. User A uploads photo
5. User A uploads document
6. User B logs in
7. User B sees all messages
8. User B can view/download files
```

#### Test 2: Data Isolation
```
1. User A uploads file to User B
2. User C logs in
3. User C cannot access User A's file
4. Verify S3 path is user-specific
```

### 3. Performance Tests

#### Test 1: File Upload Speed
- [ ] Small file (< 1MB): < 2 seconds
- [ ] Medium file (5-10MB): < 10 seconds
- [ ] Large file (20-50MB): < 30 seconds

#### Test 2: UI Responsiveness
- [ ] Chat opens: < 1 second
- [ ] Messages load: < 2 seconds
- [ ] Profile photo loads: < 1 second

### 4. Security Tests

#### Test 1: Authentication
- [ ] Unauthenticated requests rejected
- [ ] Invalid tokens rejected
- [ ] Expired tokens rejected

#### Test 2: Authorization
- [ ] Users can only access their own files
- [ ] File paths are user-specific
- [ ] No cross-user data leakage

#### Test 3: File Validation
- [ ] Files > 50MB rejected
- [ ] Invalid file types rejected
- [ ] Malicious files blocked

---

## Monitoring & Logging

### 1. Backend Logs to Monitor
```javascript
// File upload logs
console.log('S3 Upload - Starting upload:', { key, fileSize, mimeType });
console.log('S3 Upload - Success:', { key, fileUrl });

// Error logs
console.error('S3 upload error:', { key, error });
console.error('Error sending file message:', error);
```

### 2. Frontend Logs to Monitor
```javascript
// Profile photo fetch
console.error('Error fetching recipient profile:', error);

// File upload
console.error('Error uploading file:', error);

// Conversation fetch
console.error('Error fetching conversation:', error);
```

### 3. AWS CloudWatch Metrics
- [ ] S3 PUT requests
- [ ] S3 GET requests
- [ ] S3 storage usage
- [ ] API Gateway requests (if using)
- [ ] Lambda invocations (if using)

---

## Rollback Plan

### If Issues Occur

#### Step 1: Identify Issue
- Check error logs
- Check user reports
- Check monitoring dashboards

#### Step 2: Quick Fixes
```bash
# Restart backend
pm2 restart backend

# Clear cache
redis-cli FLUSHALL

# Restart frontend
# (depends on hosting platform)
```

#### Step 3: Rollback Code
```bash
# Backend rollback
cd Backend
git checkout previous-commit-hash
npm install
npm start

# Frontend rollback
cd Frontend
git checkout previous-commit-hash
npm install
npm run build
# Redeploy
```

#### Step 4: Rollback Database (if needed)
```bash
# Restore DynamoDB table from backup
aws dynamodb restore-table-from-backup \
  --target-table-name Messages \
  --backup-arn arn:aws:dynamodb:region:account:table/Messages/backup/backup-name
```

---

## Success Criteria

### Deployment is successful when:
- [x] All code changes deployed
- [ ] All tests passing
- [ ] No critical errors in logs
- [ ] Profile photos displaying
- [ ] File uploads working
- [ ] Files displaying correctly
- [ ] Data isolation verified
- [ ] Performance metrics met
- [ ] Security tests passed
- [ ] User acceptance testing passed

---

## Communication Plan

### Before Deployment
- [ ] Notify team of deployment schedule
- [ ] Prepare rollback plan
- [ ] Backup database
- [ ] Schedule maintenance window (if needed)

### During Deployment
- [ ] Monitor logs in real-time
- [ ] Test each feature after deployment
- [ ] Keep team updated on progress

### After Deployment
- [ ] Announce successful deployment
- [ ] Share testing results
- [ ] Document any issues encountered
- [ ] Update documentation

---

## Support Plan

### User Support
- [ ] Update help documentation
- [ ] Create user guide for file uploads
- [ ] Prepare FAQ for common issues
- [ ] Train support team on new features

### Technical Support
- [ ] Document troubleshooting steps
- [ ] Create runbook for common issues
- [ ] Set up monitoring alerts
- [ ] Establish on-call rotation

---

## Documentation Updates

### Update These Documents
- [ ] API documentation
- [ ] User manual
- [ ] Developer guide
- [ ] Architecture diagram
- [ ] Database schema
- [ ] Deployment guide

---

## Final Checklist

### Before Going Live
- [ ] All tests passed
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] AWS S3 configured
- [ ] Monitoring set up
- [ ] Rollback plan ready
- [ ] Team notified
- [ ] Documentation updated

### After Going Live
- [ ] Smoke tests completed
- [ ] Performance verified
- [ ] Security verified
- [ ] User feedback collected
- [ ] Issues documented
- [ ] Success metrics tracked

---

## Contact Information

### Escalation Path
1. **Level 1:** Development Team
2. **Level 2:** Tech Lead
3. **Level 3:** CTO/Engineering Manager

### Emergency Contacts
- Development Team: dev-team@staffinn.com
- DevOps Team: devops@staffinn.com
- On-Call Engineer: oncall@staffinn.com

---

## Sign-Off

### Deployment Approval
- [ ] Developer: _________________ Date: _______
- [ ] Tech Lead: _________________ Date: _______
- [ ] QA Lead: __________________ Date: _______
- [ ] Product Owner: _____________ Date: _______

---

**Deployment Date:** _______________
**Deployment Time:** _______________
**Deployed By:** ___________________
**Status:** ⏳ Pending / ✅ Complete / ❌ Failed

---

## Notes

_Add any additional notes or observations here:_

---

**Last Updated:** April 8, 2026
**Version:** 1.0.0
