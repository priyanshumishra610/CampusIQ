# Quick Installation Guide

## ⚠️ IMPORTANT: Run PowerShell as Administrator

Right-click PowerShell → **Run as Administrator**

## Method 1: Using Chocolatey (Recommended)

Open PowerShell **as Administrator** and run:

```powershell
cd "D:\tech sprint\CampusIQ"

# Clean lock files first
Remove-Item "C:\ProgramData\chocolatey\lib\5df8b409508262b287880fbc43446e7383fee172" -Force -Recurse -ErrorAction SilentlyContinue
Remove-Item "C:\ProgramData\chocolatey\lib\b2c1dfac4e6762d2822ffe4f9ceb2639f5b0d65e" -Force -Recurse -ErrorAction SilentlyContinue

# Install JDK 21
choco install temurin21 -y

# Install Android Studio
choco install androidstudio -y
```

## Method 2: Using Winget (Alternative)

```powershell
# Install JDK 21
winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements

# Install Android Studio
winget install Google.AndroidStudio --accept-package-agreements --accept-source-agreements
```

## Method 3: Manual Installation

### JDK 21:
1. Download from: https://adoptium.net/temurin/releases/?version=21
2. Choose: Windows x64, JDK, .msi installer
3. Run installer (note the installation path)

### Android Studio:
1. Download from: https://developer.android.com/studio
2. Run installer
3. During setup, ensure Android SDK is installed

## After Installation: Configure Environment Variables

Run this PowerShell script **as Administrator**:

```powershell
# Find JDK path (adjust if different)
$jdkPath = (Get-ChildItem "C:\Program Files\Eclipse Adoptium\jdk-21*" | Select-Object -First 1).FullName
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"

# Set JAVA_HOME
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, "Machine")

# Set ANDROID_HOME
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, "Machine")

# Add to PATH
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
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

[System.Environment]::SetEnvironmentVariable("Path", $currentPath, "Machine")

Write-Host "Environment variables configured!" -ForegroundColor Green
Write-Host "Please close and reopen PowerShell for changes to take effect." -ForegroundColor Yellow
```

## Verify Installation

Close and reopen PowerShell, then:

```powershell
cd "D:\tech sprint\CampusIQ"

# Check Java
java -version

# Check Android SDK
adb version

# Run React Native doctor
npx react-native doctor
```

## Next Steps

1. Open Android Studio
2. Go to **Tools** → **SDK Manager**
3. Install:
   - Android SDK Platform-Tools
   - Android Emulator
   - Android SDK Build-Tools
4. Go to **Tools** → **Device Manager**
5. Create a new Virtual Device (AVD)
6. Run your app: `npm run android`

