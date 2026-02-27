# EC2 Deployment Fix Guide

## Issue 1: Missing HRMS Routes Files
The EC2 instance doesn't have the latest code with HRMS routes.

## Issue 2: IAM Permission Error
EC2 role `EC2CodeDeployRole` lacks `dynamodb:CreateTable` permission.

---

## Solution Steps:

### Step 1: Fix IAM Permissions (AWS Console)

1. Go to AWS IAM Console
2. Find role: `EC2CodeDeployRole`
3. Add this policy (or update existing DynamoDB policy):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:CreateTable",
                "dynamodb:DescribeTable",
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:BatchWriteItem",
                "dynamodb:BatchGetItem"
            ],
            "Resource": "arn:aws:dynamodb:ap-south-1:243179894822:table/staffinn-*"
        }
    ]
}
```

### Step 2: Deploy Updated Code to EC2

**Option A: Manual Upload (Quick Fix)**

On your local machine:
```bash
# Compress Backend folder
cd d:\Staffinn-main
tar -czf Backend-update.tar.gz Backend/

# Upload to EC2
scp -i D:\staffinn-key.pem Backend-update.tar.gz ec2-user@3.109.94.100:/home/ec2-user/
```

On EC2:
```bash
ssh -i D:\staffinn-key.pem ec2-user@3.109.94.100

# Backup current Backend
cd /home/ec2-user
mv Backend Backend-backup-$(date +%Y%m%d-%H%M%S)

# Extract new code
tar -xzf Backend-update.tar.gz
cd Backend

# Install dependencies
npm install

# Restart PM2
pm2 restart all
pm2 logs --lines 50
```

**Option B: Git Pull (Recommended)**

On EC2:
```bash
ssh -i D:\staffinn-key.pem ec2-user@3.109.94.100

cd /home/ec2-user/Backend

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Restart PM2
pm2 restart all
pm2 logs --lines 50
```

### Step 3: Create HRMS Tables (After IAM fix)

On EC2:
```bash
cd /home/ec2-user/Backend
node scripts/create-hrms-companies-table.js
node scripts/create-hrms-attendance-table.js
```

### Step 4: Verify Application

```bash
pm2 status
pm2 logs --lines 30

# Check if server is running
curl http://localhost:4001/health
```

---

## Quick Commands Reference

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs --lines 50

# Restart app
pm2 restart all

# Stop app
pm2 stop all

# Check if port is in use
netstat -tulpn | grep 4001

# Test API
curl http://localhost:4001/health
curl http://localhost:4001/api/v1/hrms/auth/health
```

---

## Troubleshooting

### If "MODULE_NOT_FOUND" persists:
```bash
cd /home/ec2-user/Backend
ls -la routes/hrms/  # Verify files exist
npm install
pm2 restart all
```

### If IAM permission error persists:
- Wait 2-3 minutes after updating IAM policy
- Restart EC2 instance to refresh credentials

### Check file permissions:
```bash
chmod -R 755 /home/ec2-user/Backend
chown -R ec2-user:ec2-user /home/ec2-user/Backend
```
