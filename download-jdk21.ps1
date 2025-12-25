# Download and Install JDK 21 from Adoptium
# This script downloads JDK 21 directly using the Adoptium API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Downloading JDK 21 (Eclipse Temurin)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Adoptium API endpoint for JDK 21
$apiUrl = "https://api.adoptium.net/v3/assets/latest/21/hotspot?os=windows&architecture=x64&image_type=jdk&jvm_impl=hotspot&vendor=eclipse"

Write-Host "Fetching download information..." -ForegroundColor Yellow

try {
    # Get download information from API
    $response = Invoke-RestMethod -Uri $apiUrl -UseBasicParsing
    
    if ($response -and $response.binary) {
        # Find the MSI installer
        $msiPackage = $response.binary.package | Where-Object { $_.name -like "*.msi" } | Select-Object -First 1
        
        if ($msiPackage) {
            $downloadUrl = $msiPackage.link
            $fileName = $msiPackage.name
            $installerPath = "$env:TEMP\$fileName"
            
            Write-Host "Found JDK 21 installer: $fileName" -ForegroundColor Green
            Write-Host "Download URL: $downloadUrl" -ForegroundColor Gray
            Write-Host ""
            Write-Host "Downloading JDK 21..." -ForegroundColor Cyan
            Write-Host "This may take a few minutes (file size: ~$([math]::Round($msiPackage.size / 1MB, 2)) MB)..." -ForegroundColor Yellow
            Write-Host ""
            
            # Download the installer
            $ProgressPreference = 'Continue'
            Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
            
            Write-Host "Download complete!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Installer saved to: $installerPath" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Installing JDK 21..." -ForegroundColor Cyan
            Write-Host "Please follow the installer prompts..." -ForegroundColor Yellow
            Write-Host ""
            
            # Run the installer
            Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait
            
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host "Installation Complete!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Cyan
            Write-Host "1. Run: .\find-and-configure-java.ps1" -ForegroundColor White
            Write-Host "2. Close and reopen PowerShell" -ForegroundColor White
            Write-Host "3. Test with: java -version" -ForegroundColor White
            Write-Host ""
            
            # Ask if user wants to clean up installer
            Write-Host "Clean up installer? (Y/N): " -ForegroundColor Yellow -NoNewline
            $cleanup = Read-Host
            if ($cleanup -eq "Y" -or $cleanup -eq "y") {
                Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
                Write-Host "Installer removed." -ForegroundColor Green
            } else {
                Write-Host "Installer kept at: $installerPath" -ForegroundColor Gray
            }
            
        } else {
            Write-Host "ERROR: MSI installer not found in API response" -ForegroundColor Red
            Write-Host "Try downloading manually from: https://adoptium.net/" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ERROR: Invalid API response" -ForegroundColor Red
        Write-Host "Try downloading manually from: https://adoptium.net/" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "ERROR: Failed to download JDK 21" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative download methods:" -ForegroundColor Yellow
    Write-Host "1. Manual download: https://adoptium.net/" -ForegroundColor Cyan
    Write-Host "2. Using Chocolatey (as Admin): choco install temurin21 -y" -ForegroundColor Cyan
    Write-Host "3. Using WinGet: winget install EclipseAdoptium.Temurin.21.JDK" -ForegroundColor Cyan
}

