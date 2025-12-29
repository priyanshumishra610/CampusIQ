# Fix Build Issues - Complete Setup
# This script fixes all build-related issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Build Issues" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check and configure Java
Write-Host "Step 1: Checking Java/JDK..." -ForegroundColor Yellow
$jdkPaths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-21*",
    "C:\Program Files\Microsoft\jdk-21*",
    "C:\Program Files\Java\jdk-21*",
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Microsoft\jdk-17*"
)

$jdkPath = $null
foreach ($path in $jdkPaths) {
    $found = Get-ChildItem $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $jdkPath = $found.FullName
        Write-Host "  Found JDK at: $jdkPath" -ForegroundColor Green
        break
    }
}

if ($jdkPath) {
    # Set JAVA_HOME
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, "User")
    $env:JAVA_HOME = $jdkPath
    Write-Host "  Set JAVA_HOME" -ForegroundColor Green
    
    # Add to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $javaBinPath = "$jdkPath\bin"
    if ($currentPath -notlike "*$javaBinPath*") {
        $newPath = if ($currentPath) { "$currentPath;$javaBinPath" } else { $javaBinPath }
        [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        $env:Path += ";$javaBinPath"
        Write-Host "  Added Java to PATH" -ForegroundColor Green
    }
} else {
    Write-Host "  ERROR: JDK not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  To install JDK 21, run as Administrator:" -ForegroundColor Yellow
    Write-Host "    choco install temurin21 -y" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Or download from: https://adoptium.net/temurin/releases/?version=21" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""

# Step 2: Check and configure Android SDK
Write-Host "Step 2: Checking Android SDK..." -ForegroundColor Yellow
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"

if (Test-Path $androidSdkPath) {
    Write-Host "  Found Android SDK at: $androidSdkPath" -ForegroundColor Green
    
    # Set ANDROID_HOME
    [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, "User")
    $env:ANDROID_HOME = $androidSdkPath
    Write-Host "  Set ANDROID_HOME" -ForegroundColor Green
    
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
        Write-Host "  Added Android tools to PATH:" -ForegroundColor Green
        foreach ($path in $pathsAdded) {
            Write-Host "    - $path" -ForegroundColor Gray
        }
    }
    
    # Check for ADB
    $adbPath = "$androidSdkPath\platform-tools\adb.exe"
    if (Test-Path $adbPath) {
        Write-Host "  ADB found" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: ADB not found!" -ForegroundColor Yellow
        Write-Host "  Install Android SDK Platform-Tools in Android Studio:" -ForegroundColor Yellow
        Write-Host "    Tools > SDK Manager > SDK Tools > Android SDK Platform-Tools" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ERROR: Android SDK not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  To install Android Studio, run as Administrator:" -ForegroundColor Yellow
    Write-Host "    choco install androidstudio -y" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Or download from: https://developer.android.com/studio" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""

# Step 3: Check for emulators
Write-Host "Step 3: Checking for Android emulators..." -ForegroundColor Yellow
if ($env:ANDROID_HOME) {
    $emulatorPath = "$env:ANDROID_HOME\emulator\emulator.exe"
    if (Test-Path $emulatorPath) {
        Write-Host "  Emulator tool found" -ForegroundColor Green
        Write-Host "  To list emulators, run: emulator -list-avds" -ForegroundColor Cyan
        Write-Host "  To create an emulator:" -ForegroundColor Yellow
        Write-Host "    1. Open Android Studio" -ForegroundColor White
        Write-Host "    2. Go to Tools > Device Manager" -ForegroundColor White
        Write-Host "    3. Click Create Device" -ForegroundColor White
        Write-Host "    4. Select a device and system image" -ForegroundColor White
    } else {
        Write-Host "  WARNING: Emulator not found!" -ForegroundColor Yellow
        Write-Host "  Install Android Emulator in Android Studio:" -ForegroundColor Yellow
        Write-Host "    Tools > SDK Manager > SDK Tools > Android Emulator" -ForegroundColor Cyan
    }
} else {
    Write-Host "  Cannot check emulators (ANDROID_HOME not set)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($jdkPath) {
    Write-Host "✓ Java/JDK: Configured" -ForegroundColor Green
} else {
    Write-Host "✗ Java/JDK: NOT INSTALLED" -ForegroundColor Red
}

if (Test-Path $androidSdkPath) {
    Write-Host "✓ Android SDK: Found" -ForegroundColor Green
} else {
    Write-Host "✗ Android SDK: NOT FOUND" -ForegroundColor Red
}

Write-Host ""
Write-Host "IMPORTANT: Close and reopen PowerShell for changes to take effect!" -ForegroundColor Yellow
Write-Host ""
Write-Host "After restarting PowerShell, verify with:" -ForegroundColor Cyan
Write-Host "  java -version" -ForegroundColor White
Write-Host "  adb version" -ForegroundColor White
Write-Host "  npx react-native doctor" -ForegroundColor White
Write-Host ""

