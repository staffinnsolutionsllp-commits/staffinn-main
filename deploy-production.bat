@echo off
REM Production Deployment Script for Windows
REM Updates Backend code with recruiterId field consistency fixes

echo ========================================
echo    Production Deployment Starting
echo ========================================
echo.

set REMOTE_USER=ec2-user
set REMOTE_HOST=3.109.94.100
set PEM_FILE=D:\staffinn-key.pem
set REMOTE_PATH=/home/ec2-user/Staffinn-main/Backend

echo Configuration:
echo   Remote: %REMOTE_USER%@%REMOTE_HOST%
echo   Path: %REMOTE_PATH%
echo.

REM Step 1: Create backup
echo ========================================
echo Step 1: Creating backup on server...
echo ========================================
ssh -i "%PEM_FILE%" %REMOTE_USER%@%REMOTE_HOST% "cd /home/ec2-user/Staffinn-main/Backend && BACKUP_DIR=backups/backup_$(date +%%Y%%m%%d_%%H%%M%%S) && mkdir -p $BACKUP_DIR && cp -r controllers/hrms/hrmsCompanyController.js $BACKUP_DIR/ && cp -r routes/hrms/hrmsCompanyRoutes.js $BACKUP_DIR/ && cp -r scripts/migrate-add-recruiter-to-company.js $BACKUP_DIR/ 2>/dev/null || true && cp -r scripts/add-recruiterid-gsi-to-companies.js $BACKUP_DIR/ 2>/dev/null || true && echo Backup created at: $BACKUP_DIR"

if %errorlevel% neq 0 (
    echo [ERROR] Backup failed!
    pause
    exit /b 1
)
echo [SUCCESS] Backup created
echo.

REM Step 2: Upload files
echo ========================================
echo Step 2: Uploading updated files...
echo ========================================

echo Uploading hrmsCompanyController.js...
scp -i "%PEM_FILE%" "Backend\controllers\hrms\hrmsCompanyController.js" %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_PATH%/controllers/hrms/

echo Uploading hrmsCompanyRoutes.js...
scp -i "%PEM_FILE%" "Backend\routes\hrms\hrmsCompanyRoutes.js" %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_PATH%/routes/hrms/

echo Uploading migrate-add-recruiter-to-company.js...
scp -i "%PEM_FILE%" "Backend\scripts\migrate-add-recruiter-to-company.js" %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_PATH%/scripts/

echo Uploading manual-fix-recruiterid.js...
scp -i "%PEM_FILE%" "Backend\scripts\manual-fix-recruiterid.js" %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_PATH%/scripts/

echo Uploading add-recruiterid-gsi-to-companies.js...
scp -i "%PEM_FILE%" "Backend\scripts\add-recruiterid-gsi-to-companies.js" %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_PATH%/scripts/

echo Uploading verify-field-consistency.js...
scp -i "%PEM_FILE%" "Backend\scripts\verify-field-consistency.js" %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_PATH%/scripts/

if %errorlevel% neq 0 (
    echo [ERROR] File upload failed!
    pause
    exit /b 1
)
echo [SUCCESS] Files uploaded
echo.

REM Step 3: Restart Backend
echo ========================================
echo Step 3: Restarting Backend service...
echo ========================================
ssh -i "%PEM_FILE%" %REMOTE_USER%@%REMOTE_HOST% "cd /home/ec2-user/Staffinn-main/Backend && pm2 restart staffinn-backend || pm2 restart all"

if %errorlevel% neq 0 (
    echo [ERROR] Backend restart failed!
    pause
    exit /b 1
)
echo [SUCCESS] Backend restarted
echo.

REM Step 4: Verify
echo ========================================
echo Step 4: Running verification...
echo ========================================
ssh -i "%PEM_FILE%" %REMOTE_USER%@%REMOTE_HOST% "cd /home/ec2-user/Staffinn-main/Backend && node scripts/verify-field-consistency.js"

echo.
echo ========================================
echo    Deployment Completed Successfully!
echo ========================================
echo.
echo Next Steps:
echo   1. Check verification output above
echo   2. If inconsistencies found, run fix scripts
echo   3. Monitor logs: pm2 logs staffinn-backend
echo.
echo To connect to server:
echo   ssh -i "%PEM_FILE%" %REMOTE_USER%@%REMOTE_HOST%
echo.

pause
