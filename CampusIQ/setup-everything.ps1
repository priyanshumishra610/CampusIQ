# Master Setup Script - Does Everything Automatically
# This script finds and configures Java, Android SDK, and sets up everything

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Find and Configure Java
Write-Host "Step 1: Configuring Java..." -ForegroundColor Cyan

$javaPath = "C:\Program Files\Java"
$jdkPath = $null

if (Test-Path $javaPath) {
    # Look for JDK 21 first (preferred)
    $jdk21 = Get-ChildItem $javaPath -Directory -ErrorAction SilentlyContinue | 
        Where-Object { $_.Name -match "21" } | 
        Sort-Object Name -Descending | 
        Select-Object -First 1
    
    if ($jdk21) {
        $javaExe = "$($jdk21.FullName)\bin\java.exe"
        if (Test-Path $javaExe) {
            $jdkPath = $jdk21.FullName
            Write-Host "Found JDK 21 at: $jdkPath" -ForegroundColor Green
        }
    }
    
    # If no JDK 21, try JDK 25
    if (-not $jdkPath) {
        $jdk25 = Get-ChildItem $javaPath -Directory -ErrorAction SilentlyContinue | 
            Where-Object { $_.Name -match "25" } | 
            Sort-Object Name -Descending | 
            Select-Object -First 1
        
        if ($jdk25) {
            $javaExe = "$($jdk25.FullName)\bin\java.exe"
            if (Test-Path $javaExe) {
                $jdkPath = $jdk25.FullName
                Write-Host "Found JDK 25 at: $jdkPath" -ForegroundColor Green
            }
        }
    }
    
    # If still not found, try any JDK
    if (-not $jdkPath) {
        $anyJdk = Get-ChildItem $javaPath -Directory -ErrorAction SilentlyContinue | 
            Where-Object { $_.Name -like "*jdk*" } | 
            Sort-Object Name -Descending | 
            Select-Object -First 1
        
        if ($anyJdk) {
            $javaExe = "$($anyJdk.FullName)\bin\java.exe"
            if (Test-Path $javaExe) {
                $jdkPath = $anyJdk.FullName
                Write-Host "Found JDK at: $jdkPath" -ForegroundColor Green
            }
        }
    }
}

if ($jdkPath) {
    # Set JAVA_HOME
    Write-Host "Setting JAVA_HOME..." -ForegroundColor Yellow
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, "User")
    $env:JAVA_HOME = $jdkPath
    Write-Host "JAVA_HOME = $jdkPath" -ForegroundColor Green
    
    # Add to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $javaBinPath = "$jdkPath\bin"
    
    if ($currentPath -notlike "*$javaBinPath*") {
        $newPath = if ($currentPath) { "$currentPath;$javaBinPath" } else { $javaBinPath }
        [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        $env:Path += ";$javaBinPath"
        Write-Host "Added Java to PATH" -ForegroundColor Green
    } else {
        Write-Host "Java already in PATH" -ForegroundColor Yellow
    }
    
    # Test Java
    Write-Host "Testing Java..." -ForegroundColor Yellow
    & "$javaBinPath\java.exe" -version
    
} else {
    Write-Host "ERROR: Could not find JDK in C:\Program Files\Java" -ForegroundColor Red
    Write-Host "Listing available folders:" -ForegroundColor Yellow
    Get-ChildItem $javaPath -Directory -ErrorAction SilentlyContinue | Select-Object Name
}

Write-Host ""

# Step 2: Configure Android SDK
Write-Host "Step 2: Configuring Android SDK..." -ForegroundColor Cyan

# Try multiple possible SDK locations
$possibleSdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
)

$androidSdkPath = $null
foreach ($path in $possibleSdkPaths) {
    if (Test-Path $path) {
        $androidSdkPath = $path
        break
    }
}

if ($androidSdkPath) {
    Write-Host "Found Android SDK at: $androidSdkPath" -ForegroundColor Green
    
    # Set ANDROID_HOME
    Write-Host "Setting ANDROID_HOME..." -ForegroundColor Yellow
    [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, "User")
    $env:ANDROID_HOME = $androidSdkPath
    Write-Host "ANDROID_HOME = $androidSdkPath" -ForegroundColor Green
    
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
        Write-Host "Added Android tools to PATH" -ForegroundColor Green
    } else {
        Write-Host "Android tools already in PATH" -ForegroundColor Yellow
    }
    
    # Check for ADB
    $adbPath = "$androidSdkPath\platform-tools\adb.exe"
    if (Test-Path $adbPath) {
        Write-Host "ADB found at: $adbPath" -ForegroundColor Green
        
        # Test if adb is accessible via PATH in current session
        try {
            $null = Get-Command adb -ErrorAction Stop
            Write-Host "ADB is accessible via PATH in current session" -ForegroundColor Green
        } catch {
            Write-Host "ADB not yet in PATH for current session (will work after restart)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "WARNING: ADB not found. Install Android SDK Platform-Tools in Android Studio" -ForegroundColor Yellow
        Write-Host "  SDK Manager > SDK Tools > Android SDK Platform-Tools" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "Android SDK not found in standard locations" -ForegroundColor Yellow
    
    # Check if ADB exists at the specific path provided
    $specificAdbPath = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk\platform-tools\adb.exe"
    if (Test-Path $specificAdbPath) {
        $androidSdkPath = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
        Write-Host "Found Android SDK via ADB path: $androidSdkPath" -ForegroundColor Green
        
        # Set ANDROID_HOME
        Write-Host "Setting ANDROID_HOME..." -ForegroundColor Yellow
        [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, "User")
        $env:ANDROID_HOME = $androidSdkPath
        Write-Host "ANDROID_HOME = $androidSdkPath" -ForegroundColor Green
        
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
            Write-Host "Added Android tools to PATH" -ForegroundColor Green
        } else {
            Write-Host "Android tools already in PATH" -ForegroundColor Yellow
        }
        
        # Check for ADB
        $adbPath = "$androidSdkPath\platform-tools\adb.exe"
        if (Test-Path $adbPath) {
            Write-Host "ADB found at: $adbPath" -ForegroundColor Green
            
            # Test if adb is accessible via PATH in current session
            try {
                $null = Get-Command adb -ErrorAction Stop
                Write-Host "ADB is accessible via PATH in current session" -ForegroundColor Green
            } catch {
                Write-Host "ADB not yet in PATH for current session (will work after restart)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "Install Android Studio to get the SDK" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 3: Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Environment Variables Set:" -ForegroundColor Cyan
Write-Host "  JAVA_HOME = $env:JAVA_HOME" -ForegroundColor White
Write-Host "  ANDROID_HOME = $env:ANDROID_HOME" -ForegroundColor White
Write-Host ""

Write-Host "Current Session Test:" -ForegroundColor Cyan
if ($jdkPath) {
    Write-Host "Java:" -ForegroundColor Yellow
    try {
        & "$jdkPath\bin\java.exe" -version 2>&1 | Select-Object -First 1
    } catch {
        Write-Host "  Java test failed" -ForegroundColor Red
    }
}

if (Test-Path "$androidSdkPath\platform-tools\adb.exe") {
    Write-Host "ADB (full path):" -ForegroundColor Yellow
    try {
        & "$androidSdkPath\platform-tools\adb.exe" version 2>&1 | Select-Object -First 1
    } catch {
        Write-Host "  ADB test failed" -ForegroundColor Red
    }
    
    # Test if adb works as a command (requires PATH refresh)
    Write-Host "ADB (as command - may need PATH refresh):" -ForegroundColor Yellow
    try {
        $adbCmd = Get-Command adb -ErrorAction Stop
        & adb version 2>&1 | Select-Object -First 1
    } catch {
        Write-Host "  'adb' command not found - PATH needs refresh" -ForegroundColor Yellow
        Write-Host "  Run: `$env:Path = [System.Environment]::GetEnvironmentVariable('Path','User') + ';' + [System.Environment]::GetEnvironmentVariable('Path','Machine')" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IMPORTANT: Refresh PATH or Restart PowerShell!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Refresh PATH in current session (run this now):" -ForegroundColor Cyan
Write-Host "  `$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Close and reopen PowerShell (recommended)" -ForegroundColor Cyan
Write-Host ""
Write-Host "After refreshing PATH or restarting, test with:" -ForegroundColor Cyan
Write-Host "  java -version" -ForegroundColor White
Write-Host "  adb version" -ForegroundColor White
Write-Host "  npx react-native doctor" -ForegroundColor White
Write-Host "  npm run android" -ForegroundColor White
Write-Host ""

