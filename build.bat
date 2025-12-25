@echo off
<<<<<<< HEAD
REM Build script for CampusIQ Android app
REM Can be run from any directory

cd /d "%~dp0"
echo Building Android app...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Make sure you're running this from the CampusIQ directory.
    pause
    exit /b 1
)

REM Run the build
call npm run android

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Build failed! Check the errors above.
    pause
)
=======
REM Quick build script - runs from project root
cd /d "D:\tech sprint\CampusIQ"
call npm run android
pause
>>>>>>> 671b43a (Initial commit on Shinigami branch)

