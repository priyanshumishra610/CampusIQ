# Quick Fix: Add Android SDK to PATH
# Run this script to fix the "adb not found" error

Write-Host "Fixing Android SDK PATH..." -ForegroundColor Cyan
Write-Host ""

# Android SDK path
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"

if (Test-Path $androidSdkPath) {
    Write-Host "Found Android SDK at: $androidSdkPath" -ForegroundColor Green
    
    # Set ANDROID_HOME
    [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, "User")
    $env:ANDROID_HOME = $androidSdkPath
    Write-Host "Set ANDROID_HOME" -ForegroundColor Green
    
    # Add to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $pathsToAdd = @(
        "$androidSdkPath\platform-tools",
        "$androidSdkPath\tools",
        "$androidSdkPath\tools\bin"
    )
    
    $added = $false
    foreach ($path in $pathsToAdd) {
        if (Test-Path $path) {
            if ($currentPath -notlike "*$path*") {
                $currentPath = if ($currentPath) { "$currentPath;$path" } else { $path }
                $added = $true
                Write-Host "Added to PATH: $path" -ForegroundColor Green
            }
        }
    }
    
    if ($added) {
        [System.Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
        Write-Host ""
        Write-Host "PATH updated!" -ForegroundColor Green
    } else {
        Write-Host "Paths already in PATH" -ForegroundColor Yellow
    }
    
    # Check if platform-tools exists
    $adbPath = "$androidSdkPath\platform-tools\adb.exe"
    if (Test-Path $adbPath) {
        Write-Host "ADB found at: $adbPath" -ForegroundColor Green
    } else {
        Write-Host "WARNING: ADB not found. Install Android SDK Platform-Tools in Android Studio:" -ForegroundColor Yellow
        Write-Host "  Tools > SDK Manager > SDK Tools > Android SDK Platform-Tools" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "Android SDK not found at: $androidSdkPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix:" -ForegroundColor Yellow
    Write-Host "1. Open Android Studio" -ForegroundColor White
    Write-Host "2. Go to Tools > SDK Manager" -ForegroundColor White
    Write-Host "3. Install Android SDK Platform-Tools" -ForegroundColor White
    Write-Host "4. SDK will be installed at: $androidSdkPath" -ForegroundColor White
}

Write-Host ""
Write-Host "IMPORTANT: Close and reopen PowerShell for changes to take effect!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Then test with: adb version" -ForegroundColor Cyan

