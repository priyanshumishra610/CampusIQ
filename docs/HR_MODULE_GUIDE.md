# CampusIQ HR Module Guide

## Overview

The CampusIQ HR Module is an enterprise-ready human resources management system with Keka-level functionality plus CampusIQ-specific enhancements. It provides comprehensive HR management capabilities including employee management, recruitment, leave management, payroll, performance reviews, expense claims, and compliance tracking.

## Role Hierarchy & Permissions

### HR Roles

1. **HR_ADMIN** - Full access to all HR modules
   - Can create, edit, delete employees
   - Full recruitment management
   - Approve/reject leave and expenses
   - Generate and manage payroll
   - Create performance reviews
   - Manage compliance policies

2. **HR_MANAGER** - Management-level access
   - Can create and edit employees (no delete)
   - Full recruitment management
   - Approve/reject leave and expenses
   - View and edit payroll
   - Create and manage performance reviews
   - View and edit compliance policies

3. **HR_STAFF** - Limited operational access
   - View and edit employees
   - View recruitment and shortlist candidates
   - Create leave requests
   - Mark attendance
   - View payroll
   - View performance reviews
   - Create and view expense claims
   - View compliance policies

### Permission Matrix

| Permission | HR_ADMIN | HR_MANAGER | HR_STAFF |
|------------|----------|------------|----------|
| hr:employee:create | ✅ | ✅ | ❌ |
| hr:employee:view | ✅ | ✅ | ✅ |
| hr:employee:edit | ✅ | ✅ | ✅ |
| hr:employee:delete | ✅ | ❌ | ❌ |
| hr:recruitment:create | ✅ | ✅ | ❌ |
| hr:recruitment:view | ✅ | ✅ | ✅ |
| hr:leave:approve | ✅ | ✅ | ❌ |
| hr:payroll:generate | ✅ | ✅ | ❌ |
| hr:performance:create | ✅ | ✅ | ❌ |
| hr:expense:approve | ✅ | ✅ | ❌ |
| hr:compliance:create | ✅ | ❌ | ❌ |

## Modules

### 1. Employee Management

**Features:**
- View, add, edit, and remove employee profiles
- Employee hierarchy & reporting manager assignment
- Employee search & filters (department, role, status)
- Document storage & download (contracts, certificates)
- Employee status management (Active, Onboarding, Offboarding, Inactive, Terminated)

**API Endpoints:**
- `GET /api/hr/employees` - Get all employees with filters
- `GET /api/hr/employees/:id` - Get employee by ID
- `POST /api/hr/employees` - Create employee
- `PUT /api/hr/employees/:id` - Update employee
- `DELETE /api/hr/employees/:id` - Delete employee
- `GET /api/hr/employees/:id/hierarchy` - Get employee hierarchy

**Frontend Service:** `employee.service.ts`

### 2. Recruitment

**Features:**
- Create job postings
- Receive & manage applications
- Shortlist candidates
- Interview scheduling
- Candidate status tracking

**API Endpoints:**
- `GET /api/hr/recruitment/postings` - Get all job postings
- `GET /api/hr/recruitment/postings/:id` - Get job posting by ID
- `POST /api/hr/recruitment/postings` - Create job posting
- `PUT /api/hr/recruitment/postings/:id` - Update job posting
- `GET /api/hr/recruitment/postings/:id/applications` - Get applications for a job
- `POST /api/hr/recruitment/applications` - Create application
- `PUT /api/hr/recruitment/applications/:id` - Update application status

**Frontend Service:** `recruitment.service.ts`

### 3. Leave Management

**Features:**
- Leave request creation & approval workflow
- Leave balance management
- Multiple leave types (Sick, Casual, Earned, Maternity, Paternity, etc.)
- Notifications for approvals/rejections
- Leave balance tracking

**API Endpoints:**
- `GET /api/hr/leave/requests` - Get all leave requests
- `GET /api/hr/leave/requests/:id` - Get leave request by ID
- `POST /api/hr/leave/requests` - Create leave request
- `PUT /api/hr/leave/requests/:id/approve` - Approve/reject leave request
- `GET /api/hr/leave/balances/:employeeId` - Get leave balances
- `POST /api/hr/leave/balances` - Update leave balance

**Frontend Service:** `leave.service.ts`

### 4. Attendance & Leave

**Features:**
- Mark attendance manually and via automated system
- View employee attendance reports
- Attendance summary and analytics
- Work hours tracking

**API Endpoints:**
- `POST /api/hr/attendance/mark` - Mark employee attendance
- `GET /api/hr/attendance/employee/:employeeId` - Get employee attendance
- `GET /api/hr/attendance/employee/:employeeId/summary` - Get attendance summary

**Frontend Service:** `attendance.service.ts` (HR-specific)

### 5. Payroll & Compensation

**Features:**
- Salary structure management
- Generate payroll slips
- View payment history
- Bonus & incentives module
- Automated salary calculation based on attendance & performance
- Leave deductions

**API Endpoints:**
- `GET /api/hr/payroll` - Get all payroll records
- `GET /api/hr/payroll/:id` - Get payroll record by ID
- `POST /api/hr/payroll/generate` - Generate payroll
- `PUT /api/hr/payroll/:id` - Update payroll record
- `GET /api/hr/payroll/structures` - Get salary structures
- `POST /api/hr/payroll/structures` - Create salary structure

**Frontend Service:** `payroll.service.ts`

### 6. Performance Management

**Features:**
- Define KPIs and goals
- Employee appraisal management
- Performance review workflow
- Analytics & insights on employee performance
- Rating system (0-5 scale)

**API Endpoints:**
- `GET /api/hr/performance/reviews` - Get all performance reviews
- `GET /api/hr/performance/reviews/:id` - Get performance review by ID
- `POST /api/hr/performance/reviews` - Create performance review
- `PUT /api/hr/performance/reviews/:id` - Update performance review

**Frontend Service:** `performance.service.ts`

### 7. Expenses & Claims

**Features:**
- Employee claim submission
- Approval workflow for expenses
- Track reimbursements
- Analytics for expense trends
- Multiple expense types (Travel, Meals, Accommodation, etc.)

**API Endpoints:**
- `GET /api/hr/expenses` - Get all expense claims
- `GET /api/hr/expenses/:id` - Get expense claim by ID
- `POST /api/hr/expenses` - Create expense claim
- `PUT /api/hr/expenses/:id/approve` - Approve/reject expense claim

**Frontend Service:** `expenses.service.ts`

### 8. Compliance & Policy Tracking

**Features:**
- Upload and manage HR policies
- Employee acknowledgment tracking
- Automated reminders for policy renewals or compliance checks
- Policy versioning

**API Endpoints:**
- `GET /api/hr/compliance/policies` - Get all HR policies
- `GET /api/hr/compliance/policies/:id` - Get policy by ID
- `POST /api/hr/compliance/policies` - Create policy
- `PUT /api/hr/compliance/policies/:id` - Update policy
- `GET /api/hr/compliance/policies/:id/acknowledgments` - Get policy acknowledgments
- `POST /api/hr/compliance/policies/:id/acknowledge` - Acknowledge policy
- `GET /api/hr/compliance/acknowledgments/pending/:employeeId` - Get pending acknowledgments

**Frontend Service:** `compliance.service.ts`

## Database Schema

### Key Tables

1. **employees** - Employee profiles and information
2. **job_postings** - Job openings
3. **job_applications** - Candidate applications
4. **leave_requests** - Leave requests and approvals
5. **leave_balances** - Employee leave balances
6. **employee_attendance** - Employee attendance records
7. **salary_structures** - Salary component definitions
8. **payroll_records** - Monthly payroll records
9. **performance_reviews** - Performance appraisal records
10. **expense_claims** - Employee expense claims
11. **hr_policies** - HR policy documents
12. **policy_acknowledgments** - Policy acknowledgment tracking

See `backend/src/database/schema.sql` for complete schema definitions.

## Workflows

### Employee Onboarding
1. HR_ADMIN creates employee profile
2. Assign reporting manager
3. Set salary structure
4. Allocate leave balances
5. Employee status: ONBOARDING → ACTIVE

### Leave Request Workflow
1. Employee/HR creates leave request
2. System checks leave balance
3. Request status: PENDING
4. Manager/HR approves/rejects
5. If approved: Deduct from balance, status: APPROVED
6. If rejected: Restore pending balance, status: REJECTED

### Payroll Generation Workflow
1. HR_ADMIN/HR_MANAGER initiates payroll generation
2. System calculates for each employee:
   - Basic salary from structure
   - Allowances and deductions
   - Attendance-based deductions
   - Bonuses and incentives
3. Generate payroll records
4. Review and approve
5. Process payment
6. Generate payslips

### Recruitment Workflow
1. HR creates job posting
2. Posting status: DRAFT → PUBLISHED
3. Candidates apply
4. Application status: APPLIED
5. HR shortlists candidates
6. Schedule interviews
7. Update application status: INTERVIEWED → OFFERED/REJECTED

### Performance Review Workflow
1. HR creates performance review
2. Set goals and KPIs
3. Review status: DRAFT → IN_PROGRESS
4. Manager/HR fills review
5. Employee provides comments
6. Manager provides feedback
7. Review status: COMPLETED → APPROVED

## Notifications

Real-time notifications are sent for:
- Leave request approvals/rejections
- Payroll generation completion
- Expense claim approvals/rejections
- Policy acknowledgment reminders
- Interview scheduling
- Performance review assignments

## Integration Points

### Existing CampusIQ Modules
- **Users**: HR employees are linked to user accounts
- **Notifications**: Uses existing notification system
- **Dashboard**: HR dashboard integrates with main CampusIQ dashboard
- **AI**: Optional AI insights for HR analytics

### Backend Integration
- Uses existing Node.js + PostgreSQL backend
- JWT authentication & role-based access
- Socket.IO for real-time notifications
- RESTful API endpoints

## Frontend Architecture

### Services
All HR services are located in `app/services/`:
- `employee.service.ts`
- `recruitment.service.ts`
- `leave.service.ts`
- `payroll.service.ts`
- `performance.service.ts`
- `expenses.service.ts`
- `compliance.service.ts`

### Screens
HR screens are located in `app/screens/HR/`:
- `HRDashboard.tsx` - Main HR dashboard
- `EmployeeManagementScreen.tsx` - Employee list and management
- `EmployeeDetailScreen.tsx` - Employee detail view
- `RecruitmentScreen.tsx` - Recruitment management
- `LeaveManagementScreen.tsx` - Leave management
- `PayrollScreen.tsx` - Payroll management
- `PerformanceScreen.tsx` - Performance reviews
- `ExpensesScreen.tsx` - Expense claims
- `ComplianceScreen.tsx` - Policy management

### Navigation
HR navigation is integrated into `RootNavigator.tsx` with:
- HR-specific drawer navigator
- Tab navigator for main HR modules
- Stack navigator for detail screens

## UI/UX Guidelines

- Maintain CampusIQ premium look & feel
- Enterprise-grade dashboards for HR_ADMIN
- Table views for lists with search, filter, and pagination
- Sidebar for HR roles reflecting modules they can access
- Minimal animations, clean professional design
- Responsive for mobile and tablet

## Testing Checklist

- [ ] Verify all HR roles have correct access
- [ ] Verify CRUD functionality for all modules
- [ ] Test notifications and alerts
- [ ] Test integration with existing CampusIQ modules
- [ ] Test leave balance calculations
- [ ] Test payroll generation
- [ ] Test approval workflows
- [ ] Test search and filtering
- [ ] Test pagination
- [ ] Test role-based UI visibility

## Future Enhancements

- AI-powered HR insights
- Advanced analytics and reporting
- Document management system
- Email/SMS integration
- Biometric attendance integration
- Mobile app for employee self-service
- Advanced reporting and dashboards
- Integration with external payroll systems

## Support

For issues or questions about the HR module, please contact the development team or refer to the main CampusIQ documentation.

