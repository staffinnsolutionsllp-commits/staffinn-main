#!/bin/bash
cd /home/ubuntu/staffinn-backend
git pull origin main
npm install --production
pm2 restart staffinn-backend || pm2 start npm --name "staffinn-backend" -- start
pm2 save
pm2 logs staffinn-backend --lines 20 --nostream
