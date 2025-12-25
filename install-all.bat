@echo off
REM Android Development Environment Installer
REM Run this batch file as Administrator

echo ========================================
echo Android Development Environment Setup
echo ========================================
echo.

echo Step 1: Cleaning Chocolatey lock files...
if exist "C:\ProgramData\chocolatey\lib\5df8b409508262b287880fbc43446e7383fee172" (
    rmdir /s /q "C:\ProgramData\chocolatey\lib\5df8b409508262b287880fbc43446e7383fee172" 2>nul
    echo Lock file 1 removed
)
if exist "C:\ProgramData\chocolatey\lib\b2c1dfac4e6762d2822ffe4f9ceb2639f5b0d65e" (
    rmdir /s /q "C:\ProgramData\chocolatey\lib\b2c1dfac4e6762d2822ffe4f9ceb2639f5b0d65e" 2>nul
    echo Lock file 2 removed
)

echo.
echo Step 2: Installing JDK 21 (Temurin)...
choco install temurin21 -y

echo.
echo Step 3: Installing Android Studio...
choco install androidstudio -y

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Close this window
echo 2. Open PowerShell as Administrator
echo 3. Run: cd "D:\tech sprint\CampusIQ"
echo 4. Run: .\configure-env.ps1
echo 5. Close and reopen PowerShell
echo 6. Run: npx react-native doctor
echo.
pause

