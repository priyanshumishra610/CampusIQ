# 🚀 START HERE - Complete Setup Guide

## Quick Setup (Run This First)

Open PowerShell and run:

```powershell
cd "D:\tech sprint\CampusIQ"
.\setup-complete.ps1
```

This script will:
- ✅ Install npm dependencies
- ✅ Clean Chocolatey lock files
- ✅ Detect and configure JDK 21
- ✅ Detect and configure Android SDK
- ✅ Set up environment variables (JAVA_HOME, ANDROID_HOME)
- ✅ Add Java and Android tools to PATH
- ✅ Run React Native doctor

## If You Get Execution Policy Error

Run this first:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run the setup script again.

## What's Missing?

The script will tell you what's missing. If you see:

### ❌ JDK 21 not found
**Fix:** Open PowerShell **as Administrator** and run:
```powershell
choco install temurin21 -y
```

### ❌ Android SDK not found
**Fix:** Open PowerShell **as Administrator** and run:
```powershell
choco install androidstudio -y
```

Then open Android Studio and:
1. Go to **Tools** → **SDK Manager**
2. Install: Android SDK Platform-Tools, Android Emulator
3. Go to **Tools** → **Device Manager** → Create a Virtual Device

## After Running Setup Script

1. **Close PowerShell completely**
2. **Open a NEW PowerShell window**
3. Navigate to project:
   ```powershell
   cd "D:\tech sprint\CampusIQ"
   ```
4. Verify everything:
   ```powershell
   java -version
   adb version
   npx react-native doctor
   ```

## Run Your App

Once everything is set up:

```powershell
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Run Android app
npm run android
```

## All Available Scripts

- **`setup-complete.ps1`** - Complete automated setup (RUN THIS FIRST)
- **`configure-env.ps1`** - Just configure environment variables
- **`fix-choco-lock.ps1`** - Fix Chocolatey lock file issues
- **`install-all.bat`** - Batch file for installation (run as Admin)
- **`install-jdk-direct.ps1`** - Alternative JDK installation method

## Need Help?

Check these files:
- `INSTALL_INSTRUCTIONS.md` - Detailed step-by-step guide
- `ANDROID_SETUP.md` - Comprehensive Android setup guide
- `QUICK_INSTALL.md` - Quick reference

