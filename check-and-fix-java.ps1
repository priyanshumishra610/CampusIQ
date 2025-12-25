# Comprehensive Java Check and Fix Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Java Installation Check and Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Java is already in PATH
Write-Host "Step 1: Checking if Java is in PATH..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Java is already working!" -ForegroundColor Green
        $javaVersion
        exit 0
    }
} catch {
    Write-Host "Java not found in PATH" -ForegroundColor Red
}

Write-Host ""

# Step 2: Search for Java installations
Write-Host "Step 2: Searching for Java installations..." -ForegroundColor Yellow

$searchPaths = @(
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-*",
    "$env:LOCALAPPDATA\Programs\Microsoft\jdk-*",
    "$env:LOCALAPPDATA\jdk-*",
    "C:\Program Files\Eclipse Adoptium\jdk-*",
    "C:\Program Files\Microsoft\jdk-*",
    "C:\Program Files\Java\jdk-*",
    "C:\Program Files (x86)\Java\jdk-*"
)

$jdkPath = $null
foreach ($path in $searchPaths) {
    $found = Get-ChildItem $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $javaExe = "$($found.FullName)\bin\java.exe"
        if (Test-Path $javaExe) {
            $jdkPath = $found.FullName
            Write-Host "Found JDK at: $jdkPath" -ForegroundColor Green
            break
        }
    }
}

# Step 3: If not found, search more broadly
if (-not $jdkPath) {
    Write-Host "Searching more broadly..." -ForegroundColor Yellow
    
    # Search in Program Files
    $programFilesPaths = @(
        "C:\Program Files",
        "C:\Program Files (x86)",
        "$env:LOCALAPPDATA\Programs"
    )
    
    foreach ($basePath in $programFilesPaths) {
        if (Test-Path $basePath) {
            $javaDirs = Get-ChildItem $basePath -Directory -ErrorAction SilentlyContinue | 
                Where-Object { $_.Name -like "*java*" -or $_.Name -like "*jdk*" -or $_.Name -like "*adoptium*" -or $_.Name -like "*temurin*" }
            
            foreach ($dir in $javaDirs) {
                $jdkDirs = Get-ChildItem $dir.FullName -Directory -ErrorAction SilentlyContinue | 
                    Where-Object { $_.Name -like "jdk-*" }
                
                foreach ($jdkDir in $jdkDirs) {
                    $javaExe = "$($jdkDir.FullName)\bin\java.exe"
                    if (Test-Path $javaExe) {
                        $jdkPath = $jdkDir.FullName
                        Write-Host "Found JDK at: $jdkPath" -ForegroundColor Green
                        break
                    }
                }
                if ($jdkPath) { break }
            }
            if ($jdkPath) { break }
        }
    }
}

# Step 4: Configure Java if found
if ($jdkPath) {
    Write-Host ""
    Write-Host "Step 3: Configuring Java..." -ForegroundColor Yellow
    
    # Set JAVA_HOME
    Write-Host "Setting JAVA_HOME..." -ForegroundColor Cyan
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, "User")
    $env:JAVA_HOME = $jdkPath
    Write-Host "JAVA_HOME = $jdkPath" -ForegroundColor Green
    
    # Add to PATH
    Write-Host "Adding Java to PATH..." -ForegroundColor Cyan
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
    Write-Host "Testing Java..." -ForegroundColor Cyan
    & "$jdkPath\bin\java.exe" -version
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Configuration Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANT: Close and reopen PowerShell for changes to take effect!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After restarting, test with: java -version" -ForegroundColor Cyan
    
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Java Not Found!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Java/JDK is not installed on your system." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To install JDK 21, choose one of these methods:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Method 1: Using WinGet" -ForegroundColor Yellow
    Write-Host "  winget install EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements" -ForegroundColor White
    Write-Host ""
    Write-Host "Method 2: Using Chocolatey (as Administrator)" -ForegroundColor Yellow
    Write-Host "  choco install temurin21 -y" -ForegroundColor White
    Write-Host ""
    Write-Host "Method 3: Manual Download" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://adoptium.net/" -ForegroundColor White
    Write-Host "  2. Select: Version 21, Windows x64, JDK" -ForegroundColor White
    Write-Host "  3. Download and install the .msi file" -ForegroundColor White
    Write-Host ""
    Write-Host "Method 4: Use the download script" -ForegroundColor Yellow
    Write-Host "  .\download-jdk21.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "After installing, run this script again to configure Java." -ForegroundColor Cyan
}

