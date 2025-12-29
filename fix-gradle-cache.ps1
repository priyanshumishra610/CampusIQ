# Fix Gradle Cache and Build Issues
# This script cleans corrupted Gradle cache and fixes build errors

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Gradle Cache Issues" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$androidDir = ".\android"
if (-not (Test-Path $androidDir)) {
    Write-Host "ERROR: android directory not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root." -ForegroundColor Yellow
    exit 1
}

# Step 1: Stop all Gradle daemons
Write-Host "Step 1: Stopping Gradle daemons..." -ForegroundColor Yellow
Set-Location $androidDir
try {
    .\gradlew.bat --stop 2>&1 | Out-Null
    Write-Host "Gradle daemons stopped" -ForegroundColor Green
} catch {
    Write-Host "No Gradle daemons running (or gradlew not found)" -ForegroundColor Yellow
}
Set-Location ..

Write-Host ""

# Step 2: Kill any remaining Java/Gradle processes
Write-Host "Step 2: Checking for running Gradle/Java processes..." -ForegroundColor Yellow
$gradleProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*gradle*" }
if ($gradleProcesses) {
    Write-Host "Found Gradle processes, stopping them..." -ForegroundColor Yellow
    $gradleProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "Processes stopped" -ForegroundColor Green
} else {
    Write-Host "No Gradle processes found" -ForegroundColor Green
}

Write-Host ""

# Step 3: Delete corrupted Gradle cache (targeting the specific error)
Write-Host "Step 3: Cleaning corrupted Gradle cache..." -ForegroundColor Yellow
$corruptedCacheDir = "$androidDir\.gradle\8.8\dependencies-accessors"
if (Test-Path $corruptedCacheDir) {
    Write-Host "Removing corrupted cache: $corruptedCacheDir" -ForegroundColor Yellow
    try {
        Remove-Item $corruptedCacheDir -Recurse -Force -ErrorAction Stop
        Write-Host "  ✓ Removed successfully" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Could not remove (may be locked)" -ForegroundColor Yellow
        Write-Host "  Try: Close Android Studio, then delete manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Corrupted cache not found (may already be cleaned)" -ForegroundColor Gray
}

# Also try to remove the entire .gradle directory if it's small enough
$gradleDir = "$androidDir\.gradle"
if (Test-Path $gradleDir) {
    Write-Host "Removing entire .gradle directory..." -ForegroundColor Yellow
    try {
        # Use robocopy trick for faster deletion on Windows
        $emptyDir = "$env:TEMP\empty_gradle_$(Get-Random)"
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
        robocopy $emptyDir $gradleDir /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS | Out-Null
        Remove-Item $emptyDir -Force -ErrorAction SilentlyContinue
        Remove-Item $gradleDir -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Removed successfully" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Using alternative method..." -ForegroundColor Yellow
        # Fallback: just remove the specific corrupted folder
        if (Test-Path "$gradleDir\8.8") {
            Remove-Item "$gradleDir\8.8" -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host ""

# Step 4: Clean build directories
Write-Host "Step 4: Cleaning build directories..." -ForegroundColor Yellow
$buildDirs = @(
    "$androidDir\app\build",
    "$androidDir\build",
    "$androidDir\.gradle"
)

foreach ($buildDir in $buildDirs) {
    if (Test-Path $buildDir) {
        Write-Host "Removing: $buildDir" -ForegroundColor Yellow
        try {
            Remove-Item $buildDir -Recurse -Force -ErrorAction Stop
            Write-Host "  ✓ Removed successfully" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠ Could not remove: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Step 5: Clean using Gradle
Write-Host "Step 5: Running Gradle clean..." -ForegroundColor Yellow
Set-Location $androidDir
try {
    .\gradlew.bat clean 2>&1 | Out-Null
    Write-Host "Gradle clean completed" -ForegroundColor Green
} catch {
    Write-Host "Gradle clean failed (this is okay if cache was corrupted)" -ForegroundColor Yellow
}
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Close Android Studio and any IDEs" -ForegroundColor White
Write-Host "2. Run: npm run android" -ForegroundColor White
Write-Host "   or" -ForegroundColor White
Write-Host "   .\run-on-device.ps1" -ForegroundColor White
Write-Host ""
Write-Host "If issues persist, try:" -ForegroundColor Yellow
Write-Host "  cd android" -ForegroundColor White
Write-Host "  .\gradlew.bat clean --no-daemon" -ForegroundColor White
Write-Host "  cd .." -ForegroundColor White
Write-Host "  npm run android" -ForegroundColor White
Write-Host ""

