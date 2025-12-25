# Firebase Setup Script for CampusIQ
# This script helps you set up Firebase for the CampusIQ React Native app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Firebase Setup for CampusIQ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Firebase CLI
Write-Host "Step 1: Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseCliInstalled = $false
try {
    $firebaseVersion = firebase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $firebaseCliInstalled = $true
        Write-Host "  ✓ Firebase CLI installed: $firebaseVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Firebase CLI not found" -ForegroundColor Yellow
}

if (-not $firebaseCliInstalled) {
    Write-Host ""
    Write-Host "Firebase CLI is not installed. Install it with:" -ForegroundColor Yellow
    Write-Host "  npm install -g firebase-tools" -ForegroundColor Cyan
    Write-Host ""
    $install = Read-Host "Would you like to install Firebase CLI now? (y/n)"
    if ($install -eq "y" -or $install -eq "Y") {
        Write-Host "Installing Firebase CLI..." -ForegroundColor Yellow
        npm install -g firebase-tools
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Firebase CLI installed successfully" -ForegroundColor Green
            $firebaseCliInstalled = $true
        } else {
            Write-Host "  ✗ Failed to install Firebase CLI" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Step 2: Check Firebase project initialization
Write-Host "Step 2: Checking Firebase project initialization..." -ForegroundColor Yellow
$firebaseInitialized = $false
if (Test-Path ".firebaserc") {
    $firebaseInitialized = $true
    Write-Host "  ✓ Firebase project initialized (.firebaserc found)" -ForegroundColor Green
    try {
        $firebaseConfig = Get-Content ".firebaserc" | ConvertFrom-Json
        if ($firebaseConfig.projects) {
            Write-Host "  Project ID: $($firebaseConfig.projects.default)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "  ⚠ .firebaserc exists but could not be parsed" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ Firebase project not initialized" -ForegroundColor Yellow
    Write-Host ""
    if ($firebaseCliInstalled) {
        Write-Host "Would you like to initialize Firebase now?" -ForegroundColor Yellow
        Write-Host "This will:" -ForegroundColor White
        Write-Host "  1. Log you into Firebase (opens browser)" -ForegroundColor Cyan
        Write-Host "  2. Initialize Firestore, Functions, and Hosting" -ForegroundColor Cyan
        Write-Host ""
        $init = Read-Host "Initialize Firebase? (y/n)"
        if ($init -eq "y" -or $init -eq "Y") {
            Write-Host ""
            Write-Host "Logging into Firebase..." -ForegroundColor Yellow
            firebase login
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "Initializing Firebase project..." -ForegroundColor Yellow
                Write-Host "When prompted, select:" -ForegroundColor Cyan
                Write-Host "  - Firestore: Yes" -ForegroundColor White
                Write-Host "  - Functions: Yes" -ForegroundColor White
                Write-Host "  - Hosting: Yes (optional)" -ForegroundColor White
                Write-Host "  - Use existing project or create new" -ForegroundColor White
                Write-Host ""
                firebase init
                if ($LASTEXITCODE -eq 0 -and (Test-Path ".firebaserc")) {
                    $firebaseInitialized = $true
                    Write-Host "  ✓ Firebase initialized successfully" -ForegroundColor Green
                }
            }
        }
    } else {
        Write-Host "To initialize Firebase:" -ForegroundColor Yellow
        Write-Host "  1. Install Firebase CLI: npm install -g firebase-tools" -ForegroundColor Cyan
        Write-Host "  2. Run: firebase login" -ForegroundColor Cyan
        Write-Host "  3. Run: firebase init" -ForegroundColor Cyan
        Write-Host "  4. Select: Firestore, Functions, Hosting (if needed)" -ForegroundColor Cyan
    }
}

Write-Host ""

# Step 3: Check Android configuration file
Write-Host "Step 3: Checking Android configuration..." -ForegroundColor Yellow
$androidConfigPath = "android/app/google-services.json"
$androidIsTemplate = $false
if (Test-Path $androidConfigPath) {
    try {
        $androidConfig = Get-Content $androidConfigPath | ConvertFrom-Json
        $androidIsTemplate = $androidConfig.project_info.project_id -eq "YOUR_PROJECT_ID" -or 
                      $androidConfig.project_info.project_number -eq "YOUR_PROJECT_NUMBER"
        
        if ($androidIsTemplate) {
            Write-Host "  ✗ google-services.json is a template (needs your Firebase config)" -ForegroundColor Red
            Write-Host ""
            Write-Host "  To fix:" -ForegroundColor Yellow
            Write-Host "  1. Go to https://console.firebase.google.com" -ForegroundColor Cyan
            Write-Host "  2. Select your project (or create a new one)" -ForegroundColor Cyan
            Write-Host "  3. Click the Android icon to add an Android app" -ForegroundColor Cyan
            Write-Host "  4. Enter package name: com.campusiq" -ForegroundColor Cyan
            Write-Host "  5. Download google-services.json" -ForegroundColor Cyan
            Write-Host "  6. Replace: $androidConfigPath" -ForegroundColor Cyan
        } else {
            Write-Host "  ✓ google-services.json configured" -ForegroundColor Green
            Write-Host "    Project ID: $($androidConfig.project_info.project_id)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "  ⚠ Could not parse google-services.json" -ForegroundColor Yellow
        $androidIsTemplate = $true
    }
} else {
    Write-Host "  ✗ google-services.json not found at $androidConfigPath" -ForegroundColor Red
    $androidIsTemplate = $true
}

Write-Host ""

# Step 4: Check iOS configuration file
Write-Host "Step 4: Checking iOS configuration..." -ForegroundColor Yellow
$iosConfigPath = "ios/CRM/GoogleService-Info.plist"
$iosIsTemplate = $false
if (Test-Path $iosConfigPath) {
    try {
        $iosConfigContent = Get-Content $iosConfigPath -Raw
        $iosIsTemplate = $iosConfigContent -match "YOUR_PROJECT_ID" -or $iosConfigContent -match "YOUR_PROJECT_NUMBER"
        
        if ($iosIsTemplate) {
            Write-Host "  ✗ GoogleService-Info.plist is a template (needs your Firebase config)" -ForegroundColor Red
            Write-Host ""
            Write-Host "  To fix:" -ForegroundColor Yellow
            Write-Host "  1. Go to https://console.firebase.google.com" -ForegroundColor Cyan
            Write-Host "  2. Select your project" -ForegroundColor Cyan
            Write-Host "  3. Click the iOS icon to add an iOS app" -ForegroundColor Cyan
            Write-Host "  4. Enter bundle ID: com.campusiq" -ForegroundColor Cyan
            Write-Host "  5. Download GoogleService-Info.plist" -ForegroundColor Cyan
            Write-Host "  6. Replace: $iosConfigPath" -ForegroundColor Cyan
            Write-Host "  7. Open Xcode and add the file to the project" -ForegroundColor Cyan
        } else {
            Write-Host "  ✓ GoogleService-Info.plist configured" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠ Could not parse GoogleService-Info.plist" -ForegroundColor Yellow
        $iosIsTemplate = $true
    }
} else {
    Write-Host "  ✗ GoogleService-Info.plist not found at $iosConfigPath" -ForegroundColor Red
    $iosIsTemplate = $true
}

Write-Host ""

# Step 5: Verify Gradle configuration
Write-Host "Step 5: Verifying Android Gradle configuration..." -ForegroundColor Yellow
$gradleRootPath = "android/build.gradle"
$gradleAppPath = "android/app/build.gradle"

$gradleRootOk = $false
$gradleAppOk = $false

if (Test-Path $gradleRootPath) {
    $gradleRootContent = Get-Content $gradleRootPath -Raw
    if ($gradleRootContent -match "com.google.gms:google-services") {
        $gradleRootOk = $true
        Write-Host "  ✓ Google Services plugin in root build.gradle" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Google Services plugin missing in root build.gradle" -ForegroundColor Red
    }
}

if (Test-Path $gradleAppPath) {
    $gradleAppContent = Get-Content $gradleAppPath -Raw
    if ($gradleAppContent -match "com.google.gms.google-services") {
        $gradleAppOk = $true
        Write-Host "  ✓ Google Services plugin applied in app build.gradle" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Google Services plugin not applied in app build.gradle" -ForegroundColor Red
    }
}

Write-Host ""

# Step 6: Check Firebase dependencies
Write-Host "Step 6: Checking Firebase dependencies..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $firebaseDeps = @(
        "@react-native-firebase/app",
        "@react-native-firebase/auth",
        "@react-native-firebase/firestore",
        "@react-native-firebase/functions",
        "@react-native-firebase/messaging"
    )
    
    $missingDeps = @()
    foreach ($dep in $firebaseDeps) {
        if ($packageJson.dependencies.PSObject.Properties.Name -contains $dep) {
            $version = $packageJson.dependencies.$dep
            Write-Host "  ✓ $dep ($version)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $dep (missing)" -ForegroundColor Red
            $missingDeps += $dep
        }
    }
    
    if ($missingDeps.Count -gt 0) {
        Write-Host ""
        Write-Host "Install missing dependencies with:" -ForegroundColor Yellow
        Write-Host "  npm install $($missingDeps -join ' ')" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ✗ package.json not found" -ForegroundColor Red
}

Write-Host ""

# Step 7: Check Firebase services setup
Write-Host "Step 7: Firebase Services Checklist" -ForegroundColor Yellow
Write-Host ""
Write-Host "Make sure these services are enabled in Firebase Console:" -ForegroundColor Yellow
Write-Host "  [ ] Authentication (Email/Password)" -ForegroundColor White
Write-Host "  [ ] Firestore Database" -ForegroundColor White
Write-Host "  [ ] Cloud Functions" -ForegroundColor White
Write-Host "  [ ] Cloud Messaging (FCM)" -ForegroundColor White
Write-Host ""
Write-Host "To enable services:" -ForegroundColor Yellow
Write-Host "  1. Go to https://console.firebase.google.com" -ForegroundColor Cyan
Write-Host "  2. Select your project" -ForegroundColor Cyan
Write-Host "  3. Navigate to each service in the left menu" -ForegroundColor Cyan
Write-Host "  4. Click 'Get Started' or 'Enable' for each service" -ForegroundColor Cyan

Write-Host ""

# Step 8: Check Firestore rules and indexes
Write-Host "Step 8: Checking Firestore configuration..." -ForegroundColor Yellow
if (Test-Path "firestore.rules") {
    Write-Host "  ✓ firestore.rules exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ firestore.rules not found" -ForegroundColor Yellow
}

if (Test-Path "firestore.indexes.json") {
    Write-Host "  ✓ firestore.indexes.json exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ firestore.indexes.json not found" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

if (-not $firebaseCliInstalled) {
    Write-Host "  ⚠ Install Firebase CLI: npm install -g firebase-tools" -ForegroundColor Yellow
    $allGood = $false
}

if (-not $firebaseInitialized) {
    Write-Host "  ⚠ Initialize Firebase: firebase login; firebase init" -ForegroundColor Yellow
    $allGood = $false
}

if ($androidIsTemplate -or -not (Test-Path $androidConfigPath)) {
    Write-Host "  ⚠ Download and replace google-services.json from Firebase Console" -ForegroundColor Yellow
    $allGood = $false
}

if ($iosIsTemplate -or -not (Test-Path $iosConfigPath)) {
    Write-Host "  ⚠ Download and replace GoogleService-Info.plist from Firebase Console" -ForegroundColor Yellow
    $allGood = $false
}

if ($allGood) {
    Write-Host "  ✓ Firebase setup looks good!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Enable Firebase services in Firebase Console" -ForegroundColor White
    Write-Host "     Open: https://console.firebase.google.com" -ForegroundColor Cyan
    Write-Host "  2. Deploy Firestore rules: firebase deploy --only firestore:rules" -ForegroundColor White
    Write-Host "  3. Install iOS dependencies: cd ios; pod install; cd .." -ForegroundColor White
    Write-Host "  4. Clean and rebuild: npm run android or npm run ios" -ForegroundColor White
    Write-Host ""
    $openConsole = Read-Host "Would you like to open Firebase Console now? (y/n)"
    if ($openConsole -eq "y" -or $openConsole -eq "Y") {
        Start-Process "https://console.firebase.google.com"
    }
} else {
    Write-Host ""
    Write-Host "Please complete the items marked with ⚠ above." -ForegroundColor Yellow
    Write-Host "See FIREBASE_SETUP.md for detailed instructions." -ForegroundColor Cyan
    Write-Host ""
    $openConsole = Read-Host "Would you like to open Firebase Console to download config files? (y/n)"
    if ($openConsole -eq "y" -or $openConsole -eq "Y") {
        Start-Process "https://console.firebase.google.com"
    }
}

Write-Host ""
Write-Host "For detailed instructions, see: FIREBASE_SETUP.md" -ForegroundColor Cyan
Write-Host ""

