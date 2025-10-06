#!/bin/bash
echo "Stopping Staffinn Backend Server..."

# Stop PM2 process if running
pm2 stop staffinn-backend || echo "No PM2 process found"

# Kill any remaining Node.js processes on port 4001
sudo fuser -k 4001/tcp || echo "No process on port 4001"

echo "Server stopped successfully"