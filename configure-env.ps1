# Android Development Environment Configuration Script
# Run as Administrator for system-wide configuration, or as regular user for user-level

param(
    [switch]$UserLevel = $false
)

$scope = if ($UserLevel) { "User" } else { "Machine" }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuring Android Development Environment" -ForegroundColor Cyan
Write-Host "Scope: $scope" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find JDK 21
Write-Host "Searching for JDK 21..." -ForegroundColor Yellow
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
        Write-Host "Found JDK at: $jdkPath" -ForegroundColor Green
        break
    }
}

if (-not $jdkPath) {
    Write-Host "JDK not found. Please install JDK 21 first." -ForegroundColor Red
    Write-Host "Download from: https://adoptium.net/temurin/releases/?version=21" -ForegroundColor Yellow
} else {
    # Set JAVA_HOME
    Write-Host "Setting JAVA_HOME..." -ForegroundColor Cyan
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, $scope)
    $env:JAVA_HOME = $jdkPath
    
    # Add Java to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", $scope)
    $javaBinPath = "$jdkPath\bin"
    if ($currentPath -notlike "*$javaBinPath*") {
        $newPath = if ($currentPath) { "$currentPath;$javaBinPath" } else { $javaBinPath }
        [System.Environment]::SetEnvironmentVariable("Path", $newPath, $scope)
        $env:Path += ";$javaBinPath"
        Write-Host "Added Java to PATH: $javaBinPath" -ForegroundColor Green
    } else {
        Write-Host "Java already in PATH" -ForegroundColor Yellow
    }
}

Write-Host ""

# Find Android SDK
Write-Host "Searching for Android SDK..." -ForegroundColor Yellow
$androidSdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
)

$androidSdkPath = $null
foreach ($path in $androidSdkPaths) {
    if (Test-Path $path) {
        $androidSdkPath = $path
        Write-Host "Found Android SDK at: $androidSdkPath" -ForegroundColor Green
        break
    }
}

if (-not $androidSdkPath) {
    Write-Host "Android SDK not found at default location." -ForegroundColor Yellow
    Write-Host "If Android Studio is installed, the SDK will be created when you first open it." -ForegroundColor Yellow
    Write-Host "Default location: $env:LOCALAPPDATA\Android\Sdk" -ForegroundColor Yellow
} else {
    # Set ANDROID_HOME
    Write-Host "Setting ANDROID_HOME..." -ForegroundColor Cyan
    [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, $scope)
    $env:ANDROID_HOME = $androidSdkPath
    
    # Add Android tools to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", $scope)
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
        [System.Environment]::SetEnvironmentVariable("Path", $currentPath, $scope)
        Write-Host "Added Android tools to PATH:" -ForegroundColor Green
        foreach ($path in $pathsAdded) {
            Write-Host "  - $path" -ForegroundColor Green
        }
    } else {
        Write-Host "Android tools already in PATH" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Current environment variables:" -ForegroundColor Cyan
Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor White
Write-Host "ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Close and reopen PowerShell for changes to take effect!" -ForegroundColor Yellow
Write-Host ""
Write-Host "To verify, run in a new PowerShell:" -ForegroundColor Cyan
Write-Host "  java -version" -ForegroundColor White
Write-Host "  adb version" -ForegroundColor White
Write-Host "  npx react-native doctor" -ForegroundColor White
Write-Host ""

