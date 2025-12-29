import {Role} from '../redux/slices/authSlice';

export type AdminRole = 'REGISTRAR' | 'DEAN' | 'DIRECTOR' | 'EXECUTIVE';

export type Permission =
  // Task/Issue Management
  | 'task:create'
  | 'task:view'
  | 'task:close'
  | 'task:escalate'
  | 'task:assign'
  | 'task:delete'
  // Exam Management
  | 'exam:create'
  | 'exam:view'
  | 'exam:edit'
  | 'exam:delete'
  | 'exam:publish'
  | 'exam:schedule'
  | 'exam:results:view'
  | 'exam:results:upload'
  // Reports & Analytics
  | 'report:export'
  | 'report:view'
  | 'dashboard:view'
  | 'dashboard:analytics'
  // Compliance & Finance
  | 'compliance:view'
  | 'compliance:manage'
  | 'finance:view'
  | 'finance:manage'
  // System
  | 'system:config'
  | 'audit:view'
  | 'crowd:view'
  // Student Permissions
  | 'student:timetable:view'
  | 'student:attendance:view'
  | 'student:assignment:view'
  | 'student:assignment:submit'
  | 'student:exam:view'
  | 'student:results:view'
  | 'student:leave:request'
  | 'student:hostel:view'
  | 'student:mess:view'
  | 'student:payment:view'
  | 'student:payment:pay'
  | 'student:complaint:create'
  | 'student:complaint:view'
  // Faculty Permissions
  | 'faculty:attendance:mark'
  | 'faculty:attendance:view'
  | 'faculty:assignment:create'
  | 'faculty:assignment:grade'
  | 'faculty:assignment:view'
  | 'faculty:course:view'
  | 'faculty:course:analytics'
  | 'faculty:student:view'
  | 'faculty:student:insights'
  | 'faculty:exam:create'
  | 'faculty:exam:grade'
  // Support Permissions
  | 'support:ticket:create'
  | 'support:ticket:view'
  | 'support:ticket:assign'
  | 'support:ticket:resolve'
  | 'support:ticket:escalate'
  // Security Permissions
  | 'security:incident:create'
  | 'security:incident:view'
  | 'security:incident:resolve'
  | 'security:emergency:trigger'
  | 'security:access:view'
  // Communication
  | 'announcement:view'
  | 'announcement:create'
  | 'announcement:edit'
  | 'announcement:delete'
  | 'event:view'
  | 'event:create'
  | 'event:edit'
  | 'event:delete'
  // Campus Operations
  | 'campus:map:view'
  | 'campus:facility:view'
  | 'campus:facility:book'
  | 'campus:maintenance:request'
  // Health & Wellbeing
  | 'health:checker:use'
  | 'health:counseling:book'
  | 'health:sos:trigger'
  | 'health:report:create'
  // Payments
  | 'payment:view'
  | 'payment:pay'
  | 'payment:refund'
  | 'wallet:view'
  | 'wallet:manage'
  // HR Permissions - Employee Management
  | 'hr:employee:create'
  | 'hr:employee:view'
  | 'hr:employee:edit'
  | 'hr:employee:delete'
  | 'hr:employee:export'
  // HR Permissions - Recruitment
  | 'hr:recruitment:create'
  | 'hr:recruitment:view'
  | 'hr:recruitment:edit'
  | 'hr:recruitment:delete'
  | 'hr:recruitment:shortlist'
  | 'hr:recruitment:schedule'
  // HR Permissions - Leave Management
  | 'hr:leave:create'
  | 'hr:leave:view'
  | 'hr:leave:approve'
  | 'hr:leave:reject'
  | 'hr:leave:manage'
  // HR Permissions - Attendance
  | 'hr:attendance:mark'
  | 'hr:attendance:view'
  | 'hr:attendance:edit'
  | 'hr:attendance:export'
  // HR Permissions - Payroll
  | 'hr:payroll:create'
  | 'hr:payroll:view'
  | 'hr:payroll:edit'
  | 'hr:payroll:delete'
  | 'hr:payroll:generate'
  | 'hr:payroll:export'
  // HR Permissions - Performance
  | 'hr:performance:create'
  | 'hr:performance:view'
  | 'hr:performance:edit'
  | 'hr:performance:review'
  | 'hr:performance:export'
  // HR Permissions - Expenses
  | 'hr:expense:create'
  | 'hr:expense:view'
  | 'hr:expense:approve'
  | 'hr:expense:reject'
  | 'hr:expense:export'
  // HR Permissions - Compliance
  | 'hr:compliance:create'
  | 'hr:compliance:view'
  | 'hr:compliance:edit'
  | 'hr:compliance:track'
  | 'hr:compliance:export'
  // HR Permissions - Dashboard & Reports
  | 'hr:dashboard:view'
  | 'hr:report:view'
  | 'hr:report:export'
  | 'hr:analytics:view';

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  REGISTRAR: [
    'task:create',
    'task:view',
    'exam:create',
    'exam:view',
    'exam:edit',
    'exam:schedule',
    'dashboard:view',
    'report:view',
  ],
  DEAN: [
    'task:create',
    'task:view',
    'task:close',
    'task:escalate',
    'exam:create',
    'exam:view',
    'exam:edit',
    'exam:schedule',
    'exam:publish',
    'dashboard:view',
    'dashboard:analytics',
    'report:view',
    'report:export',
    'compliance:view',
    'audit:view',
    'crowd:view',
  ],
  DIRECTOR: [
    'task:create',
    'task:view',
    'task:close',
    'task:escalate',
    'task:assign',
    'task:delete',
    'exam:create',
    'exam:view',
    'exam:edit',
    'exam:delete',
    'exam:schedule',
    'exam:publish',
    'dashboard:view',
    'dashboard:analytics',
    'report:view',
    'report:export',
    'compliance:view',
    'compliance:manage',
    'finance:view',
    'finance:manage',
    'audit:view',
    'crowd:view',
  ],
  EXECUTIVE: [
    'task:view',
    'exam:view',
    'dashboard:view',
    'dashboard:analytics',
    'report:view',
    'report:export',
    'compliance:view',
    'finance:view',
    'audit:view',
    'crowd:view',
  ],
};

// Role-based permissions for all user types
const ALL_ROLE_PERMISSIONS: Record<Role | AdminRole, Permission[]> = {
  // Student Permissions
  STUDENT: [
    'student:timetable:view',
    'student:attendance:view',
    'student:assignment:view',
    'student:assignment:submit',
    'student:exam:view',
    'student:results:view',
    'student:leave:request',
    'student:hostel:view',
    'student:mess:view',
    'student:payment:view',
    'student:payment:pay',
    'student:complaint:create',
    'student:complaint:view',
    'announcement:view',
    'event:view',
    'campus:map:view',
    'campus:facility:view',
    'campus:facility:book',
    'campus:maintenance:request',
    'health:checker:use',
    'health:counseling:book',
    'health:sos:trigger',
    'health:report:create',
    'payment:view',
    'payment:pay',
    'wallet:view',
    'dashboard:view',
  ],
  // Faculty Permissions
  FACULTY: [
    'faculty:attendance:mark',
    'faculty:attendance:view',
    'faculty:assignment:create',
    'faculty:assignment:grade',
    'faculty:assignment:view',
    'faculty:course:view',
    'faculty:course:analytics',
    'faculty:student:view',
    'faculty:student:insights',
    'faculty:exam:create',
    'faculty:exam:grade',
    'exam:view',
    'exam:edit',
    'announcement:view',
    'announcement:create',
    'event:view',
    'event:create',
    'campus:map:view',
    'campus:facility:view',
    'campus:facility:book',
    'dashboard:view',
    'dashboard:analytics',
    'report:view',
  ],
  // Support Permissions
  SUPPORT: [
    'support:ticket:create',
    'support:ticket:view',
    'support:ticket:assign',
    'support:ticket:resolve',
    'support:ticket:escalate',
    'task:view',
    'campus:maintenance:request',
    'dashboard:view',
    'report:view',
  ],
  // Security Permissions
  SECURITY: [
    'security:incident:create',
    'security:incident:view',
    'security:incident:resolve',
    'security:emergency:trigger',
    'security:access:view',
    'campus:map:view',
    'crowd:view',
    'dashboard:view',
    'report:view',
  ],
  // Admin Roles (existing)
  ...ROLE_PERMISSIONS,
  ADMIN: [
    // Admins get all permissions through their adminRole
    // This is a fallback for admins without specific adminRole
    'task:view',
    'exam:view',
    'dashboard:view',
  ],
  // HR Admin - Full access to all HR modules
  HR_ADMIN: [
    'hr:employee:create',
    'hr:employee:view',
    'hr:employee:edit',
    'hr:employee:delete',
    'hr:employee:export',
    'hr:recruitment:create',
    'hr:recruitment:view',
    'hr:recruitment:edit',
    'hr:recruitment:delete',
    'hr:recruitment:shortlist',
    'hr:recruitment:schedule',
    'hr:leave:create',
    'hr:leave:view',
    'hr:leave:approve',
    'hr:leave:reject',
    'hr:leave:manage',
    'hr:attendance:mark',
    'hr:attendance:view',
    'hr:attendance:edit',
    'hr:attendance:export',
    'hr:payroll:create',
    'hr:payroll:view',
    'hr:payroll:edit',
    'hr:payroll:delete',
    'hr:payroll:generate',
    'hr:payroll:export',
    'hr:performance:create',
    'hr:performance:view',
    'hr:performance:edit',
    'hr:performance:review',
    'hr:performance:export',
    'hr:expense:create',
    'hr:expense:view',
    'hr:expense:approve',
    'hr:expense:reject',
    'hr:expense:export',
    'hr:compliance:create',
    'hr:compliance:view',
    'hr:compliance:edit',
    'hr:compliance:track',
    'hr:compliance:export',
    'hr:dashboard:view',
    'hr:report:view',
    'hr:report:export',
    'hr:analytics:view',
    'dashboard:view',
  ],
  // HR Manager - Can manage most HR functions except system config
  HR_MANAGER: [
    'hr:employee:create',
    'hr:employee:view',
    'hr:employee:edit',
    'hr:employee:export',
    'hr:recruitment:create',
    'hr:recruitment:view',
    'hr:recruitment:edit',
    'hr:recruitment:shortlist',
    'hr:recruitment:schedule',
    'hr:leave:create',
    'hr:leave:view',
    'hr:leave:approve',
    'hr:leave:reject',
    'hr:leave:manage',
    'hr:attendance:mark',
    'hr:attendance:view',
    'hr:attendance:edit',
    'hr:attendance:export',
    'hr:payroll:view',
    'hr:payroll:edit',
    'hr:payroll:generate',
    'hr:payroll:export',
    'hr:performance:create',
    'hr:performance:view',
    'hr:performance:edit',
    'hr:performance:review',
    'hr:performance:export',
    'hr:expense:create',
    'hr:expense:view',
    'hr:expense:approve',
    'hr:expense:reject',
    'hr:expense:export',
    'hr:compliance:view',
    'hr:compliance:edit',
    'hr:compliance:track',
    'hr:compliance:export',
    'hr:dashboard:view',
    'hr:report:view',
    'hr:report:export',
    'hr:analytics:view',
    'dashboard:view',
  ],
  // HR Staff - Limited access, mostly view and basic operations
  HR_STAFF: [
    'hr:employee:view',
    'hr:employee:edit',
    'hr:recruitment:view',
    'hr:recruitment:shortlist',
    'hr:leave:create',
    'hr:leave:view',
    'hr:attendance:mark',
    'hr:attendance:view',
    'hr:payroll:view',
    'hr:performance:view',
    'hr:expense:create',
    'hr:expense:view',
    'hr:compliance:view',
    'hr:dashboard:view',
    'hr:report:view',
    'dashboard:view',
  ],
};

export const hasPermission = (
  role: Role | undefined,
  permission: Permission,
  adminRole?: AdminRole,
): boolean => {
  if (!role) return false;
  
  // For admins, check both role and adminRole permissions
  if (role === 'ADMIN' && adminRole) {
    const adminPerms = ALL_ROLE_PERMISSIONS[adminRole] || [];
    if (adminPerms.includes(permission)) return true;
  }
  
  const rolePerms = ALL_ROLE_PERMISSIONS[role] || [];
  return rolePerms.includes(permission);
};

export const hasAnyPermission = (
  role: Role | undefined,
  permissions: Permission[],
  adminRole?: AdminRole,
): boolean => {
  if (!role) return false;
  return permissions.some(p => hasPermission(role, p, adminRole));
};

export const hasAllPermissions = (
  role: Role | undefined,
  permissions: Permission[],
  adminRole?: AdminRole,
): boolean => {
  if (!role) return false;
  return permissions.every(p => hasPermission(role, p, adminRole));
};

export const getRolePermissions = (role: Role, adminRole?: AdminRole): Permission[] => {
  const permissions: Permission[] = [];
  
  if (role === 'ADMIN' && adminRole) {
    permissions.push(...(ALL_ROLE_PERMISSIONS[adminRole] || []));
  }
  
  permissions.push(...(ALL_ROLE_PERMISSIONS[role] || []));
  
  return [...new Set(permissions)]; // Remove duplicates
};

export const getRoleDisplayName = (role: Role, adminRole?: AdminRole): string => {
  if (role === 'ADMIN' && adminRole) {
    const adminNames: Record<AdminRole, string> = {
      REGISTRAR: 'Registrar',
      DEAN: 'Dean',
      DIRECTOR: 'Director',
      EXECUTIVE: 'Executive',
    };
    return adminNames[adminRole] || adminRole;
  }
  
  const roleNames: Record<Role, string> = {
    STUDENT: 'Student',
    FACULTY: 'Faculty',
    ADMIN: 'Administrator',
    SUPPORT: 'Support Staff',
    SECURITY: 'Security Staff',
    HR_ADMIN: 'HR Administrator',
    HR_MANAGER: 'HR Manager',
    HR_STAFF: 'HR Staff',
  };
  
  return roleNames[role] || role;
};

export const isReadOnlyRole = (role: Role, adminRole?: AdminRole): boolean => {
  if (role === 'ADMIN' && adminRole) {
    return adminRole === 'EXECUTIVE';
  }
  return false;
};

