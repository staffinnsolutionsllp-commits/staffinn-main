# Quick Deploy Backend to EC2
# Run this from d:\Staffinn-main directory

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Backend Deployment to EC2" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$EC2_IP = "3.109.94.100"
$KEY_PATH = "D:\staffinn-key.pem"
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "`n[1/4] Creating Backend archive..." -ForegroundColor Yellow
cd Backend
tar -czf "../Backend-$TIMESTAMP.tar.gz" .
cd ..

Write-Host "`n[2/4] Uploading to EC2..." -ForegroundColor Yellow
scp -i $KEY_PATH "Backend-$TIMESTAMP.tar.gz" "ec2-user@${EC2_IP}:/home/ec2-user/"

Write-Host "`n[3/4] Deploying on EC2..." -ForegroundColor Yellow
ssh -i $KEY_PATH "ec2-user@$EC2_IP" @"
    echo '=== Backing up current Backend ==='
    cd /home/ec2-user
    if [ -d Backend ]; then
        mv Backend Backend-backup-$TIMESTAMP
    fi
    
    echo '=== Extracting new Backend ==='
    mkdir Backend
    tar -xzf Backend-$TIMESTAMP.tar.gz -C Backend/
    
    echo '=== Installing dependencies ==='
    cd Backend
    npm install --production
    
    echo '=== Restarting PM2 ==='
    pm2 restart all
    
    echo '=== Waiting for startup ==='
    sleep 5
    
    echo '=== Checking status ==='
    pm2 status
    pm2 logs --lines 20
"@

Write-Host "`n[4/4] Cleaning up local archive..." -ForegroundColor Yellow
Remove-Item "Backend-$TIMESTAMP.tar.gz"

Write-Host "`n==================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host "`nCheck logs with: ssh -i $KEY_PATH ec2-user@$EC2_IP 'pm2 logs --lines 50'" -ForegroundColor Cyan
