# CampusIQ QA Testing Guide - Pre-Production Verification

## Overview
This guide provides a comprehensive testing checklist for the CampusIQ React Native app before final production push. All tests should be performed with instrumentation logging enabled.

## Prerequisites

### 1. Environment Setup
- [ ] Verify `.env` file exists in `/CampusIQ/` directory
- [ ] Check required environment variables:
  - `GEMINI_API_KEY` (or `OPENAI_API_KEY`)
  - `AI_PROVIDER` (gemini|openai|mock)
  - `FCM_SERVER_KEY` (for push notifications)
  - `GOOGLE_MAPS_API_KEY` (configured in AndroidManifest.xml and iOS Info.plist)
- [ ] Verify Firebase configuration:
  - `android/app/google-services.json` exists
  - `ios/CRM/GoogleService-Info.plist` exists
- [ ] Check device/emulator authorization:
  ```bash
  # Android
  adb devices
  
  # iOS (check Xcode simulator)
  ```

### 2. Metro Bundler Setup
- [ ] Start Metro on port 8082:
  ```bash
  cd CampusIQ
  npx react-native start --port 8082
  ```
- [ ] For Android, reverse port if needed:
  ```bash
  adb reverse tcp:8082 tcp:8082
  ```

## Testing Checklist

### Phase 1: Build & Launch ✅

#### Android Build
```bash
cd CampusIQ
npx react-native run-android --port 8082
```

**Verification:**
- [ ] App builds successfully without errors
- [ ] App launches on device/emulator
- [ ] Splash screen displays correctly (CampusIQ logo with "IQ" text)
- [ ] App transitions from splash to login/auth screen
- [ ] No crashes on launch
- [ ] Check debug.log for initialization logs

#### iOS Build (Mac only)
```bash
cd CampusIQ/ios
pod install
cd ..
npx react-native run-ios
```

**Verification:**
- [ ] Pods install successfully
- [ ] App builds without errors
- [ ] App launches on simulator
- [ ] Splash screen displays correctly
- [ ] No crashes on launch

---

### Phase 2: Authentication & Roles ✅

#### Test Login for Each Role

**STUDENT Role:**
- [ ] Login with student credentials
- [ ] Verify navigation to Student portal
- [ ] Check sidebar displays student-specific menu items
- [ ] Verify student permissions (no admin access)
- [ ] Test logout functionality

**FACULTY Role:**
- [ ] Login with faculty credentials
- [ ] Verify navigation to Faculty portal
- [ ] Check sidebar displays faculty-specific menu items
- [ ] Verify faculty permissions (attendance, assignments, analytics)
- [ ] Test logout functionality

**ADMIN Role (with adminRole):**
- [ ] Login with admin credentials (REGISTRAR, DEAN, DIRECTOR, EXECUTIVE)
- [ ] Verify navigation to Admin portal
- [ ] Check sidebar displays admin-specific menu items
- [ ] Verify role-based permissions:
  - REGISTRAR: Can create tasks, exams, view reports
  - DEAN: Can close tasks, escalate, view analytics
  - DIRECTOR: Full permissions (create, delete, manage)
  - EXECUTIVE: Read-only access
- [ ] Test logout functionality

**SUPPORT Role:**
- [ ] Login with support credentials
- [ ] Verify navigation to Support portal
- [ ] Check sidebar displays support-specific menu items
- [ ] Verify ticket management permissions
- [ ] Test logout functionality

**SECURITY Role:**
- [ ] Login with security credentials
- [ ] Verify navigation to Security portal
- [ ] Check sidebar displays security-specific menu items
- [ ] Verify SOS alerts and geofence permissions
- [ ] Test logout functionality

#### Access Control Testing
- [ ] Attempt to access restricted features per role
- [ ] Verify access control works (restricted features hidden/disabled)
- [ ] Test navigation guards (cannot navigate to unauthorized screens)

---

### Phase 3: Student Portal ✅

#### TimetableScreen
- [ ] Navigate to Timetable tab
- [ ] Verify current classes display correctly
- [ ] Check upcoming classes are shown
- [ ] Verify class times and locations
- [ ] Test date navigation (if applicable)

#### Exams Timeline
- [ ] Navigate to Exams Timeline screen
- [ ] Verify CT (Class Test) exams display
- [ ] Verify semester exams display
- [ ] Check exam dates and times
- [ ] Verify exam status (upcoming, completed, results)

#### Notification Center
- [ ] Navigate to Notification Center
- [ ] Verify notifications are visible
- [ ] Check real-time updates (if notifications arrive)
- [ ] Test notification interactions (tap to view details)
- [ ] Verify notification badges/counts

#### Health & Wellbeing
- [ ] Navigate to Health & Wellbeing section
- [ ] Test mental health check functionality
- [ ] Verify SOS alert trigger works
- [ ] Check SOS alert sends notification/alert
- [ ] Verify health data displays correctly

---

### Phase 4: Faculty Portal ✅

#### AttendanceManagementScreen
- [ ] Navigate to Attendance tab
- [ ] Test individual attendance marking
- [ ] Test bulk attendance marking
- [ ] Verify attendance status saves correctly
- [ ] Check attendance history displays
- [ ] Verify attendance statistics/percentages

#### AssignmentsManagementScreen
- [ ] Navigate to Assignments tab
- [ ] Test creating new assignment
- [ ] Test publishing assignment
- [ ] Verify assignment appears in student view
- [ ] Test viewing submissions
- [ ] Test grading submissions
- [ ] Verify assignment status updates

#### ClassIntelligenceScreen
- [ ] Navigate to Analytics tab
- [ ] Verify class metrics display
- [ ] Check at-risk students list
- [ ] Verify engagement insights
- [ ] Test data visualization (charts/graphs)
- [ ] Check performance trends

#### AI Teaching Assistant
- [ ] Navigate to AI Teaching Assistant (if available)
- [ ] Test asking questions
- [ ] Verify mock responses appear
- [ ] Check loading states display correctly
- [ ] Verify response formatting

---

### Phase 5: Admin Portal ✅

#### ExecutiveDashboard
- [ ] Navigate to Dashboard tab
- [ ] Verify metrics display correctly:
  - Campus health score
  - Attendance averages
  - Task counts
  - Exam statistics
- [ ] Check predictive analytics section
- [ ] Verify alert colors (red/yellow/green) display correctly
- [ ] Test layout responsiveness (mobile/tablet)
- [ ] Check data refresh functionality

#### AI Admin Copilot
- [ ] Navigate to AI Admin Copilot (if available)
- [ ] Test asking questions
- [ ] Verify actionable recommendations visible
- [ ] Check loading states
- [ ] Verify response quality

#### Maps Features
- [ ] Navigate to Campus Map tab
- [ ] Verify campus view loads
- [ ] Test geofencing:
  - Enter restricted zone → verify alert triggers
  - Exit restricted zone → verify alert clears
- [ ] Test emergency mode:
  - Activate emergency mode
  - Verify routing works
  - Check nearest facilities highlighted
- [ ] Test heatmap:
  - Enable heatmap view
  - Verify heatmap data displays
- [ ] Test nearest facility finder
- [ ] Verify map markers display correctly

---

### Phase 6: Support & Security Portals ✅

#### Support Portal
- [ ] Navigate to Support Dashboard
- [ ] Test creating support ticket
- [ ] Verify SLA timers display correctly
- [ ] Test adding comments to tickets
- [ ] Verify workflow updates (status changes)
- [ ] Test ticket assignment
- [ ] Check ticket filtering/sorting

#### Security Portal
- [ ] Navigate to Security Dashboard
- [ ] Test SOS alerts:
  - Trigger SOS alert
  - Verify alert appears in dashboard
  - Check alert details
- [ ] Test geofence breach detection:
  - Simulate breach
  - Verify alert triggers
- [ ] Test location tracking:
  - Verify student locations display
  - Check location updates in real-time
- [ ] Test incident reporting

---

### Phase 7: AI Components ✅

#### Test All AI Hooks
- [ ] **AICampusAssistant** (`useAICampusAssistant`):
  - Test query functionality
  - Verify mock responses display
  - Check loading indicators

- [ ] **AIAcademicAdvisor** (`useAIAcademicAdvisor`):
  - Test advice generation
  - Verify responses for different topics
  - Check loading states

- [ ] **AITeachingAssistant** (`useAITeachingAssistant`):
  - Test suggestion generation
  - Verify responses for different types
  - Check loading states

- [ ] **AIAdminCopilot** (`useAIAdminCopilot`):
  - Test insight generation
  - Verify responses for different actions
  - Check loading states

#### AI Service Health
- [ ] Verify AI service health check works
- [ ] Test fallback to mock when API keys missing
- [ ] Verify error handling for API failures

---

### Phase 8: UI & UX ✅

#### Navigation
- [ ] Test all navigation flows:
  - Tab navigation
  - Stack navigation
  - Drawer/sidebar navigation
- [ ] Verify smooth transitions
- [ ] Check back button behavior
- [ ] Test deep linking (if implemented)

#### Animations
- [ ] Verify minimal animations feel premium
- [ ] Check loading animations
- [ ] Test screen transitions
- [ ] Verify no janky animations

#### Design Consistency
- [ ] Check color scheme consistency:
  - Primary colors (#1e3a5f)
  - Accent colors (#64b5f6)
  - Background colors
- [ ] Verify typography consistency:
  - Font sizes
  - Font weights
  - Line heights
- [ ] Check icon consistency (MaterialIcons)
- [ ] Verify sidebar styling across all roles

#### Responsiveness
- [ ] Test on mobile devices (various screen sizes)
- [ ] Test on tablets (if supported)
- [ ] Verify layout adapts correctly
- [ ] Check text scaling
- [ ] Verify touch targets are adequate

---

### Phase 9: Performance & Error Handling ✅

#### Offline Mode
- [ ] Test app behavior with network disabled
- [ ] Verify cached data displays
- [ ] Check error messages for offline state
- [ ] Test reconnection handling

#### ErrorBoundary
- [ ] Trigger intentional errors
- [ ] Verify ErrorBoundary catches exceptions
- [ ] Check error UI displays correctly
- [ ] Test error recovery (retry button)

#### Crash Testing
- [ ] Test rapid navigation
- [ ] Test rapid button taps
- [ ] Test with slow network
- [ ] Test with invalid data
- [ ] Verify no crashes occur

#### Console Errors
- [ ] Monitor console for errors during testing
- [ ] Check for warnings
- [ ] Verify no critical errors
- [ ] Check debug.log for issues

---

### Phase 10: Notifications & FCM ✅

#### Push Notifications
- [ ] Test push notification registration
- [ ] Verify device token stored in Firestore
- [ ] Test receiving push notifications:
  - Android: Verify notification appears
  - iOS: Verify notification appears
- [ ] Test notification tap behavior
- [ ] Verify notification data handling

#### In-App Notifications
- [ ] Test notification center updates
- [ ] Verify notification badges
- [ ] Check notification read/unread states

---

### Phase 11: Maps & Geo-fence ✅

#### Restricted Zones
- [ ] Test entering restricted zone
- [ ] Verify alert triggers correctly
- [ ] Check alert severity levels
- [ ] Test exiting restricted zone
- [ ] Verify alert clears

#### Emergency Mode
- [ ] Activate emergency mode
- [ ] Verify routing to nearest facility
- [ ] Check nearest facilities highlighted
- [ ] Test emergency location markers
- [ ] Verify emergency UI changes

#### Heatmap
- [ ] Enable event footfall heatmap
- [ ] Enable library density heatmap
- [ ] Verify heatmap data displays
- [ ] Check heatmap performance

---

### Phase 12: Logging & Reporting ✅

#### Debug Logs
- [ ] Check `/Users/priyanshumishra/Documents/CRM/.cursor/debug.log`
- [ ] Verify logs capture:
  - App initialization
  - Authentication flows
  - Navigation events
  - Error occurrences
  - Feature usage
- [ ] Analyze log patterns for issues

#### Error Reporting
- [ ] List all errors encountered
- [ ] List all warnings
- [ ] Document broken flows
- [ ] Note visual/UI glitches

#### Performance Metrics
- [ ] Measure app launch time
- [ ] Measure screen load times
- [ ] Check memory usage
- [ ] Monitor network requests

---

## Final Verification Checklist

### Pre-Production Readiness
- [ ] All critical features tested and working
- [ ] No blocking bugs found
- [ ] ErrorBoundary catches all errors
- [ ] Navigation works smoothly
- [ ] Role-based access control verified
- [ ] All portals functional
- [ ] AI components working (mock or real)
- [ ] Maps and geofencing operational
- [ ] Notifications working
- [ ] UI/UX polished and consistent
- [ ] Performance acceptable
- [ ] No console errors in production build

### Documentation
- [ ] All test results documented
- [ ] Known issues listed
- [ ] Improvement suggestions noted
- [ ] Final summary report created

---

## Test Accounts

Create test accounts for each role:
- **Student**: `student@test.campusiq.edu` / `password123`
- **Faculty**: `faculty@test.campusiq.edu` / `password123`
- **Admin (Registrar)**: `registrar@test.campusiq.edu` / `password123`
- **Admin (Dean)**: `dean@test.campusiq.edu` / `password123`
- **Admin (Director)**: `director@test.campusiq.edu` / `password123`
- **Admin (Executive)**: `executive@test.campusiq.edu` / `password123`
- **Support**: `support@test.campusiq.edu` / `password123`
- **Security**: `security@test.campusiq.edu` / `password123`

---

## Running Tests

1. **Clear previous logs:**
   ```bash
   rm /Users/priyanshumishra/Documents/CRM/.cursor/debug.log
   ```

2. **Start Metro:**
   ```bash
   cd CampusIQ
   npx react-native start --port 8082
   ```

3. **Run Android build:**
   ```bash
   npx react-native run-android --port 8082
   ```

4. **Run iOS build (Mac):**
   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios
   ```

5. **Monitor logs:**
   ```bash
   tail -f /Users/priyanshumishra/Documents/CRM/.cursor/debug.log
   ```

---

## Reporting Issues

When reporting issues, include:
1. **Role**: Which user role was being tested
2. **Screen**: Which screen/feature
3. **Steps**: Detailed reproduction steps
4. **Expected**: What should happen
5. **Actual**: What actually happened
6. **Logs**: Relevant log entries from debug.log
7. **Screenshots**: If applicable

---

## Success Criteria

The app is production-ready if:
- ✅ All portals load and function correctly
- ✅ All roles can authenticate and navigate properly
- ✅ ✅ Role-based permissions work correctly
- ✅ No critical bugs or crashes
- ✅ ErrorBoundary catches all errors gracefully
- ✅ Performance is acceptable
- ✅ UI/UX is polished and consistent
- ✅ All core features work as expected

---

**Last Updated**: Pre-Production QA Pass
**Version**: 1.0.0

