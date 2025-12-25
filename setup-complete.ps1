# Complete Android Development Setup Script
# Run this as Administrator for best results

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Android Development Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
$projectPath = "D:\tech sprint\CampusIQ"
Set-Location $projectPath
Write-Host "Working directory: $projectPath" -ForegroundColor Green
Write-Host ""

# Step 1: Install npm dependencies
Write-Host "Step 1: Installing npm dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ npm dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ npm install failed" -ForegroundColor Red
}
Write-Host ""

# Step 2: Clean Chocolatey lock files
Write-Host "Step 2: Cleaning Chocolatey lock files..." -ForegroundColor Cyan
$lockFiles = @(
    "C:\ProgramData\chocolatey\lib\5df8b409508262b287880fbc43446e7383fee172",
    "C:\ProgramData\chocolatey\lib\b2c1dfac4e6762d2822ffe4f9ceb2639f5b0d65e"
)
foreach ($lockFile in $lockFiles) {
    if (Test-Path $lockFile) {
        try {
            Remove-Item $lockFile -Force -Recurse -ErrorAction Stop
            Write-Host "✓ Removed: $lockFile" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not remove: $lockFile (may need Admin)" -ForegroundColor Yellow
        }
    }
}
Write-Host ""

# Step 3: Check for JDK
Write-Host "Step 3: Checking for JDK 21..." -ForegroundColor Cyan
$jdkPaths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-21*",
    "C:\Program Files\Microsoft\jdk-21*",
    "C:\Program Files\Java\jdk-21*"
)
$jdkPath = $null
foreach ($path in $jdkPaths) {
    $found = Get-ChildItem $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $jdkPath = $found.FullName
        break
    }
}

if ($jdkPath) {
    Write-Host "✓ JDK found at: $jdkPath" -ForegroundColor Green
    
    # Set JAVA_HOME
    Write-Host "  Setting JAVA_HOME..." -ForegroundColor Yellow
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, "User")
    $env:JAVA_HOME = $jdkPath
    
    # Add to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $javaBinPath = "$jdkPath\bin"
    if ($currentPath -notlike "*$javaBinPath*") {
        $newPath = if ($currentPath) { "$currentPath;$javaBinPath" } else { $javaBinPath }
        [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        $env:Path += ";$javaBinPath"
        Write-Host "  ✓ Added Java to PATH" -ForegroundColor Green
    }
} else {
    Write-Host "✗ JDK 21 not found" -ForegroundColor Red
    Write-Host "  Install with: choco install temurin21 -y (as Administrator)" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Check for Android SDK
Write-Host "Step 4: Checking for Android SDK..." -ForegroundColor Cyan
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $androidSdkPath) {
    Write-Host "✓ Android SDK found at: $androidSdkPath" -ForegroundColor Green
    
    # Set ANDROID_HOME
    Write-Host "  Setting ANDROID_HOME..." -ForegroundColor Yellow
    [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, "User")
    $env:ANDROID_HOME = $androidSdkPath
    
    # Add to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $androidPaths = @(
        "$androidSdkPath\platform-tools",
        "$androidSdkPath\tools",
        "$androidSdkPath\tools\bin",
        "$androidSdkPath\emulator"
    )
    
    $pathsAdded = @()
    foreach ($androidPath in $androidPaths) {
        if (Test-Path $androidPath) {
            if ($currentPath -notlike "*$androidPath*") {
                $pathsAdded += $androidPath
                $currentPath = if ($currentPath) { "$currentPath;$androidPath" } else { $androidPath }
                $env:Path += ";$androidPath"
            }
        }
    }
    
    if ($pathsAdded.Count -gt 0) {
        [System.Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
        Write-Host "  ✓ Added Android tools to PATH" -ForegroundColor Green
        foreach ($path in $pathsAdded) {
            Write-Host "    - $path" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "✗ Android SDK not found" -ForegroundColor Red
    Write-Host "  Install Android Studio, then SDK will be at: $androidSdkPath" -ForegroundColor Yellow
    Write-Host "  Install with: choco install androidstudio -y (as Administrator)" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Verify current setup
Write-Host "Step 5: Verifying setup..." -ForegroundColor Cyan
Write-Host ""

$checks = @{
    "Java" = { try { java -version 2>&1 | Out-Null; $true } catch { $false } }
    "ADB" = { try { adb version 2>&1 | Out-Null; $true } catch { $false } }
}

foreach ($check in $checks.GetEnumerator()) {
    if (& $check.Value) {
        Write-Host "✓ $($check.Key) is available" -ForegroundColor Green
    } else {
        Write-Host "✗ $($check.Key) is not available" -ForegroundColor Red
    }
}
Write-Host ""

# Step 6: Run React Native Doctor
Write-Host "Step 6: Running React Native Doctor..." -ForegroundColor Cyan
Write-Host ""
npx react-native doctor
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Close and reopen PowerShell for environment variables to take effect!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Close this PowerShell window" -ForegroundColor White
Write-Host "2. Open a NEW PowerShell window" -ForegroundColor White
Write-Host "3. Run: cd 'D:\tech sprint\CampusIQ'" -ForegroundColor White
Write-Host "4. Run: npx react-native doctor" -ForegroundColor White
Write-Host "5. If Java/Android are missing, install them:" -ForegroundColor White
Write-Host "   - choco install temurin21 -y (as Admin)" -ForegroundColor Gray
Write-Host "   - choco install androidstudio -y (as Admin)" -ForegroundColor Gray
Write-Host "6. After installing, run this script again" -ForegroundColor White
Write-Host ""

