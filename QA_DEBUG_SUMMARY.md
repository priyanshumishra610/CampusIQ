# CampusIQ QA Debug Session Summary

## Overview
This document summarizes the instrumentation and testing setup for the comprehensive QA pass on the CampusIQ React Native app.

## Instrumentation Added

### 1. App Initialization Logging
**Location**: `app/App.tsx`

**Hypotheses Tested**:
- **Hypothesis A**: Firebase initialization may fail silently
- **Hypothesis B**: Auth listener initialization may fail
- **Hypothesis C**: Boot state transitions may not work correctly

**Logs Added**:
- Firebase readiness check start/result
- App bootstrap start
- Auth listener initialization
- Boot state transitions

### 2. Authentication Flow Logging
**Location**: `app/screens/Auth/LoginScreen.tsx`, `app/redux/slices/authSlice.ts`

**Hypotheses Tested**:
- **Hypothesis D**: Login flow may fail at various stages (Firebase auth, profile fetch, token registration)

**Logs Added**:
- Login attempt start
- Firebase auth call
- User profile fetch
- Profile loaded with role information
- Login failures

### 3. Navigation Logging
**Location**: `app/navigation/RootNavigator.tsx`

**Hypotheses Tested**:
- **Hypothesis E**: Navigation routing may fail based on user role

**Logs Added**:
- Navigation initialization
- User authentication state
- Role-based routing decisions
- Unknown role handling

### 4. Error Boundary Logging
**Location**: `app/components/Common/ErrorBoundary.tsx`

**Hypotheses Tested**:
- **Hypothesis F**: Errors may not be caught by ErrorBoundary

**Logs Added**:
- Error caught by ErrorBoundary
- Error message and stack trace
- Component stack information

## Debug Log Configuration

- **Log Path**: `/Users/priyanshumishra/Documents/CRM/.cursor/debug.log`
- **Server Endpoint**: `http://127.0.0.1:7243/ingest/f3f772a9-b4fc-46ea-b36f-fcf30affbe13`
- **Format**: NDJSON (one JSON object per line)
- **Session ID**: `qa-debug-session`
- **Run ID**: `run1`

## Testing Resources Created

### 1. QA Testing Guide
**File**: `QA_TESTING_GUIDE.md`

Comprehensive testing checklist covering:
- Environment setup
- Build & launch procedures
- Authentication & roles testing
- All portal features (Student, Faculty, Admin, Support, Security)
- AI components
- UI/UX verification
- Performance & error handling
- Notifications & FCM
- Maps & geofencing

### 2. QA Testing Script
**File**: `run-qa-tests.sh`

Automated script that:
- Clears previous debug logs
- Checks environment configuration
- Verifies Firebase setup
- Checks device connections
- Installs dependencies if needed
- Provides options to start Metro, build apps, or monitor logs

## How to Run QA Tests

### Quick Start

1. **Run the QA setup script**:
   ```bash
   cd CampusIQ
   ./run-qa-tests.sh
   ```
   Select option 5 for full setup.

2. **Or manually**:
   ```bash
   # Clear logs
   rm /Users/priyanshumishra/Documents/CRM/.cursor/debug.log
   
   # Start Metro
   npx react-native start --port 8082
   
   # In another terminal, run Android
   adb reverse tcp:8082 tcp:8082
   npx react-native run-android --port 8082
   
   # Monitor logs
   tail -f /Users/priyanshumishra/Documents/CRM/.cursor/debug.log
   ```

### Testing Workflow

1. **Clear logs before each test run**:
   ```bash
   rm /Users/priyanshumishra/Documents/CRM/.cursor/debug.log
   ```

2. **Start the app** (Android or iOS)

3. **Perform tests** following `QA_TESTING_GUIDE.md`

4. **Monitor logs** in real-time:
   ```bash
   tail -f /Users/priyanshumishra/Documents/CRM/.cursor/debug.log
   ```

5. **After testing**, read the log file:
   ```bash
   cat /Users/priyanshumishra/Documents/CRM/.cursor/debug.log
   ```

## Log Analysis

### What to Look For

1. **Initialization Issues**:
   - Firebase readiness failures
   - Auth listener failures
   - Boot state errors

2. **Authentication Issues**:
   - Login failures
   - Profile fetch errors
   - Role assignment problems

3. **Navigation Issues**:
   - Routing failures
   - Unknown role handling
   - Navigation state errors

4. **Error Boundary Issues**:
   - Uncaught errors
   - Error stack traces
   - Component stack information

### Log Entry Format

Each log entry contains:
```json
{
  "location": "file.tsx:line",
  "message": "Description",
  "data": {
    "key": "value"
  },
  "timestamp": 1234567890,
  "sessionId": "qa-debug-session",
  "runId": "run1",
  "hypothesisId": "A"
}
```

## Expected Test Results

### Pass Criteria
- ✅ App launches successfully
- ✅ All roles can authenticate
- ✅ Navigation works for all roles
- ✅ All portals load correctly
- ✅ No critical errors in logs
- ✅ ErrorBoundary catches errors gracefully
- ✅ Performance is acceptable

### Common Issues to Watch For

1. **Firebase Configuration**:
   - Missing `google-services.json` or `GoogleService-Info.plist`
   - Incorrect Firebase project configuration

2. **Environment Variables**:
   - Missing API keys (Gemini, OpenAI, FCM)
   - Incorrect `.env` file location

3. **Navigation Issues**:
   - Role-based routing failures
   - Sidebar navigation problems

4. **Permission Issues**:
   - Role permissions not working
   - Access control failures

## Next Steps

1. **Run the QA tests** following `QA_TESTING_GUIDE.md`
2. **Monitor logs** during testing
3. **Document findings** in the testing guide
4. **Report issues** with log evidence
5. **Fix critical issues** before production push

## Removing Instrumentation

After successful QA pass and issue resolution:

1. Remove all `// #region agent log` blocks
2. Remove all `// #endregion` blocks
3. Remove all `fetch('http://127.0.0.1:7243/...')` calls
4. Test app again to ensure no broken functionality

**Note**: Do NOT remove instrumentation until:
- All tests pass
- All issues are resolved
- User confirms app is production-ready

---

**Session Started**: Pre-Production QA Pass
**Instrumentation Version**: 1.0.0
**Status**: Ready for Testing

