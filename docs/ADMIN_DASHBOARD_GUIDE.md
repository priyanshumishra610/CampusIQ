# Admin Dashboard Guide

## Overview

The Admin Dashboard is the central command center for campus administrators. It provides a comprehensive view of campus operations, health metrics, and actionable insights.

## Dashboard Layout

### Header Section
- **Title**: Executive Dashboard
- **Role Badge**: Shows admin role (Registrar, Dean, Director, Executive)
- **View Only Badge**: Displayed for read-only roles (Executive)

### Health Score Card
- **Overall Campus Health**: Visual indicator of system health
- **Score Breakdown**: Component-level health metrics
- **Color Coding**:
  - Green: Healthy (80-100)
  - Yellow: Warning (60-79)
  - Red: Critical (<60)

### Key Metrics Row

#### 1. Pending Tasks
- **Metric**: Number of tasks with status "NEW"
- **Color**: Default (blue)
- **Action**: Click to filter tasks by "NEW" status

#### 2. In Progress Tasks
- **Metric**: Number of tasks with status "IN_PROGRESS"
- **Color**: Default (blue)
- **Action**: Click to filter tasks by "IN_PROGRESS" status

#### 3. Escalated Tasks
- **Metric**: Number of tasks with status "ESCALATED"
- **Color**: Red (if count > 0)
- **Action**: Click to filter tasks by "ESCALATED" status
- **Alert**: Highlights when escalated tasks exist

#### 4. Average Resolution Time
- **Metric**: Average hours to resolve tasks
- **Calculation**: Based on resolved tasks only
- **Format**: "X.Xh" (e.g., "24.5h")

### Filters Section

#### Status Filter
- **Options**: ALL, NEW, IN_PROGRESS, RESOLVED, ESCALATED
- **Default**: ALL
- **Behavior**: Filters task list by selected status

#### Priority Filter
- **Options**: ALL, LOW, MEDIUM, HIGH
- **Default**: ALL
- **Behavior**: Filters task list by selected priority

### Task List

Each task card displays:
- **Title**: Task title
- **Description**: Task description (truncated)
- **Status**: Current task status
- **Priority**: Task priority level
- **Created By**: User who created the task
- **Created Date**: When task was created
- **Actions**: Available based on permissions

### Task Actions

Available actions depend on user permissions:

#### For Non-Read-Only Roles:
1. **In Progress**: Move task from NEW to IN_PROGRESS
   - Available when status is NEW
   - Requires permission: `task:create`

2. **Complete**: Mark task as RESOLVED
   - Available when status is not RESOLVED
   - Requires permission: `task:close`

3. **Escalate**: Move task to ESCALATED
   - Available when status is not ESCALATED or RESOLVED
   - Requires permission: `task:escalate`

#### For Read-Only Roles (Executive):
- No actions available
- View-only access to all tasks

## Permissions

### Task Permissions
- `task:view` - View all tasks
- `task:create` - Create new tasks
- `task:close` - Resolve/close tasks
- `task:escalate` - Escalate tasks
- `task:assign` - Assign tasks to users
- `task:delete` - Delete tasks

### Dashboard Permissions
- `dashboard:view` - Access dashboard
- `dashboard:analytics` - View analytics section

### Role-Based Access

#### REGISTRAR
- Can view tasks
- Can create tasks
- Can view exams
- Can create exams
- Can view dashboard
- Cannot close or escalate tasks

#### DEAN
- All REGISTRAR permissions
- Can close tasks
- Can escalate tasks
- Can view analytics
- Can view crowd intelligence

#### DIRECTOR
- All DEAN permissions
- Can assign tasks
- Can delete tasks
- Can manage compliance
- Can manage finances

#### EXECUTIVE
- View-only access
- Can view dashboard
- Can view analytics
- Cannot modify any data

## Best Practices

### Daily Operations
1. **Morning Review**: Check escalated tasks first
2. **Priority Focus**: Address HIGH priority tasks
3. **Status Updates**: Regularly update task statuses
4. **Health Monitoring**: Monitor campus health score

### Task Management
1. **Clear Titles**: Use descriptive task titles
2. **Detailed Descriptions**: Provide context in descriptions
3. **Proper Prioritization**: Set appropriate priority levels
4. **Timely Resolution**: Aim for quick resolution times

### Escalation Guidelines
- Escalate when task requires higher authority
- Escalate when task is blocking other work
- Escalate when SLA deadline is approaching
- Document escalation reason

## Metrics Interpretation

### Pending Tasks
- **Low (< 10)**: Normal operations
- **Medium (10-20)**: Increased workload
- **High (> 20)**: May need resource allocation

### In Progress Tasks
- **Low (< 5)**: Good throughput
- **Medium (5-15)**: Normal operations
- **High (> 15)**: May indicate bottlenecks

### Escalated Tasks
- **Zero**: Ideal state
- **Any**: Requires immediate attention
- **Multiple**: May indicate systemic issues

### Average Resolution Time
- **< 24h**: Excellent
- **24-48h**: Good
- **48-72h**: Acceptable
- **> 72h**: Needs improvement

## Troubleshooting

### Dashboard Not Loading
1. Check Firebase connection
2. Verify user permissions
3. Check Redux state
4. Review console for errors

### Tasks Not Updating
1. Verify task listener is active
2. Check Firebase rules
3. Verify user permissions
4. Refresh dashboard

### Metrics Not Calculating
1. Check if tasks have required fields
2. Verify date fields are valid
3. Check calculation logic
4. Review console for errors

## Keyboard Shortcuts

- **R**: Refresh dashboard
- **F**: Focus on filters
- **E**: Show escalated tasks only
- **N**: Show new tasks only

## Mobile Optimization

The dashboard is fully responsive:
- **Cards**: Stack vertically on small screens
- **Filters**: Scroll horizontally
- **Metrics**: Adjust to screen size
- **Actions**: Touch-optimized buttons

## Data Refresh

- **Automatic**: Real-time updates via Firebase listeners
- **Manual**: Pull to refresh on task list
- **Interval**: Health score updates every 5 minutes

## Export Options

- **Tasks**: Export to CSV (planned)
- **Metrics**: Export to PDF (planned)
- **Reports**: Generate reports (planned)

## Integration Points

### Exam Management
- Link to exam dashboard
- View exam-related tasks
- Schedule exam tasks

### Task Management
- Create tasks from dashboard
- Link to task detail screen
- View task history

### Analytics
- Link to detailed analytics
- View trend charts
- Export analytics data

## Support

For dashboard issues:
1. Check this guide
2. Review permissions
3. Contact system administrator
4. Check system logs

---

**Version**: 2.0.0
**Last Updated**: Current
**Maintained By**: CampusIQ Development Team

