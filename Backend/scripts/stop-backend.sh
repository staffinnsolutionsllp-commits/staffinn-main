#!/bin/bash
echo "Stopping backend..."
pm2 stop staffinn-backend || true
pm2 delete staffinn-backend || true
echo "Backend stopped"
