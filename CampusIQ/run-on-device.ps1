# Build and Run on Connected Device

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building and Running on Device" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if device is connected
Write-Host "Checking for connected devices..." -ForegroundColor Yellow

# Find ADB path
$adbPath = $null
$possibleAdbPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk\platform-tools\adb.exe"
)

foreach ($path in $possibleAdbPaths) {
    if (Test-Path $path) {
        $adbPath = $path
        break
    }
}

# Try to use adb command first, fallback to full path
try {
    $adbCmd = Get-Command adb -ErrorAction Stop
    $useAdbCommand = $true
} catch {
    $useAdbCommand = $false
}

$hasDevice = $false
$deviceList = @()

try {
    if ($useAdbCommand) {
        $devices = adb devices 2>&1
    } elseif ($adbPath) {
        $devices = & $adbPath devices 2>&1
    } else {
        throw "ADB not found"
    }
    
    if ($LASTEXITCODE -eq 0) {
        $deviceList = $devices | Where-Object { $_ -match "device$" }
        if ($deviceList) {
            $hasDevice = $true
            Write-Host "Device(s) found:" -ForegroundColor Green
            $devices
            Write-Host ""
        } else {
            Write-Host "WARNING: No devices found!" -ForegroundColor Yellow
            Write-Host ""
            
            # Check for available emulators
            Write-Host "Checking for available emulators..." -ForegroundColor Yellow
            $emulatorPath = $null
            $possibleEmulatorPaths = @(
                "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe",
                "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk\emulator\emulator.exe"
            )
            
            foreach ($path in $possibleEmulatorPaths) {
                if (Test-Path $path) {
                    $emulatorPath = $path
                    break
                }
            }
            
            if ($emulatorPath) {
                try {
                    $avds = & $emulatorPath -list-avds 2>&1
                    if ($avds -and $avds.Count -gt 0) {
                        Write-Host "Available emulators:" -ForegroundColor Cyan
                        $avds | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
                        Write-Host ""
                        Write-Host "Note: React Native will try to launch an emulator automatically." -ForegroundColor Yellow
                        Write-Host "If emulator launch fails, try starting it manually:" -ForegroundColor Yellow
                        Write-Host "  $emulatorPath -avd $($avds[0])" -ForegroundColor Cyan
                        Write-Host ""
                    } else {
                        Write-Host "No emulators found. Create one in Android Studio:" -ForegroundColor Yellow
                        Write-Host "  Tools > Device Manager > Create Device" -ForegroundColor Cyan
                        Write-Host ""
                    }
                } catch {
                    Write-Host "Could not list emulators." -ForegroundColor Yellow
                }
            }
            
            Write-Host "To use a physical device:" -ForegroundColor Yellow
            Write-Host "  1. USB debugging is enabled on your device" -ForegroundColor White
            Write-Host "  2. Device is connected via USB" -ForegroundColor White
            Write-Host "  3. You've authorized the computer on your device" -ForegroundColor White
            Write-Host ""
            Write-Host "Continuing with build..." -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "ADB not found. Make sure Android SDK Platform-Tools is installed." -ForegroundColor Red
    if ($adbPath) {
        Write-Host "Found ADB at: $adbPath" -ForegroundColor Yellow
        Write-Host "Try running the setup script to add it to PATH" -ForegroundColor Yellow
    } else {
        Write-Host "Expected location: C:\Users\$env:USERNAME\AppData\Local\Android\Sdk\platform-tools\adb.exe" -ForegroundColor Yellow
    }
    Write-Host "Continuing with build..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting Metro bundler in background..." -ForegroundColor Cyan
Write-Host ""

# Start Metro in background
$metroJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm start
}

Write-Host "Metro bundler started (Job ID: $($metroJob.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "Building and installing app..." -ForegroundColor Cyan
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

# Build and run
try {
    npm run android
    
    # Check if build failed due to emulator issues
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Build may have failed. Common issues:" -ForegroundColor Yellow
        Write-Host ""
        
        if (-not $hasDevice) {
            Write-Host "Emulator Launch Issues:" -ForegroundColor Yellow
            Write-Host "  - If emulator failed to launch, try:" -ForegroundColor White
            Write-Host "    1. Start emulator manually from Android Studio" -ForegroundColor Cyan
            Write-Host "    2. Or run: emulator -avd <AVD_NAME>" -ForegroundColor Cyan
            Write-Host "    3. Wait for emulator to fully boot, then run this script again" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "  - To fix emulator issues:" -ForegroundColor White
            Write-Host "    1. Open Android Studio > Tools > Device Manager" -ForegroundColor Cyan
            Write-Host "    2. Check if your AVD is properly configured" -ForegroundColor Cyan
            Write-Host "    3. Try cold booting the emulator" -ForegroundColor Cyan
            Write-Host ""
        }
        
        Write-Host "Other troubleshooting:" -ForegroundColor Yellow
        Write-Host "  - Check Metro bundler is running: Get-Job" -ForegroundColor Cyan
        Write-Host "  - View Metro logs: Receive-Job $($metroJob.Id)" -ForegroundColor Cyan
        Write-Host ""
    }
} catch {
    Write-Host "Error during build: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "If emulator launch failed, try starting it manually first." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop Metro bundler, run: Stop-Job $($metroJob.Id)" -ForegroundColor Yellow
Write-Host ""

