@echo off
REM ===================================================================
REM  STAFFINN PRODUCTION DEPLOYMENT SCRIPT
REM  Date: %date% %time%
REM ===================================================================

echo.
echo ============================================================
echo   STAFFINN PRODUCTION DEPLOYMENT
echo ============================================================
echo.

REM Check AWS CLI
aws --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] AWS CLI not installed!
    echo Install from: https://aws.amazon.com/cli/
    pause
    exit /b 1
)

echo [OK] AWS CLI installed
echo.

REM ===================================================================
REM STEP 1: DEPLOY FRONTEND (staffinn.com)
REM ===================================================================
echo.
echo ============================================================
echo   [1/5] DEPLOYING FRONTEND (staffinn.com)
echo ============================================================
echo.

cd Frontend
if not exist "dist\" (
    echo [ERROR] Frontend dist folder not found! Run 'npm run build' first.
    cd ..
    pause
    exit /b 1
)

echo Uploading to S3: staffinn.com...
aws s3 sync dist/ s3://staffinn.com --delete --profile default

if %errorlevel% neq 0 (
    echo [ERROR] Frontend S3 upload failed!
    cd ..
    pause
    exit /b 1
)

echo Invalidating CloudFront cache...
REM Note: Replace E2XXXXXXXXXXXX with actual CloudFront distribution ID
REM aws cloudfront create-invalidation --distribution-id E2XXXXXXXXXXXX --paths "/*" --profile default

echo [OK] Frontend deployed successfully!
cd ..

REM ===================================================================
REM STEP 2: DEPLOY EMPLOYEE PORTAL (hrms.staffinn.com)
REM ===================================================================
echo.
echo ============================================================
echo   [2/5] DEPLOYING EMPLOYEE PORTAL (hrms.staffinn.com)
echo ============================================================
echo.

cd EmployeePortal
if not exist "dist\" (
    echo [ERROR] EmployeePortal dist folder not found! Run 'npm run build' first.
    cd ..
    pause
    exit /b 1
)

echo Uploading to S3: hrms.staffinn.com...
aws s3 sync dist/ s3://hrms.staffinn.com --delete --profile default

if %errorlevel% neq 0 (
    echo [ERROR] Employee Portal S3 upload failed!
    cd ..
    pause
    exit /b 1
)

echo Invalidating CloudFront cache...
REM aws cloudfront create-invalidation --distribution-id E3XXXXXXXXXXXX --paths "/*" --profile default

echo [OK] Employee Portal deployed successfully!
cd ..

REM ===================================================================
REM STEP 3: DEPLOY MASTER ADMIN (admin.staffinn.com)
REM ===================================================================
echo.
echo ============================================================
echo   [3/5] DEPLOYING MASTER ADMIN (admin.staffinn.com)
echo ============================================================
echo.

cd MasterAdminPanel
if not exist "dist\" (
    echo [ERROR] MasterAdminPanel dist folder not found! Run 'npm run build' first.
    cd ..
    pause
    exit /b 1
)

echo Uploading to S3: admin.staffinn.com...
aws s3 sync dist/ s3://admin.staffinn.com --delete --profile default

if %errorlevel% neq 0 (
    echo [ERROR] Master Admin S3 upload failed!
    cd ..
    pause
    exit /b 1
)

echo Invalidating CloudFront cache...
REM aws cloudfront create-invalidation --distribution-id E4XXXXXXXXXXXX --paths "/*" --profile default

echo [OK] Master Admin deployed successfully!
cd ..

REM ===================================================================
REM STEP 4: DEPLOY NEWS ADMIN (news-admin.staffinn.com)
REM ===================================================================
echo.
echo ============================================================
echo   [4/5] DEPLOYING NEWS ADMIN (news-admin.staffinn.com)
echo ============================================================
echo.

cd NewsAdminPanel
if not exist "dist\" (
    echo [ERROR] NewsAdminPanel dist folder not found! Run 'npm run build' first.
    cd ..
    pause
    exit /b 1
)

echo Uploading to S3: news-admin.staffinn.com...
aws s3 sync dist/ s3://news-admin.staffinn.com --delete --profile default

if %errorlevel% neq 0 (
    echo [ERROR] News Admin S3 upload failed!
    cd ..
    pause
    exit /b 1
)

echo Invalidating CloudFront cache...
REM aws cloudfront create-invalidation --distribution-id E5XXXXXXXXXXXX --paths "/*" --profile default

echo [OK] News Admin deployed successfully!
cd ..

REM ===================================================================
REM STEP 5: DEPLOY BACKEND (EC2)
REM ===================================================================
echo.
echo ============================================================
echo   [5/5] BACKEND DEPLOYMENT INSTRUCTIONS
echo ============================================================
echo.
echo Backend deployment requires SSH access to EC2.
echo.
echo Please run these commands manually on EC2:
echo.
echo   ssh -i staffinn-key.pem ubuntu@YOUR_EC2_IP
echo   cd /home/ubuntu/staffinn-backend
echo   git pull origin main
echo   npm install --production
echo   pm2 restart staffinn-backend
echo   pm2 save
echo.
echo Or use this one-liner (replace YOUR_EC2_IP):
echo.
echo   ssh -i staffinn-key.pem ubuntu@YOUR_EC2_IP "cd /home/ubuntu/staffinn-backend && git pull origin main && npm install --production && pm2 restart staffinn-backend && pm2 save"
echo.

REM ===================================================================
REM DEPLOYMENT COMPLETE
REM ===================================================================
echo.
echo ============================================================
echo   DEPLOYMENT SUMMARY
echo ============================================================
echo.
echo [OK] Frontend          : staffinn.com
echo [OK] Employee Portal   : hrms.staffinn.com
echo [OK] Master Admin      : admin.staffinn.com
echo [OK] News Admin        : news-admin.staffinn.com
echo [!]  Backend (EC2)     : Manual deployment required
echo.
echo ============================================================
echo   POST-DEPLOYMENT TESTING
echo ============================================================
echo.
echo 1. Test Frontend:       https://staffinn.com
echo 2. Test HRMS Portal:    https://hrms.staffinn.com
echo    - Check "Forgot Password" feature!
echo 3. Test Master Admin:   https://admin.staffinn.com
echo 4. Test News Admin:     https://news-admin.staffinn.com
echo 5. Test Backend API:    https://api.staffinn.com/health
echo.
echo ============================================================
echo   DEPLOYMENT COMPLETE!
echo ============================================================
echo.

pause
