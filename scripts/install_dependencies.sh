#!/bin/bash
echo "Installing Backend Dependencies..."

cd /home/ec2-user/staffinn-backend

# Install Node.js dependencies
npm install --production

# Set proper permissions
chmod +x /home/ec2-user/staffinn-backend/server.js

echo "Dependencies installed successfully"