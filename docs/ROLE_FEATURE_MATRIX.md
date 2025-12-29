# CampusIQ Role Feature Matrix

## Overview

This document outlines all features available to each user role in CampusIQ.

## Role Definitions

1. **STUDENT**: Enrolled students
2. **FACULTY**: Teaching staff
3. **ADMIN**: Administrative staff (with sub-roles: REGISTRAR, DEAN, DIRECTOR, EXECUTIVE)
4. **SUPPORT**: Support staff
5. **SECURITY**: Security personnel

---

## Student Features

### Dashboard
- ✅ View current class information
- ✅ View attendance summary
- ✅ View assignment summary (pending, overdue, submitted)
- ✅ Quick actions panel
- ✅ Recent announcements

### Assignments
- ✅ View all assignments
- ✅ View assignment details
- ✅ Submit assignments
- ✅ View submission status
- ✅ View grades and feedback
- ✅ Track deadlines
- ✅ Late submission indicators

### Attendance
- ✅ View overall attendance percentage
- ✅ View subject-wise attendance
- ✅ View attendance statistics
- ✅ Risk indicators (below 75% threshold)
- ✅ Progress bars for each subject

### Announcements
- ✅ View all announcements
- ✅ Filter by priority
- ✅ Mark announcements as read
- ✅ Unread count badge
- ✅ View announcement details

### Exams
- ✅ View exam schedule
- ✅ Filter by upcoming/past
- ✅ View exam details (date, time, location)
- ✅ Countdown timer for upcoming exams
- ✅ View exam type and duration

### Timetable
- ✅ View weekly timetable
- ✅ View current class
- ✅ View next class

### Calendar
- ⚠️ UI ready, full integration pending

---

## Faculty Features

### Dashboard
- ✅ View current lecture
- ✅ Quick actions
- ✅ Analytics summary
- ✅ Class performance overview

### Attendance Management
- ✅ Select class
- ✅ Mark attendance (single student)
- ✅ Mark attendance (bulk)
- ✅ View attendance summary
- ✅ View attendance statistics

### Assignments
- ✅ Create assignment
- ✅ Publish assignment
- ✅ View all assignments
- ✅ View submissions
- ✅ Grade submissions
- ✅ Provide feedback
- ✅ Tag late submissions

### Class Intelligence
- ⚠️ UI ready, analytics pending
- Performance analytics
- Engagement insights
- At-risk student indicators

### Announcements
- ✅ Create announcements
- ✅ Target specific classes/departments
- ✅ Set priority levels

### Exams
- ✅ Create exams
- ✅ Schedule exams
- ✅ View exam schedule
- ✅ Grade exams

---

## Admin Features

### Executive Dashboard
- ✅ View all tasks
- ✅ Filter by status and priority
- ✅ Update task status
- ✅ View health score
- ✅ View key metrics:
  - Pending tasks
  - In Progress tasks
  - Escalated tasks
  - Average resolution time

### Exam Management
- ✅ Create exams
- ✅ Edit exams
- ✅ Delete exams
- ✅ Schedule exams
- ✅ View exam calendar
- ✅ Detect conflicts
- ✅ Publish results

### Task Management
- ✅ View all tasks
- ✅ Create tasks
- ✅ Assign tasks
- ✅ Close tasks
- ✅ Escalate tasks
- ✅ View task details

### Campus Map
- ✅ View campus map
- ✅ View building locations

### Crowd Intelligence
- ✅ View crowd heatmap
- ✅ Monitor campus density

### Analytics
- ✅ View campus health index
- ✅ View department insights
- ✅ View event tracking
- ✅ View emergency snapshot
- ⚠️ Predictive analytics (UI ready)

---

## Support Features

### Ticket Dashboard
- ✅ View all tickets
- ✅ Filter by status (Open, In Progress, Resolved, Escalated)
- ✅ Filter by category
- ✅ View ticket summary:
  - Open tickets
  - In Progress tickets
  - Resolved tickets
  - Escalated tickets

### Ticket Management
- ✅ View ticket details
- ✅ Assign tickets
- ✅ Change ticket status
- ✅ Add comments
- ✅ View SLA deadlines
- ✅ Track resolution time

### Analytics
- ⚠️ UI ready, full analytics pending
- Issue trend statistics
- Resolution efficiency metrics

---

## Security Features

### Incident Dashboard
- ✅ View all incidents
- ✅ Filter by status (Active, Investigating, Resolved)
- ✅ View incident summary:
  - Active incidents
  - Resolved incidents
  - Critical incidents
  - Total incidents

### Incident Management
- ✅ Create incident
- ✅ View incident details
- ✅ Update incident status
- ✅ Add resolution notes
- ✅ View incident timeline
- ✅ Assign incidents

### Emergency Management
- ✅ Trigger emergency alerts
- ✅ Emergency types:
  - SOS
  - Fire
  - Medical
  - Security Breach
  - Natural Disaster
- ✅ View emergency alerts
- ✅ Resolve emergencies

### Geo Security
- ⚠️ UI ready, full implementation pending
- Geo-fence breach tracking
- Location-based alerts

---

## Permission Matrix

### Student Permissions
```
student:timetable:view
student:attendance:view
student:assignment:view
student:assignment:submit
student:exam:view
student:results:view
student:leave:request
student:complaint:create
student:complaint:view
announcement:view
event:view
campus:map:view
health:sos:trigger
dashboard:view
```

### Faculty Permissions
```
faculty:attendance:mark
faculty:attendance:view
faculty:assignment:create
faculty:assignment:grade
faculty:assignment:view
faculty:course:view
faculty:course:analytics
faculty:student:view
faculty:student:insights
faculty:exam:create
faculty:exam:grade
exam:view
exam:edit
announcement:view
announcement:create
dashboard:view
dashboard:analytics
```

### Support Permissions
```
support:ticket:create
support:ticket:view
support:ticket:assign
support:ticket:resolve
support:ticket:escalate
task:view
dashboard:view
report:view
```

### Security Permissions
```
security:incident:create
security:incident:view
security:incident:resolve
security:emergency:trigger
security:access:view
campus:map:view
crowd:view
dashboard:view
report:view
```

### Admin Permissions
Varies by admin role (REGISTRAR, DEAN, DIRECTOR, EXECUTIVE). See `app/config/permissions.ts` for details.

---

## Feature Status Legend

- ✅ **Implemented**: Fully functional
- ⚠️ **UI Ready**: Interface complete, backend integration pending
- ❌ **Not Implemented**: Not yet started

---

## Navigation Structure

### Student Navigation
- Home (Dashboard)
- Timetable
- Attendance
- Assignments
- Exams
- Announcements
- Profile

### Faculty Navigation
- Home (Dashboard)
- Attendance
- Assignments
- Analytics
- Profile

### Admin Navigation
- Dashboard
- Exams
- Map
- Crowd Intel
- Create Task

### Support Navigation
- Tickets
- Analytics

### Security Navigation
- Incidents
- Emergencies

---

## Data Flow

1. **User Action** → Component
2. **Component** → Redux Action (Thunk)
3. **Redux Thunk** → Service
4. **Service** → Firebase
5. **Firebase** → Redux State Update
6. **Redux State** → Component Re-render

---

## Future Enhancements

### Planned Features
- Real-time notifications
- Offline mode with sync
- Advanced analytics with charts
- Report generation
- Multi-campus support
- AI-powered insights (backend integration)
- Calendar integration
- File upload for assignments
- Video conferencing integration
- Payment gateway integration

---

**Last Updated**: Current Version
**Maintained By**: CampusIQ Development Team

