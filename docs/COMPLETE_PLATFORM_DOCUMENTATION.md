# CampusIQ - Complete Platform Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Student Portal Guide](#student-portal-guide)
3. [Faculty Portal Guide](#faculty-portal-guide)
4. [Support Portal Guide](#support-portal-guide)
5. [Security Portal Guide](#security-portal-guide)
6. [AI Integration Guide](#ai-integration-guide)
7. [Design System](#design-system)
8. [API Reference](#api-reference)
9. [Deployment Guide](#deployment-guide)

---

## Architecture Overview

### Technology Stack
- **Framework**: React Native 0.75.4
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation 6
- **Backend**: Firebase (Firestore, Auth, Cloud Messaging)
- **Maps**: React Native Maps with Google Maps
- **AI**: Unified AI Gateway (Gemini/OpenAI compatible)

### Project Structure
```
app/
├── components/          # Reusable UI components
│   ├── Common/         # ErrorBoundary, SkeletonLoader, EmptyState
│   ├── AI/             # AI components
│   ├── Map/            # Map-related components
│   └── Task/           # Task components
├── screens/            # Screen components
│   ├── Student/        # Student portal screens
│   ├── Faculty/        # Faculty portal screens
│   ├── Admin/          # Admin portal screens
│   ├── Support/        # Support portal screens
│   └── Security/       # Security portal screens
├── services/           # Business logic services
│   ├── aiGateway.service.ts
│   ├── assignment.service.ts
│   ├── attendance.service.ts
│   └── ...
├── redux/              # Redux store and slices
├── navigation/         # Navigation configuration
├── theme/              # Design tokens
└── config/             # Configuration files
```

### Key Features
- Multi-role system (Student, Faculty, Admin, Support, Security)
- Role-based navigation and permissions
- Real-time data synchronization
- AI-powered insights and assistance
- Geo-fencing and location tracking
- Emergency response system
- Comprehensive analytics

---

## Student Portal Guide

### Overview
The Student Portal provides students with access to their academic information, assignments, attendance, exams, and AI-powered academic assistance.

### Key Screens

#### 1. Student Dashboard
- **Location**: `app/screens/Student/StudentDashboard.tsx`
- **Features**:
  - Quick stats (attendance, pending assignments, overdue)
  - Current/next class information
  - Quick actions
  - Recent announcements

#### 2. Performance Dashboard
- **Location**: `app/screens/Student/PerformanceDashboardScreen.tsx`
- **Features**:
  - Overall performance metrics
  - Attendance trend charts
  - Grades trend charts
  - Risk alerts
  - AI Academic Mentor integration

#### 3. Attendance Overview
- **Location**: `app/screens/Student/AttendanceOverviewScreen.tsx`
- **Features**:
  - Overall attendance percentage
  - Subject-wise attendance breakdown
  - Risk level indicators
  - Attendance statistics

#### 4. Assignments
- **Location**: `app/screens/Student/AssignmentsListScreen.tsx`
- **Features**:
  - List of all assignments
  - Status indicators (pending, overdue, submitted)
  - Due date tracking
  - Assignment submission

#### 5. Exams Timeline
- **Location**: `app/screens/Student/ExamsTimelineScreen.tsx`
- **Features**:
  - Upcoming exams
  - Completed exams
  - Days until exam calculation
  - Exam details and venue information

#### 6. Notification Center
- **Location**: `app/screens/Student/NotificationCenterScreen.tsx`
- **Features**:
  - Unified notification feed
  - Filter by all/unread
  - Notification types (announcement, assignment, exam, etc.)
  - Real-time updates

### Navigation
Access via bottom tabs:
- Home (Dashboard)
- Timetable
- Attendance
- Assignments
- Exams
- Announcements
- Profile

---

## Faculty Portal Guide

### Overview
The Faculty Portal enables faculty members to manage classes, assignments, attendance, and student performance.

### Key Screens

#### 1. Faculty Dashboard
- **Location**: `app/screens/Faculty/FacultyDashboard.tsx`
- **Features**:
  - Current class information
  - Quick actions
  - Upcoming classes

#### 2. Attendance Management
- **Location**: `app/screens/Faculty/AttendanceManagementScreen.tsx`
- **Features**:
  - Mark attendance for classes
  - View attendance records
  - Attendance analytics

#### 3. Assignments Management
- **Location**: `app/screens/Faculty/AssignmentsManagementScreen.tsx`
- **Features**:
  - Create assignments
  - View all assignments
  - Publish assignments
  - View submissions

#### 4. Create Assignment
- **Location**: `app/screens/Faculty/CreateAssignmentScreen.tsx`
- **Features**:
  - Full assignment creation form
  - Course selection
  - Due date and time picker
  - Validation

#### 5. Submission Grading
- **Location**: `app/screens/Faculty/SubmissionGradingScreen.tsx`
- **Features**:
  - List of all submissions
  - Grade submissions with marks and feedback
  - View student submission content
  - Pending vs graded separation

#### 6. Student Performance Insights
- **Location**: `app/screens/Faculty/StudentPerformanceInsightsScreen.tsx`
- **Features**:
  - Per-class student performance
  - Risk level identification
  - Attendance and grade metrics
  - At-risk student alerts

#### 7. Class Intelligence
- **Location**: `app/screens/Faculty/ClassIntelligenceScreen.tsx`
- **Features**:
  - Class analytics
  - Attendance overview
  - At-risk students
  - Engagement insights

#### 8. Announcement Broadcast
- **Location**: `app/screens/Faculty/AnnouncementBroadcastScreen.tsx`
- **Features**:
  - Create announcements
  - Select audience (all, course, department)
  - Priority levels
  - Broadcast to students

### Navigation
Access via bottom tabs:
- Home (Dashboard)
- Attendance
- Assignments
- Analytics
- Profile

---

## Support Portal Guide

### Overview
The Support Portal manages support tickets with SLA tracking and escalation capabilities.

### Key Screens

#### 1. Support Dashboard
- **Location**: `app/screens/Support/SupportDashboard.tsx`
- **Features**:
  - Ticket inbox
  - Status filters
  - Summary statistics
  - Quick actions

#### 2. Ticket Detail
- **Location**: `app/screens/Support/TicketDetailScreen.tsx`
- **Features**:
  - Full ticket information
  - SLA timer with status
  - Comments system
  - Status change workflow
  - Escalation functionality

### SLA System
- **URGENT**: 2 hours
- **HIGH**: 8 hours
- **MEDIUM**: 24 hours
- **LOW**: 48 hours

SLA Status:
- **ON_TRACK**: Within 80% of SLA time
- **AT_RISK**: Between 80-100% of SLA time
- **BREACHED**: Exceeded SLA time

---

## Security Portal Guide

### Overview
The Security Portal manages security incidents, SOS alerts, geo-fencing, and emergency response.

### Key Screens

#### 1. Security Dashboard
- **Location**: `app/screens/Security/SecurityDashboard.tsx`
- **Features**:
  - All security incidents
  - Status filters
  - Emergency trigger
  - Summary statistics

#### 2. SOS Alerts Dashboard
- **Location**: `app/screens/Security/SOSAlertsDashboard.tsx`
- **Features**:
  - Critical SOS alerts
  - Active emergency count
  - Quick response actions
  - Real-time updates

#### 3. Geo-fence Monitor
- **Location**: `app/screens/Security/GeofenceMonitorScreen.tsx`
- **Features**:
  - Monitor geo-fence breaches
  - Unauthorized entry/exit alerts
  - Severity levels
  - Resolution workflow

#### 4. Student Location Tracking
- **Location**: `app/screens/Security/StudentLocationTrackingScreen.tsx`
- **Features**:
  - Real-time student location
  - Emergency mode tracking
  - Status indicators
  - Emergency response actions

### Navigation
Access via bottom tabs:
- Incidents
- SOS Alerts
- Geofence

---

## AI Integration Guide

### Unified AI Gateway
- **Location**: `app/services/aiGateway.service.ts`
- **Purpose**: Single interface for all AI interactions

### Supported Providers
1. **Gemini** (Google)
2. **OpenAI**
3. **Mock** (for development)

### Configuration
Set environment variable:
```bash
AI_PROVIDER=gemini  # or 'openai' or 'mock'
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key
```

### Contexts
- `campus-assistant`: General campus operations
- `academic-advisor`: Student academic guidance
- `teaching-assistant`: Faculty teaching support
- `admin-copilot`: Administrative insights

### Usage Example
```typescript
import {queryAI, queryAcademicAdvisor} from '../services/aiGateway.service';

// Direct query
const response = await queryAI({
  prompt: 'What is the attendance trend?',
  context: 'campus-assistant',
});

// Convenience function
const advice = await queryAcademicAdvisor('Study tips');
```

---

## Design System

### Design Tokens
- **Location**: `app/theme/designTokens.ts`
- **Includes**:
  - Colors (primary, status, priority)
  - Typography (fonts, sizes, weights)
  - Spacing scale
  - Border radius
  - Shadows
  - Z-index hierarchy

### Usage
```typescript
import {Colors, Typography, Spacing} from '../theme/designTokens';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    padding: Spacing.base,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
});
```

### Components
- **ErrorBoundary**: Enhanced error handling
- **SkeletonLoader**: Shimmer loading states
- **EmptyState**: Consistent empty states

---

## API Reference

### Services

#### Assignment Service
- `createAssignment()`
- `fetchStudentAssignments()`
- `submitAssignment()`
- `gradeSubmission()`

#### Attendance Service
- `markAttendance()`
- `fetchStudentAttendanceSummary()`
- `fetchStudentAttendanceStats()`

#### Communication Service
- `createAnnouncement()`
- `getEvents()`
- `createEvent()`

#### AI Gateway Service
- `queryAI()`
- `queryCampusAssistant()`
- `queryAcademicAdvisor()`
- `queryTeachingAssistant()`
- `queryAdminCopilot()`

---

## Deployment Guide

### Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio / Xcode
- Firebase project

### Environment Variables
```bash
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key
AI_PROVIDER=gemini
FCM_SERVER_KEY=your_key
```

### Build Steps
1. Install dependencies: `npm install`
2. Configure Firebase
3. Set environment variables
4. Build: `npm run android` or `npm run ios`

### Testing
- Unit tests: `npm test`
- UI testing: See testing plan document

---

## Support

For issues or questions:
1. Check documentation
2. Review code comments
3. Contact development team

---

**Last Updated**: 2024
**Version**: 1.0.0

