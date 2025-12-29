# Configure existing JDK 21 installation
# JDK 21 and 25 are in C:\Program Files\Java

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuring Existing JDK Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Look for JDK 21 in C:\Program Files\Java
$javaPath = "C:\Program Files\Java"
$jdk21Path = $null
$jdk25Path = $null

if (Test-Path $javaPath) {
    Write-Host "Searching in: $javaPath" -ForegroundColor Yellow
    
    # Find JDK 21 (preferred for React Native 0.75.4)
    $jdk21Dirs = Get-ChildItem $javaPath -Directory -ErrorAction SilentlyContinue | 
        Where-Object { $_.Name -like "*jdk-21*" -or $_.Name -like "*jdk21*" -or $_.Name -like "*21*" } |
        Sort-Object Name -Descending
    
    # Find JDK 25 (backup option)
    $jdk25Dirs = Get-ChildItem $javaPath -Directory -ErrorAction SilentlyContinue | 
        Where-Object { $_.Name -like "*jdk-25*" -or $_.Name -like "*jdk25*" -or $_.Name -like "*25*" } |
        Sort-Object Name -Descending
    
    # Prefer JDK 21, but use JDK 25 if 21 not found
    if ($jdk21Dirs) {
        foreach ($dir in $jdk21Dirs) {
            $javaExe = "$($dir.FullName)\bin\java.exe"
            if (Test-Path $javaExe) {
                $jdk21Path = $dir.FullName
                Write-Host "Found JDK 21 at: $jdk21Path" -ForegroundColor Green
                break
            }
        }
    }
    
    if (-not $jdk21Path -and $jdk25Dirs) {
        foreach ($dir in $jdk25Dirs) {
            $javaExe = "$($dir.FullName)\bin\java.exe"
            if (Test-Path $javaExe) {
                $jdk25Path = $dir.FullName
                Write-Host "Found JDK 25 at: $jdk25Path" -ForegroundColor Green
                Write-Host "Note: JDK 25 is newer than required (17-20), but should work" -ForegroundColor Yellow
                break
            }
        }
    }
    
    # Use JDK 21 if available, otherwise JDK 25
    $selectedJdk = if ($jdk21Path) { $jdk21Path } else { $jdk25Path }
    
    if ($selectedJdk) {
        Write-Host ""
        Write-Host "Configuring Java..." -ForegroundColor Cyan
        
        # Set JAVA_HOME
        Write-Host "Setting JAVA_HOME..." -ForegroundColor Yellow
        [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $selectedJdk, "User")
        $env:JAVA_HOME = $selectedJdk
        Write-Host "JAVA_HOME = $selectedJdk" -ForegroundColor Green
        
        # Add to PATH
        Write-Host "Adding Java to PATH..." -ForegroundColor Yellow
        $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
        $javaBinPath = "$selectedJdk\bin"
        
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
        & "$javaBinPath\java.exe" -version
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Configuration Complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Java has been configured:" -ForegroundColor Cyan
        Write-Host "  JAVA_HOME = $selectedJdk" -ForegroundColor White
        Write-Host "  PATH includes: $javaBinPath" -ForegroundColor White
        Write-Host ""
        Write-Host "IMPORTANT: Close and reopen PowerShell for changes to take effect!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "After restarting, test with: java -version" -ForegroundColor Cyan
        Write-Host "Then run: .\fix-build-issues.ps1" -ForegroundColor Cyan
        Write-Host "Finally: npm run android" -ForegroundColor Cyan
        
    } else {
        Write-Host "ERROR: Could not find JDK 21 or 25 in $javaPath" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please check:" -ForegroundColor Yellow
        Write-Host "  1. JDK is installed in C:\Program Files\Java" -ForegroundColor White
        Write-Host "  2. Folder name contains '21' or '25'" -ForegroundColor White
        Write-Host ""
        Write-Host "Listing contents of C:\Program Files\Java:" -ForegroundColor Cyan
        Get-ChildItem $javaPath -Directory -ErrorAction SilentlyContinue | Select-Object Name
    }
    
} else {
    Write-Host "ERROR: C:\Program Files\Java does not exist" -ForegroundColor Red
    Write-Host "Please verify JDK is installed." -ForegroundColor Yellow
}

