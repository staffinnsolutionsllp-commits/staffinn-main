@echo off
echo ========================================
echo HRMS Production Deployment Script
echo ========================================
echo.

cd "HRMS Staffinn\Staffinn HR Manager_files"

echo Step 1: Building HRMS...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Build successful!
echo.
echo Next steps:
echo 1. Go to AWS S3 Console: https://s3.console.aws.amazon.com
echo 2. Open your HRMS bucket
echo 3. Delete old files
echo 4. Upload files from: dist folder
echo 5. Go to CloudFront and create invalidation for /*
echo.
echo Or use AWS CLI:
echo aws s3 sync dist/ s3://YOUR-HRMS-BUCKET/ --delete
echo aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
echo.

pause
