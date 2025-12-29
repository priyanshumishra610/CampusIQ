# Metro Bundler Troubleshooting Guide

## Common Metro Issues & Solutions

### 1. Clear All Caches
```bash
# Stop Metro
killall node

# Clear Metro cache
npx react-native start --reset-cache

# Or manually:
rm -rf node_modules/.cache
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*

# Clear Watchman cache
watchman watch-del-all

# Clear npm cache (if needed)
npm cache clean --force
```

### 2. Port Already in Use
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use different port
npx react-native start --port 8082
```

### 3. Watchman Issues
```bash
# Install/Update Watchman
brew install watchman

# Reset Watchman
watchman shutdown-server
watchman watch-del-all
```

### 4. Node Modules Issues
```bash
# Clean install
rm -rf node_modules
rm package-lock.json
npm install
```

### 5. Metro Config Issues
Check `metro.config.js` is properly configured. Current config:
```javascript
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const config = {};
module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

### 6. Restart Metro with Clean State
```bash
# Complete reset
killall node
rm -rf node_modules/.cache
watchman watch-del-all
npx react-native start --reset-cache
```

### 7. Check for Syntax Errors
```bash
# Lint check
npm run lint

# Type check
npx tsc --noEmit
```

### 8. Android-Specific Issues
```bash
# Clear Android build cache
cd android
./gradlew clean
cd ..

# Rebuild
npm run android
```

### 9. iOS-Specific Issues
```bash
# Clear iOS build cache
cd ios
rm -rf Pods
rm Podfile.lock
pod install
cd ..
```

### 10. Check Metro Logs
```bash
# Run Metro with verbose logging
npx react-native start --verbose

# Check for specific errors in terminal
```

## Quick Fix Commands

**Complete Reset:**
```bash
cd /Users/priyanshumishra/Documents/CRM/CampusIQ
killall node
rm -rf node_modules/.cache
rm -rf /tmp/metro-*
watchman watch-del-all
npx react-native start --reset-cache
```

**If still having issues:**
```bash
# Full clean reinstall
rm -rf node_modules
npm install
npx react-native start --reset-cache
```

## Common Error Messages

### "Unable to resolve module"
- Clear cache and reinstall: `rm -rf node_modules && npm install`
- Check `package.json` dependencies

### "Metro bundler has encountered an error"
- Check for syntax errors in your code
- Clear all caches
- Restart Metro with `--reset-cache`

### "Port 8081 already in use"
- Kill existing process: `lsof -ti:8081 | xargs kill -9`
- Or use different port: `npx react-native start --port 8082`

### "Watchman error"
- Install/update Watchman: `brew install watchman`
- Reset: `watchman shutdown-server && watchman watch-del-all`

## Still Having Issues?

1. Check React Native version compatibility
2. Verify all dependencies are installed
3. Check for TypeScript errors
4. Review recent code changes
5. Check device/emulator connection



