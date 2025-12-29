# Fix Chocolatey Lock File Issue
# Run this as Administrator

Write-Host "Fixing Chocolatey lock files..." -ForegroundColor Cyan

$lockFiles = @(
    "C:\ProgramData\chocolatey\lib\5df8b409508262b287880fbc43446e7383fee172",
    "C:\ProgramData\chocolatey\lib\b2c1dfac4e6762d2822ffe4f9ceb2639f5b0d65e"
)

foreach ($lockFile in $lockFiles) {
    if (Test-Path $lockFile) {
        Write-Host "Removing lock file: $lockFile" -ForegroundColor Yellow
        try {
            Remove-Item $lockFile -Force -Recurse -ErrorAction Stop
            Write-Host "Removed successfully" -ForegroundColor Green
        } catch {
            Write-Host "Failed to remove: $_" -ForegroundColor Red
            Write-Host "You may need to run this script as Administrator" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Lock file not found: $lockFile" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Lock files cleaned. You can now try installing again:" -ForegroundColor Green
Write-Host "  choco install temurin21 -y" -ForegroundColor Cyan
Write-Host "  choco install androidstudio -y" -ForegroundColor Cyan

