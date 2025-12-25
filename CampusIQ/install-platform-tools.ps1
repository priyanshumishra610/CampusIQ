# Install Android SDK Platform-Tools
# This script helps install Platform-Tools if you have Android SDK command-line tools

Write-Host "Installing Android SDK Platform-Tools..." -ForegroundColor Cyan
Write-Host ""

$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
$sdkManagerPath = "$sdkPath\cmdline-tools\latest\bin\sdkmanager.bat"

if (Test-Path $sdkManagerPath) {
    Write-Host "Found SDK Manager at: $sdkManagerPath" -ForegroundColor Green
    Write-Host "Installing platform-tools..." -ForegroundColor Yellow
    
    & $sdkManagerPath "platform-tools"
    
    Write-Host ""
    Write-Host "Installation complete!" -ForegroundColor Green
    Write-Host "Run setup-everything.ps1 again to configure PATH" -ForegroundColor Yellow
} else {
    Write-Host "SDK Manager not found at: $sdkManagerPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Android SDK Platform-Tools manually:" -ForegroundColor Yellow
    Write-Host "1. Open Android Studio" -ForegroundColor White
    Write-Host "2. Go to Tools > SDK Manager" -ForegroundColor White
    Write-Host "3. Click on 'SDK Tools' tab" -ForegroundColor White
    Write-Host "4. Check 'Android SDK Platform-Tools'" -ForegroundColor White
    Write-Host "5. Click 'Apply' or 'OK'" -ForegroundColor White
    Write-Host ""
    Write-Host "After installation, run: .\setup-everything.ps1" -ForegroundColor Cyan
}

