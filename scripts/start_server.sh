#!/bin/bash
echo "Starting Staffinn Backend Server..."

cd /home/ec2-user/staffinn-backend

# Set environment to production
export NODE_ENV=production

# Start server with PM2
pm2 start server.js --name "staffinn-backend" --env production || pm2 restart staffinn-backend

# Save PM2 configuration
pm2 save

echo "Server started successfully"