# Direct JDK 21 Installation (Alternative to Chocolatey)
# This downloads and installs JDK 21 directly from Adoptium

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Direct JDK 21 Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the latest JDK 21 download URL
Write-Host "Fetching latest JDK 21 download URL..." -ForegroundColor Yellow
$apiUrl = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse"
$downloadUrl = (Invoke-RestMethod -Uri "https://api.adoptium.net/v3/assets/latest/21/hotspot?os=windows&architecture=x64&image_type=jdk&jvm_impl=hotspot&vendor=eclipse" -UseBasicParsing | Where-Object { $_.binary.package.link -like "*.msi" } | Select-Object -First 1).binary.package.link

if (-not $downloadUrl) {
    # Fallback to direct API
    Write-Host "Using alternative method..." -ForegroundColor Yellow
    $downloadUrl = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"
}

$installerPath = "$env:TEMP\jdk21-installer.msi"

Write-Host "Downloading JDK 21..." -ForegroundColor Cyan
Write-Host "URL: $downloadUrl" -ForegroundColor Gray
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "✓ Download complete" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installing JDK 21..." -ForegroundColor Cyan
    Write-Host "Please follow the installer prompts..." -ForegroundColor Yellow
    
    Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait -NoNewWindow
    
    Write-Host ""
    Write-Host "✓ Installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Find your JDK installation path (usually C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot)" -ForegroundColor White
    Write-Host "2. Run: .\configure-env.ps1" -ForegroundColor White
    Write-Host "3. Or manually set JAVA_HOME environment variable" -ForegroundColor White
    
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Download manually from:" -ForegroundColor Yellow
    Write-Host "https://adoptium.net/temurin/releases/?version=21" -ForegroundColor Cyan
}

# Clean up
if (Test-Path $installerPath) {
    Write-Host ""
    Write-Host "Cleaning up installer..." -ForegroundColor Gray
    Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
}

