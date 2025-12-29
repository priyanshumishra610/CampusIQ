# Android Development Environment Installer
# Run this script as Administrator: Right-click PowerShell -> Run as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Android Development Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

# Clean up Chocolatey lock files
Write-Host "Cleaning up Chocolatey lock files..." -ForegroundColor Yellow
$lockFiles = @(
    "C:\ProgramData\chocolatey\lib\5df8b409508262b287880fbc43446e7383fee172",
    "C:\ProgramData\chocolatey\lib\b2c1dfac4e6762d2822ffe4f9ceb2639f5b0d65e"
)
foreach ($lockFile in $lockFiles) {
    if (Test-Path $lockFile) {
        Remove-Item $lockFile -Force -Recurse -ErrorAction SilentlyContinue
        Write-Host "Removed lock file: $lockFile" -ForegroundColor Green
    }
}

# Install JDK 21 (Temurin)
Write-Host ""
Write-Host "Installing JDK 21 (Eclipse Temurin)..." -ForegroundColor Cyan
choco install temurin21 -y
if ($LASTEXITCODE -ne 0) {
    Write-Host "JDK installation failed. Trying alternative method..." -ForegroundColor Yellow
    # Alternative: Download and install directly
    $jdkUrl = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse"
    $jdkInstaller = "$env:TEMP\jdk21-installer.msi"
    Write-Host "Downloading JDK 21..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $jdkUrl -OutFile $jdkInstaller -UseBasicParsing
    Write-Host "Installing JDK 21..." -ForegroundColor Yellow
    Start-Process msiexec.exe -ArgumentList "/i `"$jdkInstaller`" /quiet /norestart" -Wait
}

# Install Android Studio
Write-Host ""
Write-Host "Installing Android Studio..." -ForegroundColor Cyan
choco install androidstudio -y
if ($LASTEXITCODE -ne 0) {
    Write-Host "Android Studio installation via Chocolatey failed." -ForegroundColor Yellow
    Write-Host "Please download and install manually from: https://developer.android.com/studio" -ForegroundColor Yellow
    Write-Host "Or run: choco install androidstudio -y" -ForegroundColor Yellow
}

# Wait a bit for installations to complete
Start-Sleep -Seconds 5

# Find JDK installation path
Write-Host ""
Write-Host "Detecting JDK installation..." -ForegroundColor Cyan
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
    Write-Host "Found JDK at: $jdkPath" -ForegroundColor Green
    
    # Set JAVA_HOME
    Write-Host "Setting JAVA_HOME environment variable..." -ForegroundColor Cyan
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, "Machine")
    $env:JAVA_HOME = $jdkPath
    
    # Add Java to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $javaBinPath = "$jdkPath\bin"
    if ($currentPath -notlike "*$javaBinPath*") {
        [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;$javaBinPath", "Machine")
        $env:Path += ";$javaBinPath"
        Write-Host "Added Java to PATH" -ForegroundColor Green
    }
} else {
    Write-Host "WARNING: JDK path not found automatically." -ForegroundColor Yellow
    Write-Host "Please set JAVA_HOME manually after installation completes." -ForegroundColor Yellow
}

# Detect Android SDK path
Write-Host ""
Write-Host "Detecting Android SDK..." -ForegroundColor Cyan
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $androidSdkPath) {
    Write-Host "Found Android SDK at: $androidSdkPath" -ForegroundColor Green
    
    # Set ANDROID_HOME
    Write-Host "Setting ANDROID_HOME environment variable..." -ForegroundColor Cyan
    [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, "Machine")
    $env:ANDROID_HOME = $androidSdkPath
    
    # Add Android tools to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $androidPaths = @(
        "$androidSdkPath\platform-tools",
        "$androidSdkPath\tools",
        "$androidSdkPath\tools\bin"
    )
    
    foreach ($androidPath in $androidPaths) {
        if (Test-Path $androidPath) {
            if ($currentPath -notlike "*$androidPath*") {
                $currentPath += ";$androidPath"
                $env:Path += ";$androidPath"
                Write-Host "Added to PATH: $androidPath" -ForegroundColor Green
            }
        }
    }
    
    [System.Environment]::SetEnvironmentVariable("Path", $currentPath, "Machine")
} else {
    Write-Host "Android SDK not found yet. It will be installed with Android Studio." -ForegroundColor Yellow
    Write-Host "After Android Studio installation, run this script again to configure environment variables." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Close and reopen PowerShell/terminal for environment variables to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Close this PowerShell window" -ForegroundColor White
Write-Host "2. Open a NEW PowerShell window (as Administrator if needed)" -ForegroundColor White
Write-Host "3. Run: cd 'D:\tech sprint\CampusIQ'" -ForegroundColor White
Write-Host "4. Run: npx react-native doctor" -ForegroundColor White
Write-Host "5. If Android Studio is installed, open it and:" -ForegroundColor White
Write-Host "   - Go to Tools > SDK Manager" -ForegroundColor White
Write-Host "   - Install Android SDK Platform-Tools and Android Emulator" -ForegroundColor White
Write-Host "   - Go to Tools > Device Manager and create an AVD" -ForegroundColor White
Write-Host ""
pause

