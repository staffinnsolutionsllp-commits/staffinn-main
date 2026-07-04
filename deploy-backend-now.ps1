# ===================================================================
#  STAFFINN BACKEND DEPLOYMENT - EC2 (PowerShell)
# ===================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$SshKeyPath
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   STAFFINN BACKEND DEPLOYMENT (EC2)" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$EC2_IP = "3.109.94.100"
$EC2_USER = "ubuntu"
$BACKEND_DIR = "/home/ubuntu/staffinn-backend"

Write-Host "[INFO] EC2 Instance: $EC2_IP" -ForegroundColor White
Write-Host "[INFO] Backend Directory: $BACKEND_DIR" -ForegroundColor White
Write-Host ""

# Check SSH key
if (-not $SshKeyPath) {
    Write-Host "[ERROR] SSH key path not provided!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage: .\deploy-backend-now.ps1 -SshKeyPath 'PATH_TO_KEY'" -ForegroundColor Yellow
    Write-Host "Example: .\deploy-backend-now.ps1 -SshKeyPath 'C:\Users\YourName\Downloads\staffinn-key.pem'" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

if (-not (Test-Path $SshKeyPath)) {
    Write-Host "[ERROR] SSH key not found: $SshKeyPath" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "[OK] SSH key found: $SshKeyPath" -ForegroundColor Green
Write-Host ""

# Test SSH connection
Write-Host "[STEP 1/5] Testing SSH connection..." -ForegroundColor Yellow
Write-Host ""

try {
    $testResult = ssh -i "$SshKeyPath" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$EC2_USER@$EC2_IP" "echo Connected successfully" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "SSH connection failed"
    }
    
    Write-Host ""
    Write-Host "[OK] SSH connection successful!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "[ERROR] SSH connection failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "  1. SSH key permissions wrong (should be read-only)" -ForegroundColor White
    Write-Host "  2. EC2 security group not allowing SSH from your IP" -ForegroundColor White
    Write-Host "  3. Wrong SSH key or EC2 IP" -ForegroundColor White
    Write-Host ""
    Write-Host "Fix permissions on Windows:" -ForegroundColor Yellow
    Write-Host "  Right-click key file > Properties > Security > Advanced" -ForegroundColor White
    Write-Host "  Remove all users except yourself with Read permission only" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Create backup
Write-Host "[STEP 2/5] Creating backup..." -ForegroundColor Yellow
try {
    ssh -i "$SshKeyPath" "$EC2_USER@$EC2_IP" "mkdir -p ~/backups && cp -r $BACKEND_DIR ~/backups/backend-`$(date +%Y%m%d-%H%M%S) && echo Backup created"
    Write-Host "[OK] Backup created successfully!" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Backup creation failed, continuing anyway..." -ForegroundColor Yellow
}
Write-Host ""

# Pull latest code
Write-Host "[STEP 3/5] Pulling latest code from git..." -ForegroundColor Yellow
Write-Host ""
ssh -i "$SshKeyPath" "$EC2_USER@$EC2_IP" "cd $BACKEND_DIR && git pull origin main"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Git pull failed!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "[OK] Code updated successfully!" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "[STEP 4/5] Installing dependencies..." -ForegroundColor Yellow
Write-Host ""
ssh -i "$SshKeyPath" "$EC2_USER@$EC2_IP" "cd $BACKEND_DIR && npm install --production"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] npm install failed!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "[OK] Dependencies installed!" -ForegroundColor Green
Write-Host ""

# Restart PM2
Write-Host "[STEP 5/5] Restarting backend service..." -ForegroundColor Yellow
Write-Host ""
ssh -i "$SshKeyPath" "$EC2_USER@$EC2_IP" "pm2 restart staffinn-backend && pm2 save"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] PM2 restart failed!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "[OK] Backend restarted successfully!" -ForegroundColor Green
Write-Host ""

# Show recent logs
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Showing recent logs..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
ssh -i "$SshKeyPath" "$EC2_USER@$EC2_IP" "pm2 logs staffinn-backend --lines 30 --nostream"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[SUCCESS] Backend deployed successfully to EC2!" -ForegroundColor Green
Write-Host ""
Write-Host "Verification:" -ForegroundColor Yellow
Write-Host "  1. Health check: curl https://api.staffinn.com/health" -ForegroundColor White
Write-Host "  2. View logs:    ssh -i `"$SshKeyPath`" $EC2_USER@$EC2_IP `"pm2 logs staffinn-backend`"" -ForegroundColor White
Write-Host "  3. Monitor:      ssh -i `"$SshKeyPath`" $EC2_USER@$EC2_IP `"pm2 monit`"" -ForegroundColor White
Write-Host ""
Write-Host "Test forgot password API:" -ForegroundColor Yellow
Write-Host '  curl -X POST https://api.staffinn.com/api/v1/employee/auth/forgot-password/send-otp \' -ForegroundColor White
Write-Host '    -H "Content-Type: application/json" \' -ForegroundColor White
Write-Host '    -d ''{"email":"test@example.com"}''' -ForegroundColor White
Write-Host ""
