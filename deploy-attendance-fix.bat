@echo off
echo ========================================
echo ATTENDANCE REAL-TIME FIX DEPLOYMENT
echo ========================================
echo.

echo Step 1: Rebuilding Bridge Service...
cd /d "D:\StaffInn-Attendance-Bridge\NewBridgeService"
dotnet build -c Release
if %errorlevel% neq 0 (
    echo ERROR: Bridge build failed!
    pause
    exit /b 1
)
echo ✅ Bridge Service rebuilt successfully
echo.

echo Step 2: Restarting Backend Server...
cd /d "D:\Staffinn-main\Backend"
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
start "Staffinn Backend" cmd /k "npm start"
echo ✅ Backend server restarted
echo.

echo Step 3: Rebuilding Bridge Installer...
cd /d "D:\StaffInn-Attendance-Bridge"
call build-production.bat
if %errorlevel% neq 0 (
    echo WARNING: Bridge installer build failed
    echo You may need to rebuild manually
)
echo.

echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Next Steps:
echo 1. Close existing Bridge application
echo 2. Install new Bridge software
echo 3. Test with biometric device
echo.
echo Expected Results:
echo - First punch → Check-In (within 20 seconds)
echo - Second punch → Check-Out (within 20 seconds)
echo - Third punch → Ignored
echo.
pause
