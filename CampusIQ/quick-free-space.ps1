# Quick Space Freeing Script
Write-Host "Freeing disk space quickly..." -ForegroundColor Cyan

# Clean Gradle user cache (can be several GB)
Write-Host "Cleaning Gradle user cache..." -ForegroundColor Yellow
Remove-Item "$env:USERPROFILE\.gradle\caches\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Done" -ForegroundColor Green

# Clean Windows temp
Write-Host "Cleaning Windows temp..." -ForegroundColor Yellow
Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Done" -ForegroundColor Green

# Clean npm cache
Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>&1 | Out-Null
Write-Host "Done" -ForegroundColor Green

$free = (Get-PSDrive C).Free
Write-Host ""
Write-Host "Free space now: $([math]::Round($free/1GB, 2)) GB" -ForegroundColor Green

