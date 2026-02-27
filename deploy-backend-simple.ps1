# Quick Deploy Backend to EC2 - Simple Version
# Run this from d:\Staffinn-main directory

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Backend Deployment to EC2" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$EC2_IP = "3.109.94.100"
$KEY_PATH = "D:\staffinn-key.pem"
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$ARCHIVE_NAME = "Backend-$TIMESTAMP.zip"

Write-Host "`n[1/4] Creating Backend archive..." -ForegroundColor Yellow
Compress-Archive -Path "Backend\*" -DestinationPath $ARCHIVE_NAME -Force

Write-Host "`n[2/4] Uploading to EC2..." -ForegroundColor Yellow
scp -i $KEY_PATH $ARCHIVE_NAME "ec2-user@${EC2_IP}:/home/ec2-user/"

Write-Host "`n[3/4] Deploying on EC2..." -ForegroundColor Yellow
$deployScript = @"
cd /home/ec2-user
echo '=== Installing unzip if needed ==='
sudo yum install -y unzip

echo '=== Backing up current Backend ==='
if [ -d Backend ]; then
    mv Backend Backend-backup-$TIMESTAMP
fi

echo '=== Extracting new Backend ==='
unzip -q $ARCHIVE_NAME -d Backend/

echo '=== Installing dependencies ==='
cd Backend
npm install --production

echo '=== Restarting PM2 ==='
pm2 restart all
sleep 3

echo '=== Status ==='
pm2 status
pm2 logs --lines 20 --nostream
"@

ssh -i $KEY_PATH "ec2-user@$EC2_IP" $deployScript

Write-Host "`n[4/4] Cleaning up..." -ForegroundColor Yellow
Remove-Item $ARCHIVE_NAME

Write-Host "`n==================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
