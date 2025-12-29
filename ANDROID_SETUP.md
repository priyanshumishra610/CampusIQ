# Android Development Environment Setup Guide

## Required Components

To run React Native Android apps, you need:
1. **Java Development Kit (JDK)** - Version 17 or 21 (recommended for React Native 0.75+)
2. **Android Studio** - Includes Android SDK, Android Emulator, and ADB
3. **Environment Variables** - JAVA_HOME and ANDROID_HOME

## Step 1: Install Java Development Kit (JDK)

### Option A: Install via Chocolatey (Recommended)
```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install JDK 21 (LTS)
choco install openjdk21 -y
```

### Option B: Manual Installation
1. Download **JDK 21** from: https://adoptium.net/temurin/releases/
2. Choose **Windows x64** installer (.msi)
3. Run the installer and follow the prompts
4. **Important**: Note the installation path (usually `C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot`)

## Step 2: Install Android Studio

1. Download Android Studio from: https://developer.android.com/studio
2. Run the installer
3. During installation, make sure to install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)
   - Performance (Intel HAXM) - if using Intel processor

## Step 3: Configure Environment Variables

After installing both, you need to set environment variables. Run these commands in PowerShell **as Administrator**:

```powershell
# Find your JDK installation path (adjust if different)
$javaPath = "C:\Program Files\Eclipse Adoptium\jdk-21.0.1-hotspot"  # Update this path
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"  # Usually this path

# Set JAVA_HOME (User-level)
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaPath, "User")

# Set ANDROID_HOME (User-level)
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, "User")

# Add to PATH (User-level)
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
$pathsToAdd = @(
    "$javaPath\bin",
    "$androidSdkPath\platform-tools",
    "$androidSdkPath\tools",
    "$androidSdkPath\tools\bin"
)

foreach ($path in $pathsToAdd) {
    if ($currentPath -notlike "*$path*") {
        $currentPath += ";$path"
    }
}

[System.Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
```

**Important**: After setting environment variables, you need to:
1. Close and reopen PowerShell/terminal
2. Or restart your computer

## Step 4: Verify Installation

Open a **new** PowerShell window and run:

```powershell
# Verify Java
java -version
javac -version

# Verify Android SDK
adb version

# Verify environment variables
echo $env:JAVA_HOME
echo $env:ANDROID_HOME

# Run React Native doctor
cd "D:\tech sprint\CampusIQ"
npx react-native doctor
```

## Step 5: Create Android Virtual Device (AVD)

1. Open Android Studio
2. Go to **Tools** → **Device Manager**
3. Click **Create Device**
4. Select a device (e.g., Pixel 5)
5. Download a system image (e.g., Android 13 - API 33)
6. Click **Finish**

## Step 6: Run Your App

Once everything is set up:

```powershell
cd "D:\tech sprint\CampusIQ"

# Start Metro bundler
npm start

# In another terminal, run Android app
npm run android
```

## Troubleshooting

### If JAVA_HOME is still not recognized:
- Make sure you restarted PowerShell/terminal after setting variables
- Verify the JDK path is correct: `Test-Path $env:JAVA_HOME`
- Check PATH includes: `$env:JAVA_HOME\bin`

### If adb is not found:
- Verify ANDROID_HOME is set: `echo $env:ANDROID_HOME`
- Check platform-tools exists: `Test-Path "$env:ANDROID_HOME\platform-tools\adb.exe"`
- Add to PATH manually if needed

### If emulator is not found:
- Open Android Studio → SDK Manager
- Install "Android Emulator" from SDK Tools tab
- Create an AVD from Device Manager

## Quick Setup Script

Save this as `setup-android-env.ps1` and run as Administrator:

```powershell
# Auto-detect and configure Android environment
# Run as Administrator

Write-Host "Setting up Android development environment..." -ForegroundColor Green

# Detect JDK
$jdkPaths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-21*",
    "C:\Program Files\Java\jdk-*",
    "C:\Program Files\Microsoft\jdk-*"
)

$jdkPath = $null
foreach ($path in $jdkPaths) {
    $found = Get-ChildItem $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $jdkPath = $found.FullName
        break
    }
}

if (-not $jdkPath) {
    Write-Host "JDK not found! Please install JDK 21 first." -ForegroundColor Red
    exit 1
}

# Detect Android SDK
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $androidSdkPath)) {
    Write-Host "Android SDK not found at $androidSdkPath" -ForegroundColor Yellow
    Write-Host "Please install Android Studio first." -ForegroundColor Yellow
    exit 1
}

# Set environment variables
Write-Host "Setting JAVA_HOME to: $jdkPath" -ForegroundColor Cyan
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, "User")

Write-Host "Setting ANDROID_HOME to: $androidSdkPath" -ForegroundColor Cyan
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, "User")

# Update PATH
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
$pathsToAdd = @(
    "$jdkPath\bin",
    "$androidSdkPath\platform-tools",
    "$androidSdkPath\tools",
    "$androidSdkPath\tools\bin"
)

foreach ($path in $pathsToAdd) {
    if (Test-Path $path) {
        if ($currentPath -notlike "*$path*") {
            $currentPath += ";$path"
            Write-Host "Adding to PATH: $path" -ForegroundColor Cyan
        }
    }
}

[System.Environment]::SetEnvironmentVariable("Path", $currentPath, "User")

Write-Host "`nEnvironment variables set successfully!" -ForegroundColor Green
Write-Host "Please close and reopen PowerShell/terminal for changes to take effect." -ForegroundColor Yellow
```

