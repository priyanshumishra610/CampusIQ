# Automatic Java Download, Install, and Configuration
# This script does everything automatically

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Automatic Java Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Java is already installed and working
Write-Host "Checking if Java is already installed..." -ForegroundColor Yellow
try {
    $javaCheck = java -version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Java is already installed and working!" -ForegroundColor Green
        $javaCheck
        Write-Host ""
        Write-Host "Checking JAVA_HOME..." -ForegroundColor Yellow
        if ($env:JAVA_HOME) {
            Write-Host "JAVA_HOME is set to: $env:JAVA_HOME" -ForegroundColor Green
        } else {
            Write-Host "JAVA_HOME is not set. Running configuration..." -ForegroundColor Yellow
            & "$PSScriptRoot\check-and-fix-java.ps1"
        }
        exit 0
    }
} catch {
    Write-Host "Java not found. Proceeding with installation..." -ForegroundColor Yellow
}

Write-Host ""

# Step 1: Download JDK 21
Write-Host "Step 1: Downloading JDK 21 from Adoptium..." -ForegroundColor Cyan

$apiUrl = "https://api.adoptium.net/v3/assets/latest/21/hotspot?os=windows&architecture=x64&image_type=jdk&jvm_impl=hotspot&vendor=eclipse"

try {
    Write-Host "Fetching download information from Adoptium API..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $apiUrl -UseBasicParsing
    
    if ($response -and $response.binary) {
        # Try to find MSI installer first, then ZIP as fallback
        $msiPackage = $response.binary.package | Where-Object { $_.name -like "*.msi" } | Select-Object -First 1
        $zipPackage = $response.binary.package | Where-Object { $_.name -like "*.zip" } | Select-Object -First 1
        
        # Prefer MSI, but use ZIP if MSI not available
        $package = $msiPackage
        $isZip = $false
        
        if (-not $package -and $zipPackage) {
            $package = $zipPackage
            $isZip = $true
            Write-Host "MSI not available, using ZIP package instead..." -ForegroundColor Yellow
        }
        
        if ($package) {
            $downloadUrl = $package.link
            $fileName = $package.name
            $fileSizeMB = [math]::Round($package.size / 1MB, 2)
            $installerPath = "$env:TEMP\$fileName"
            
            Write-Host "Found JDK 21 installer: $fileName" -ForegroundColor Green
            Write-Host "File size: $fileSizeMB MB" -ForegroundColor Gray
            Write-Host ""
            
            # Check if already downloaded
            if (Test-Path $installerPath) {
                Write-Host "Installer already exists at: $installerPath" -ForegroundColor Yellow
                $useExisting = Read-Host "Use existing file? (Y/N)"
                if ($useExisting -ne "Y" -and $useExisting -ne "y") {
                    Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
                }
            }
            
            if (-not (Test-Path $installerPath)) {
                Write-Host "Downloading JDK 21..." -ForegroundColor Cyan
                Write-Host "This may take a few minutes..." -ForegroundColor Yellow
                Write-Host ""
                
                $ProgressPreference = 'Continue'
                Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
                
                Write-Host "Download complete!" -ForegroundColor Green
            }
            
            Write-Host ""
            Write-Host "Step 2: Installing JDK 21..." -ForegroundColor Cyan
            
            if ($isZip) {
                # Extract ZIP to Program Files
                Write-Host "Extracting ZIP package..." -ForegroundColor Yellow
                $extractPath = "C:\Program Files\Eclipse Adoptium"
                New-Item -ItemType Directory -Path $extractPath -Force | Out-Null
                
                Expand-Archive -Path $installerPath -DestinationPath $extractPath -Force
                
                # Find the extracted JDK folder
                $jdkFolder = Get-ChildItem $extractPath -Directory | Where-Object { $_.Name -like "jdk-*" } | Select-Object -First 1
                if ($jdkFolder) {
                    $jdkPath = $jdkFolder.FullName
                    Write-Host "Extracted to: $jdkPath" -ForegroundColor Green
                    $process = New-Object PSObject -Property @{ ExitCode = 0 }
                } else {
                    Write-Host "ERROR: Could not find extracted JDK folder" -ForegroundColor Red
                    $process = New-Object PSObject -Property @{ ExitCode = 1 }
                }
            } else {
                # Install MSI silently
                Write-Host "Running MSI installer silently..." -ForegroundColor Yellow
                Write-Host ""
                
                $installArgs = "/i `"$installerPath`" /quiet /norestart ADDLOCAL=FeatureMain,FeatureEnvironment,FeatureJarFileRunWith,FeatureJavaHome INSTALLDIR=`"C:\Program Files\Eclipse Adoptium\jdk-21.0.0`""
                $process = Start-Process msiexec.exe -ArgumentList $installArgs -Wait -PassThru -NoNewWindow
            }
            
            if ($process.ExitCode -eq 0) {
                Write-Host "Installation completed successfully!" -ForegroundColor Green
            } else {
                Write-Host "Installation completed with exit code: $($process.ExitCode)" -ForegroundColor Yellow
            }
            
            Write-Host ""
            Write-Host "Step 3: Configuring Java environment..." -ForegroundColor Cyan
            
            # Wait a moment for installation to complete
            Start-Sleep -Seconds 3
            
            # Find the installed JDK
            $jdkPaths = @(
                "C:\Program Files\Eclipse Adoptium\jdk-21*",
                "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-21*"
            )
            
            $jdkPath = $null
            foreach ($path in $jdkPaths) {
                $found = Get-ChildItem $path -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($found) {
                    $javaExe = "$($found.FullName)\bin\java.exe"
                    if (Test-Path $javaExe) {
                        $jdkPath = $found.FullName
                        break
                    }
                }
            }
            
            if ($jdkPath) {
                Write-Host "Found installed JDK at: $jdkPath" -ForegroundColor Green
                
                # Set JAVA_HOME
                Write-Host "Setting JAVA_HOME..." -ForegroundColor Yellow
                [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, "User")
                $env:JAVA_HOME = $jdkPath
                Write-Host "JAVA_HOME = $jdkPath" -ForegroundColor Green
                
                # Add to PATH
                Write-Host "Adding Java to PATH..." -ForegroundColor Yellow
                $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
                $javaBinPath = "$jdkPath\bin"
                
                if ($currentPath -notlike "*$javaBinPath*") {
                    $newPath = if ($currentPath) { "$currentPath;$javaBinPath" } else { $javaBinPath }
                    [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
                    $env:Path += ";$javaBinPath"
                    Write-Host "Added to PATH: $javaBinPath" -ForegroundColor Green
                } else {
                    Write-Host "Java already in PATH" -ForegroundColor Yellow
                }
                
                Write-Host ""
                Write-Host "Testing Java installation..." -ForegroundColor Cyan
                & "$javaBinPath\java.exe" -version
                
                Write-Host ""
                Write-Host "========================================" -ForegroundColor Cyan
                Write-Host "Installation and Configuration Complete!" -ForegroundColor Green
                Write-Host "========================================" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "Java has been:" -ForegroundColor Cyan
                Write-Host "  - Downloaded" -ForegroundColor White
                Write-Host "  - Installed" -ForegroundColor White
                Write-Host "  - JAVA_HOME configured" -ForegroundColor White
                Write-Host "  - Added to PATH" -ForegroundColor White
                Write-Host ""
                Write-Host "IMPORTANT: Close and reopen PowerShell for changes to take effect!" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "After restarting PowerShell, test with: java -version" -ForegroundColor Cyan
                
                # Clean up installer
                Write-Host ""
                $cleanup = Read-Host "Remove installer file? (Y/N)"
                if ($cleanup -eq "Y" -or $cleanup -eq "y") {
                    Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
                    Write-Host "Installer removed." -ForegroundColor Green
                }
                
            } else {
                Write-Host "WARNING: JDK installed but path not found automatically." -ForegroundColor Yellow
                Write-Host "Please run: .\check-and-fix-java.ps1" -ForegroundColor Cyan
            }
            
        } else {
            Write-Host "ERROR: No installer package found in API response" -ForegroundColor Red
            Write-Host ""
            Write-Host "Trying alternative installation methods..." -ForegroundColor Yellow
            Write-Host ""
            
            # Try WinGet
            Write-Host "Attempting installation via WinGet..." -ForegroundColor Cyan
            try {
                $wingetResult = winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Installation via WinGet successful!" -ForegroundColor Green
                    Start-Sleep -Seconds 3
                    # Run configuration
                    & "$PSScriptRoot\check-and-fix-java.ps1"
                    exit 0
                }
            } catch {
                Write-Host "WinGet installation failed" -ForegroundColor Yellow
            }
            
            Write-Host ""
            Write-Host "Please install Java manually:" -ForegroundColor Yellow
            Write-Host "1. Go to: https://adoptium.net/" -ForegroundColor White
            Write-Host "2. Download JDK 21 for Windows x64" -ForegroundColor White
            Write-Host "3. Run the installer" -ForegroundColor White
            Write-Host "4. Then run: .\check-and-fix-java.ps1" -ForegroundColor White
        }
    } else {
        Write-Host "ERROR: Invalid API response" -ForegroundColor Red
        Write-Host "Try manual download from: https://adoptium.net/" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "ERROR: Failed to download JDK 21" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Try using WinGet or Chocolatey:" -ForegroundColor Yellow
    Write-Host "  winget install EclipseAdoptium.Temurin.21.JDK" -ForegroundColor Cyan
    Write-Host "  choco install temurin21 -y (as Administrator)" -ForegroundColor Cyan
}

