# Java Installation Guide - Quick Reference

## Current Status
- ❌ Java/JDK is NOT installed or not in PATH
- ✅ Scripts created to automate installation
- ✅ Configuration scripts ready

## Easiest Installation Methods (Choose One)

### Method 1: WinGet (Recommended - Fastest)
```powershell
winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements
```
Then run: `.\check-and-fix-java.ps1`

### Method 2: Use the Automated Script
```powershell
.\install-java-winget.ps1
```
This will install via WinGet and configure automatically.

### Method 3: Chocolatey (Requires Admin)
```powershell
# Remove lock file first
Remove-Item "C:\ProgramData\chocolatey\lib\5df8b409508262b287880fbc43446e7383fee172" -Force -Recurse -ErrorAction SilentlyContinue

# Install
choco install temurin21 -y
```
Then run: `.\check-and-fix-java.ps1`

### Method 4: Manual Download
1. Go to: https://adoptium.net/
2. Select: Version 21, Windows x64, JDK
3. Download and run the installer
4. Run: `.\check-and-fix-java.ps1`

## After Installation

1. **Run configuration script:**
   ```powershell
   .\check-and-fix-java.ps1
   ```

2. **Close and reopen PowerShell**

3. **Verify installation:**
   ```powershell
   java -version
   ```

4. **Configure everything:**
   ```powershell
   .\fix-build-issues.ps1
   ```

5. **Build your app:**
   ```powershell
   npm run android
   ```

## Available Scripts

- `install-java-winget.ps1` - Install via WinGet (easiest)
- `auto-install-java.ps1` - Download and install from Adoptium API
- `check-and-fix-java.ps1` - Find and configure existing Java
- `find-and-configure-java.ps1` - Alternative configuration script
- `fix-build-issues.ps1` - Complete environment setup

## Quick Start (Copy-Paste)

```powershell
# Step 1: Install Java
winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements

# Step 2: Configure
.\check-and-fix-java.ps1

# Step 3: Close PowerShell and reopen, then:
java -version
.\fix-build-issues.ps1
npm run android
```

