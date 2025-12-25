# Firebase Setup Guide for CampusIQ

This guide will help you complete the Firebase configuration for the CampusIQ React Native app.

## Prerequisites

1. A Firebase project created at [Firebase Console](https://console.firebase.google.com/)
2. Node.js and React Native development environment set up
3. Android Studio (for Android) and Xcode (for iOS)

## Step 1: Get Firebase Configuration Files

### For Android:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the Android icon to add an Android app
4. Enter package name: `com.campusiq`
5. Download the `google-services.json` file
6. Replace the template file at: `android/app/google-services.json`

### For iOS:

1. In Firebase Console, click the iOS icon to add an iOS app
2. Enter bundle ID: `com.campusiq`
3. Download the `GoogleService-Info.plist` file
4. Replace the template file at: `ios/CRM/GoogleService-Info.plist`
5. **Important**: Open the project in Xcode and ensure `GoogleService-Info.plist` is added to the project:
   - Right-click on the `CRM` folder in Xcode
   - Select "Add Files to CRM..."
   - Select `GoogleService-Info.plist`
   - Check "Copy items if needed"
   - Ensure it's added to the CRM target

## Step 2: Verify Android Configuration

### Check `android/build.gradle`:
```gradle
dependencies {
    classpath("com.google.gms:google-services:4.3.15")
}
```
✅ Already configured

### Check `android/app/build.gradle`:
```gradle
apply plugin: "com.google.gms.google-services"
```
✅ Already configured

### Verify `android/app/google-services.json`:
- File exists: ✅
- Package name matches: `com.campusiq` ✅

## Step 3: Verify iOS Configuration

### Check Bundle ID:
- Bundle ID: `com.campusiq` ✅ (Updated to match Android)

### Verify `ios/CRM/GoogleService-Info.plist`:
- File exists: ✅
- Bundle ID matches: `com.campusiq` ✅

### Install iOS Dependencies:
```bash
cd ios
pod install
cd ..
```

## Step 4: Clean and Rebuild

### Reset Metro Cache:
```bash
npx react-native start --reset-cache
```

### Rebuild Android:
```bash
npx react-native run-android
```

### Rebuild iOS:
```bash
npx react-native run-ios
```

## Step 5: Verify Firebase Services

The app uses the following Firebase services:
- ✅ **Firestore** - Database
- ✅ **Auth** - Authentication
- ✅ **Functions** - Cloud Functions
- ✅ **Messaging** - Push Notifications

All services are initialized in `src/services/firebase.ts`.

## Troubleshooting

### Error: "Firebase not configured"
- Ensure `google-services.json` exists in `android/app/`
- Ensure `GoogleService-Info.plist` exists in `ios/CRM/`
- Verify package name/bundle ID matches Firebase console
- Clean build folders: `cd android && ./gradlew clean && cd ..`
- Reset Metro cache: `npx react-native start --reset-cache`

### Android Build Errors:
- Ensure Google Services plugin is applied in `android/app/build.gradle`
- Ensure Google Services classpath is in `android/build.gradle`
- Clean build: `cd android && ./gradlew clean`

### iOS Build Errors:
- Ensure `GoogleService-Info.plist` is added to Xcode project
- Run `pod install` in `ios/` directory
- Clean build folder in Xcode: Product → Clean Build Folder

### Firebase Services Not Working:
- Verify Firebase project has the required services enabled:
  - Firestore Database
  - Authentication
  - Cloud Functions
  - Cloud Messaging
- Check Firebase console for API keys and configuration

## Configuration Files Status

- ✅ `android/build.gradle` - Google Services plugin added
- ✅ `android/app/build.gradle` - Google Services plugin applied
- ✅ `android/app/google-services.json` - Template created (needs your Firebase config)
- ✅ `ios/CRM/GoogleService-Info.plist` - Template created (needs your Firebase config)
- ✅ `ios/CRM.xcodeproj/project.pbxproj` - Bundle ID updated to `com.campusiq`
- ✅ `src/services/firebase.ts` - Firebase services initialized correctly

## Next Steps

1. **Download your Firebase configuration files** from Firebase Console
2. **Replace the template files** with your actual configuration
3. **Add GoogleService-Info.plist to Xcode** project
4. **Run `pod install`** in the iOS directory
5. **Clean and rebuild** the app
6. **Test Firebase services** - The app should launch without Firebase errors

## Verification

After completing the setup, the app should:
- Launch without "Firebase not configured" error
- Successfully initialize Firebase services
- Connect to Firestore, Auth, Functions, and Messaging

If you see "Firebase Configured!" message (temporarily added), Firebase is working correctly.


