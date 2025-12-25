# Comprehensive Gradle Cache Fix Script
# This script fixes all Gradle cache corruption issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Comprehensive Gradle Cache Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all Gradle processes
Write-Host "Step 1: Stopping all Gradle daemons..." -ForegroundColor Yellow
cd android
.\gradlew.bat --stop 2>&1 | Out-Null
cd ..

# Kill any remaining Java processes that might be Gradle
Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*java*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   All Gradle processes stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Clean ALL Gradle caches
Write-Host "Step 2: Cleaning ALL Gradle caches..." -ForegroundColor Yellow
$gradleCaches = @(
    "C:\Users\$env:USERNAME\.gradle\caches\8.8",
    "C:\Users\$env:USERNAME\.gradle\caches\transforms",
    "C:\Users\$env:USERNAME\.gradle\caches\kotlin-dsl",
    "C:\Users\$env:USERNAME\.gradle\daemon"
)

foreach ($cache in $gradleCaches) {
    if (Test-Path $cache) {
        Remove-Item $cache -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   Removed: $cache" -ForegroundColor Green
    }
}
Write-Host ""

# Step 3: Clean project cache
Write-Host "Step 3: Cleaning project Gradle cache..." -ForegroundColor Yellow
Remove-Item ".\android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   Project cache cleaned" -ForegroundColor Green
Write-Host ""

# Step 4: Check disk space
Write-Host "Step 4: Checking disk space..." -ForegroundColor Yellow
$free = (Get-PSDrive C).Free
$freeGB = [math]::Round($free/1GB, 2)
Write-Host "   Free space: $freeGB GB" -ForegroundColor $(if($freeGB -gt 3){"Green"}elseif($freeGB -gt 2){"Yellow"}else{"Red"})
Write-Host ""

# Step 5: Warning if low on space
if ($freeGB -lt 3) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "WARNING: LOW DISK SPACE!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "You have only $freeGB GB free. This is causing cache corruption." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You MUST free at least 3-4 GB before building:" -ForegroundColor Cyan
    Write-Host "1. Run: cleanmgr (Windows Disk Cleanup)" -ForegroundColor White
    Write-Host "2. Delete large files in Downloads folder" -ForegroundColor White
    Write-Host "3. Empty Recycle Bin" -ForegroundColor White
    Write-Host "4. Uninstall unused programs" -ForegroundColor White
    Write-Host ""
    Write-Host "The build will keep failing until you free more space!" -ForegroundColor Red
    Write-Host ""
} else {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Cache Cleanup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You have enough space ($freeGB GB)." -ForegroundColor Green
    Write-Host "Try building now: npm run android" -ForegroundColor Cyan
    Write-Host ""
}

