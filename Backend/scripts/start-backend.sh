#!/bin/bash
cd /home/ubuntu/staffinn-backend
echo "Starting backend with PM2..."
pm2 start server.js --name staffinn-backend
pm2 save
echo "Backend started successfully"
pm2 logs staffinn-backend --lines 10 --nostream
