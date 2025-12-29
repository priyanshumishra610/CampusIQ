# QA Issue Diagnosis Guide

## Current Status
The debug log file is not being created, which suggests one of these scenarios:

1. **App crashes during bundling** - Before JavaScript code runs
2. **Module resolution error** - Logger import fails
3. **App crashes immediately on startup** - Before logs can be written
4. **Network issue** - Fetch calls to logging server fail silently

## What to Check

### 1. Metro Console Output
Check the Metro bundler console for:
- Red error messages
- Module not found errors
- TypeScript compilation errors
- `[QA-DEBUG]` or `[QA-ERROR]` prefixed messages

### 2. Device/Emulator Logs
For Android:
```bash
adb logcat | grep -i "react\|error\|exception"
```

For iOS:
Check Xcode console or:
```bash
xcrun simctl spawn booted log stream --level=error
```

### 3. Common Issues to Look For

#### Module Resolution Errors
- `Unable to resolve module './app/utils/debugLogger'`
- `Cannot find module`
- Check if file exists: `ls -la app/utils/debugLogger.ts`

#### Firebase Initialization Errors
- `Firebase is not configured`
- Missing `google-services.json` or `GoogleService-Info.plist`
- Check Firebase setup

#### Navigation Errors
- `NavigationContainer` errors
- Route not found errors
- Check navigation setup

#### Redux Errors
- Store initialization errors
- Action dispatch errors
- Check Redux store setup

## Next Steps

1. **Share Metro Console Output**: Copy the last 50-100 lines from Metro console
2. **Share Device Logs**: If available, share device/emulator logs
3. **Describe the Issue**: What exactly happens when you run the app?
   - Does it build successfully?
   - Does it launch?
   - Does it show a splash screen?
   - Does it crash immediately?
   - What error message appears?

## Debugging Commands

```bash
# Check if logger file exists
ls -la app/utils/debugLogger.ts

# Check Metro cache
cd CampusIQ
npx react-native start --reset-cache

# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors
npm run lint

# Clear all caches and rebuild
cd CampusIQ
rm -rf node_modules
npm install
cd ios && pod install && cd ..
npx react-native start --reset-cache
```

## Expected Behavior

When the app runs successfully, you should see in Metro console:
```
[QA-DEBUG] App.tsx:Root: Root App component mounted
[QA-DEBUG] App.tsx:Root: Redux store accessed
[QA-DEBUG] App.tsx:73: Firebase readiness check started
[QA-DEBUG] App.tsx:82: Firebase readiness check result
[QA-DEBUG] App.tsx:162: App boot state check
[QA-DEBUG] App.tsx:171: App boot state set to ready
[QA-DEBUG] App.tsx:Root: NavigationContainer ready
[QA-DEBUG] App.tsx:94: App bootstrap started
[QA-DEBUG] App.tsx:96: Initializing auth listener
```

If you don't see these messages, the app is likely crashing before reaching that code.

