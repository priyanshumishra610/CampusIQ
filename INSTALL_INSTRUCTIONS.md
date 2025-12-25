# Installation Instructions - Android Development Setup

## Current Status
Based on the errors, you need:
1. ✅ Java JDK 21 - **NOT INSTALLED**
2. ✅ Android SDK/Platform Tools - **NOT IN PATH** (Android Studio may be installed but SDK not configured)

## Quick Fix Steps

### Step 1: Install JDK 21

**Option A: Using Chocolatey (as Administrator)**
```powershell
# Open PowerShell as Administrator, then:
choco install temurin21 -y
```

**Option B: Manual Download**
1. Go to: https://adoptium.net/temurin/releases/?version=21
2. Download: Windows x64, JDK, .msi installer
3. Run installer (note installation path)

### Step 2: Install Android Studio (if not already installed)

**Option A: Using Chocolatey (as Administrator)**
```powershell
choco install androidstudio -y
```

**Option B: Manual Download**
1. Go to: https://developer.android.com/studio
2. Download and install
3. During setup, ensure Android SDK is installed

### Step 3: Configure Environment Variables

Run this PowerShell script (can run as regular user for user-level config):

```powershell
cd "D:\tech sprint\CampusIQ"
.\configure-env.ps1 -UserLevel
```

Or manually set (as Administrator for system-wide):

```powershell
# Find your JDK path (adjust if different)
$jdkPath = "C:\Program Files\Eclipse Adoptium\jdk-21.0.1-hotspot"  # Update this!

# Set JAVA_HOME
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, "User")

# Set ANDROID_HOME
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, "User")

# Add to PATH
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
        }
    }
}

[System.Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
```

### Step 4: Verify Installation

**Close and reopen PowerShell**, then:

```powershell
cd "D:\tech sprint\CampusIQ"

# Check Java
java -version

# Check Android SDK
adb version

# Run React Native doctor
npx react-native doctor
```

### Step 5: Setup Android Studio (if needed)

1. Open Android Studio
2. Go to **Tools** → **SDK Manager**
3. Install:
   - ✅ Android SDK Platform-Tools
   - ✅ Android Emulator
   - ✅ Android SDK Build-Tools
4. Go to **Tools** → **Device Manager**
5. Click **Create Device**
6. Select a device (e.g., Pixel 5)
7. Download a system image (e.g., Android 13 - API 33)
8. Click **Finish**

### Step 6: Run Your App

```powershell
cd "D:\tech sprint\CampusIQ"

# Start Metro bundler (in one terminal)
npm start

# Run Android app (in another terminal)
npm run android
```

## Troubleshooting

### If `adb` is not found:
- Make sure Android SDK Platform-Tools is installed in Android Studio
- Verify ANDROID_HOME is set: `echo $env:ANDROID_HOME`
- Check platform-tools exists: `Test-Path "$env:ANDROID_HOME\platform-tools\adb.exe"`

### If `java` is not found:
- Verify JAVA_HOME is set: `echo $env:JAVA_HOME`
- Check Java is in PATH: `echo $env:Path`
- Restart PowerShell after setting environment variables

### If emulator is not found:
- Install Android Emulator from SDK Manager in Android Studio
- Create an AVD from Device Manager

## Files Created

- `install-android-dev.ps1` - Full automated installer (requires Admin)
- `configure-env.ps1` - Environment configuration script
- `QUICK_INSTALL.md` - Quick reference guide
- `ANDROID_SETUP.md` - Detailed setup guide

