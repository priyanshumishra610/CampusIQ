# Install JDK 21 (Required for React Native 0.75.4)
# Current JDK 11 is too old

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing JDK 21 (Required)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Current Java: JDK 11.0.2 (too old)" -ForegroundColor Yellow
Write-Host "Required: JDK 17-20 (JDK 21 recommended)" -ForegroundColor Yellow
Write-Host ""

# Method 1: Try WinGet
Write-Host "Method 1: Trying WinGet..." -ForegroundColor Cyan
try {
    winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "JDK 21 installed via WinGet!" -ForegroundColor Green
        Start-Sleep -Seconds 5
        Write-Host ""
        Write-Host "Configuring JDK 21..." -ForegroundColor Cyan
        & "$PSScriptRoot\check-and-fix-java.ps1"
        exit 0
    }
} catch {
    Write-Host "WinGet installation failed or not available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Method 2: Trying Chocolatey..." -ForegroundColor Cyan
Write-Host "Note: This requires Administrator privileges" -ForegroundColor Yellow

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    try {
        # Remove lock file
        Remove-Item "C:\ProgramData\chocolatey\lib\5df8b409508262b287880fbc43446e7383fee172" -Force -Recurse -ErrorAction SilentlyContinue
        
        choco install temurin21 -y
        if ($LASTEXITCODE -eq 0) {
            Write-Host "JDK 21 installed via Chocolatey!" -ForegroundColor Green
            Start-Sleep -Seconds 5
            Write-Host ""
            Write-Host "Configuring JDK 21..." -ForegroundColor Cyan
            & "$PSScriptRoot\check-and-fix-java.ps1"
            exit 0
        }
    } catch {
        Write-Host "Chocolatey installation failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "Not running as Administrator. Skipping Chocolatey." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Manual Installation Required" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please install JDK 21 manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Download from Adoptium" -ForegroundColor Cyan
Write-Host "  1. Go to: https://adoptium.net/" -ForegroundColor White
Write-Host "  2. Select: Version 21, Windows x64, JDK" -ForegroundColor White
Write-Host "  3. Download and install the .msi file" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Run as Administrator and use Chocolatey" -ForegroundColor Cyan
Write-Host "  choco install temurin21 -y" -ForegroundColor White
Write-Host ""
Write-Host "After installation, run:" -ForegroundColor Yellow
Write-Host "  .\check-and-fix-java.ps1" -ForegroundColor Cyan
Write-Host ""

