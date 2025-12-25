# Find and configure Java that was installed by React Native doctor

Write-Host "Searching for Java installation..." -ForegroundColor Cyan
Write-Host ""

# Check common locations where React Native doctor installs JDK
$searchPaths = @(
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-*",
    "$env:LOCALAPPDATA\Programs\Microsoft\jdk-*",
    "$env:LOCALAPPDATA\jdk-*",
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Eclipse Adoptium\jdk-*",
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Microsoft\jdk-*",
    "C:\Users\$env:USERNAME\AppData\Local\jdk-*",
    "C:\Program Files\Eclipse Adoptium\jdk-*",
    "C:\Program Files\Microsoft\jdk-*",
    "C:\Program Files\Java\jdk-*"
)

$jdkPath = $null
foreach ($path in $searchPaths) {
    $found = Get-ChildItem $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $jdkPath = $found.FullName
        Write-Host "Found JDK at: $jdkPath" -ForegroundColor Green
        break
    }
}

if (-not $jdkPath) {
    Write-Host "JDK not found in common locations. Searching more broadly..." -ForegroundColor Yellow
    
    # Search in Local AppData more broadly
    $localAppData = "$env:LOCALAPPDATA"
    $allDirs = Get-ChildItem $localAppData -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*jdk*" -or $_.Name -like "*java*" -or $_.Name -like "*adoptium*" -or $_.Name -like "*temurin*" }
    
    foreach ($dir in $allDirs) {
        $jdkDirs = Get-ChildItem $dir.FullName -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "jdk-*" }
        if ($jdkDirs) {
            $jdkPath = $jdkDirs[0].FullName
            Write-Host "Found JDK at: $jdkPath" -ForegroundColor Green
            break
        }
    }
}

if ($jdkPath) {
    # Verify it's a valid JDK installation
    $javaExe = "$jdkPath\bin\java.exe"
    if (Test-Path $javaExe) {
        Write-Host "Valid JDK installation confirmed" -ForegroundColor Green
        Write-Host ""
        
        # Set JAVA_HOME
        Write-Host "Setting JAVA_HOME..." -ForegroundColor Cyan
        [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, "User")
        $env:JAVA_HOME = $jdkPath
        Write-Host "JAVA_HOME set to: $jdkPath" -ForegroundColor Green
        
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
        & "$javaExe" -version
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyanjava -versionadb version

        Write-Host "Configuration Complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "IMPORTANT: Close and reopen PowerShell for changes to take effect!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "After restarting, test with: java -version" -ForegroundColor Cyan
        
    } else {
        Write-Host "ERROR: java.exe not found at: $javaExe" -ForegroundColor Red
    }
} else {
    Write-Host "ERROR: JDK not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "JDK may not have been installed properly." -ForegroundColor Yellow
    Write-Host "Try installing manually:" -ForegroundColor Yellow
    Write-Host "  choco install temurin21 -y (as Administrator)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or download from: https://adoptium.net/temurin/releases/?version=21" -ForegroundColor Yellow
}

