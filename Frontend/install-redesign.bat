@echo off
echo Installing dependencies for News Page Redesign...
echo.

if not exist package.json (
    echo Error: package.json not found. Please run this script from the Frontend directory.
    exit /b 1
)

echo Installing framer-motion and sonner...
call npm install framer-motion sonner

if %errorlevel% equ 0 (
    echo.
    echo Dependencies installed successfully!
    echo.
    echo Next steps:
    echo    1. Review IMPLEMENTATION_GUIDE.md for complete redesign instructions
    echo    2. Review REDESIGN_INSTRUCTIONS.md for running the application
    echo    3. The design system is already applied in src/index.css
    echo    4. NewsContext is created in src/context/NewsContext.jsx
    echo.
    echo You can now start the development server:
    echo    npm run dev
) else (
    echo.
    echo Installation failed. Please install dependencies manually:
    echo    npm install framer-motion sonner
)

pause
