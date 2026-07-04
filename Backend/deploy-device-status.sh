#!/bin/bash

# Deployment script for device status backend update
# Run this on your EC2 server

echo "🚀 Starting backend deployment for device status feature..."

# Navigate to backend directory
cd /home/ec2-user/Backend/controllers/hrms

# Create backup
echo "📦 Creating backup..."
cp hrmsAttendanceController.js hrmsAttendanceController.js.backup.$(date +%Y%m%d_%H%M%S)

# The file is already updated locally, just need to restart PM2
cd /home/ec2-user/Backend

echo "🔄 Restarting PM2..."
pm2 restart staffinn-backend

echo "✅ Checking PM2 status..."
pm2 status

echo "📋 Checking logs..."
pm2 logs staffinn-backend --lines 20 --nostream

echo "✅ Deployment complete!"
echo ""
echo "🧪 Test the endpoint:"
echo "curl -H 'Authorization: Bearer YOUR_JWT_TOKEN' https://api.staffinn.com/api/v1/hrms/attendance/device-status"
