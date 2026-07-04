@echo off
REM ===================================================================
REM  STAFFINN BACKEND DEPLOYMENT - EC2
REM  Run this script to deploy backend to production
REM ===================================================================

echo.
echo ============================================================
echo   STAFFINN BACKEND DEPLOYMENT (EC2)
echo ============================================================
echo.

REM Configuration
set EC2_IP=3.109.94.100
set EC2_USER=ubuntu
set BACKEND_DIR=/home/ubuntu/staffinn-backend

REM Colors
echo [INFO] EC2 Instance: %EC2_IP%
echo [INFO] Backend Directory: %BACKEND_DIR%
echo.

REM Check if SSH key path is provided
if "%1"=="" (
    echo [ERROR] SSH key path not provided!
    echo.
    echo Usage: %0 PATH_TO_SSH_KEY
    echo Example: %0 "C:\Users\YourName\Downloads\staffinn-key.pem"
    echo.
    echo Or run with key path:
    echo %0 "path\to\staffinn-key.pem"
    echo.
    pause
    exit /b 1
)

set SSH_KEY=%1

REM Check if key file exists
if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found: %SSH_KEY%
    echo.
    pause
    exit /b 1
)

echo [OK] SSH key found: %SSH_KEY%
echo.

REM Test SSH connection first
echo [STEP 1/5] Testing SSH connection...
echo.
ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no -o ConnectTimeout=10 %EC2_USER%@%EC2_IP% "echo Connected successfully"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] SSH connection failed!
    echo.
    echo Possible issues:
    echo  1. SSH key permissions wrong (should be read-only)
    echo  2. EC2 security group not allowing SSH from your IP
    echo  3. Wrong SSH key or EC2 IP
    echo.
    echo Fix permissions on Windows (if needed):
    echo  Right-click key file ^> Properties ^> Security ^> Advanced
    echo  Remove all users except yourself with Read permission only
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] SSH connection successful!
echo.

REM Create backup
echo [STEP 2/5] Creating backup...
ssh -i "%SSH_KEY%" %EC2_USER%@%EC2_IP% "mkdir -p ~/backups && cp -r %BACKEND_DIR% ~/backups/backend-$(date +%%Y%%m%%d-%%H%%M%%S) && echo Backup created"

if %errorlevel% neq 0 (
    echo [WARNING] Backup creation failed, continuing anyway...
) else (
    echo [OK] Backup created successfully!
)
echo.

REM Pull latest code
echo [STEP 3/5] Pulling latest code from git...
echo.
ssh -i "%SSH_KEY%" %EC2_USER%@%EC2_IP% "cd %BACKEND_DIR% && git pull origin main"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Git pull failed!
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Code updated successfully!
echo.

REM Install dependencies
echo [STEP 4/5] Installing dependencies...
echo.
ssh -i "%SSH_KEY%" %EC2_USER%@%EC2_IP% "cd %BACKEND_DIR% && npm install --production"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm install failed!
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed!
echo.

REM Restart PM2
echo [STEP 5/5] Restarting backend service...
echo.
ssh -i "%SSH_KEY%" %EC2_USER%@%EC2_IP% "pm2 restart staffinn-backend && pm2 save"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] PM2 restart failed!
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Backend restarted successfully!
echo.

REM Show recent logs
echo ============================================================
echo   Showing recent logs...
echo ============================================================
echo.
ssh -i "%SSH_KEY%" %EC2_USER%@%EC2_IP% "pm2 logs staffinn-backend --lines 30 --nostream"

echo.
echo ============================================================
echo   DEPLOYMENT COMPLETE!
echo ============================================================
echo.
echo [SUCCESS] Backend deployed successfully to EC2!
echo.
echo Verification:
echo  1. Health check: curl https://api.staffinn.com/health
echo  2. View logs:    ssh -i "%SSH_KEY%" %EC2_USER%@%EC2_IP% "pm2 logs staffinn-backend"
echo  3. Monitor:      ssh -i "%SSH_KEY%" %EC2_USER%@%EC2_IP% "pm2 monit"
echo.
echo Test forgot password:
echo  curl -X POST https://api.staffinn.com/api/v1/employee/auth/forgot-password/send-otp \
echo    -H "Content-Type: application/json" \
echo    -d "{\"email\":\"test@example.com\"}"
echo.

pause
