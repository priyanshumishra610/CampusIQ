# Install Java using WinGet (Most Reliable Method)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing Java via WinGet" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if WinGet is available
Write-Host "Checking for WinGet..." -ForegroundColor Yellow
try {
    $wingetVersion = winget --version 2>&1
    Write-Host "WinGet found: $wingetVersion" -ForegroundColor Green
} catch {
    Write-Host "WinGet not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "WinGet is the Windows Package Manager." -ForegroundColor Yellow
    Write-Host "Install it from: https://aka.ms/getwinget" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or use the alternative script: .\auto-install-java.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Installing JDK 21 (Eclipse Temurin)..." -ForegroundColor Cyan
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

try {
    winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements --silent
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Installation successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Configuring Java environment..." -ForegroundColor Cyan
        
        # Wait for installation to complete
        Start-Sleep -Seconds 5
        
        # Run configuration script
        & "$PSScriptRoot\check-and-fix-java.ps1"
        
    } else {
        Write-Host "Installation may have completed. Checking..." -ForegroundColor Yellow
        & "$PSScriptRoot\check-and-fix-java.ps1"
    }
    
} catch {
    Write-Host "ERROR: Installation failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try running manually:" -ForegroundColor Yellow
    Write-Host "  winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements" -ForegroundColor Cyan
}

