/**
 * Role-Based Sidebar Navigation Configuration
 * 
 * This file contains all sidebar menu configurations for each user role.
 * Each role has its own set of navigation items with icons, labels, and routes.
 * 
 * To extend: Add new items to the respective role's menuItems array.
 */

import {Role} from '../redux/slices/authSlice';

export type SidebarMenuItem = {
  id: string;
  label: string;
  icon: string; // MaterialIcons icon name
  route: string;
  section?: string; // Optional section header
  badge?: number; // Optional badge count
};

export type SidebarConfig = {
  role: Role;
  menuItems: SidebarMenuItem[];
  bottomItems: SidebarMenuItem[]; // Settings, Help, Logout
};

/**
 * STUDENT Sidebar Configuration
 */
export const studentSidebarConfig: SidebarConfig = {
  role: 'STUDENT',
  menuItems: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: 'StudentHome',
      section: 'Main',
    },
    {
      id: 'timetable',
      label: 'Timetable',
      icon: 'schedule',
      route: 'Timetable',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: 'check-circle',
      route: 'Attendance',
    },
    {
      id: 'assignments',
      label: 'Assignments',
      icon: 'assignment',
      route: 'Assignments',
    },
    {
      id: 'exams',
      label: 'Exams',
      icon: 'quiz',
      route: 'Exams',
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: 'trending-up',
      route: 'PerformanceDashboard',
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: 'campaign',
      route: 'Announcements',
    },
  ],
  bottomItems: [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: 'Settings',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'help-outline',
      route: 'Help',
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'logout',
      route: 'Logout',
    },
  ],
};

/**
 * FACULTY Sidebar Configuration
 */
export const facultySidebarConfig: SidebarConfig = {
  role: 'FACULTY',
  menuItems: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: 'FacultyHome',
      section: 'Main',
    },
    {
      id: 'attendance-manager',
      label: 'Attendance Manager',
      icon: 'how-to-reg',
      route: 'Attendance',
    },
    {
      id: 'assignments-manager',
      label: 'Assignments Manager',
      icon: 'assignment',
      route: 'Assignments',
    },
    {
      id: 'class-intelligence',
      label: 'Class Intelligence',
      icon: 'insights',
      route: 'Analytics',
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: 'campaign',
      route: 'AnnouncementBroadcast',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'assessment',
      route: 'StudentPerformanceInsights',
    },
  ],
  bottomItems: [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: 'Settings',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'help-outline',
      route: 'Help',
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'logout',
      route: 'Logout',
    },
  ],
};

/**
 * ADMIN Sidebar Configuration
 */
export const adminSidebarConfig: SidebarConfig = {
  role: 'ADMIN',
  menuItems: [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: 'dashboard',
      route: 'AdminHome',
      section: 'Overview',
    },
    {
      id: 'exams',
      label: 'Exams',
      icon: 'quiz',
      route: 'Exams',
    },
    {
      id: 'map',
      label: 'Campus Map',
      icon: 'map',
      route: 'Map',
    },
    {
      id: 'crowd-heatmap',
      label: 'Crowd Heatmap',
      icon: 'people',
      route: 'CrowdHeatmap',
      section: 'Intelligence',
    },
    {
      id: 'create-task',
      label: 'Create Task',
      icon: 'add-task',
      route: 'CreateTask',
    },
  ],
  bottomItems: [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: 'Settings',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'help-outline',
      route: 'Help',
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'logout',
      route: 'Logout',
    },
  ],
};

/**
 * SUPPORT Sidebar Configuration
 */
export const supportSidebarConfig: SidebarConfig = {
  role: 'SUPPORT',
  menuItems: [
    {
      id: 'dashboard',
      label: 'Support Dashboard',
      icon: 'dashboard',
      route: 'SupportHome',
      section: 'Main',
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: 'support-agent',
      route: 'Dashboard',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'analytics',
      route: 'Analytics',
    },
  ],
  bottomItems: [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: 'Settings',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'help-outline',
      route: 'Help',
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'logout',
      route: 'Logout',
    },
  ],
};

/**
 * SECURITY Sidebar Configuration
 */
export const securitySidebarConfig: SidebarConfig = {
  role: 'SECURITY',
  menuItems: [
    {
      id: 'dashboard',
      label: 'Security Console',
      icon: 'security',
      route: 'SecurityHome',
      section: 'Main',
    },
    {
      id: 'sos-alerts',
      label: 'SOS Alerts',
      icon: 'emergency',
      route: 'SOSAlerts',
    },
    {
      id: 'live-incidents',
      label: 'Live Incidents',
      icon: 'warning',
      route: 'Dashboard',
    },
    {
      id: 'geo-fence',
      label: 'Geo Fence Monitor',
      icon: 'location-on',
      route: 'Geofence',
    },
  ],
  bottomItems: [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: 'Settings',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'help-outline',
      route: 'Help',
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'logout',
      route: 'Logout',
    },
  ],
};

/**
 * HR Sidebar Configuration
 */
export const hrAdminSidebarConfig: SidebarConfig = {
  role: 'HR_ADMIN',
  menuItems: [
    {
      id: 'dashboard',
      label: 'HR Dashboard',
      icon: 'dashboard',
      route: 'HRHome',
      section: 'Overview',
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: 'people',
      route: 'Employees',
    },
    {
      id: 'recruitment',
      label: 'Recruitment',
      icon: 'work',
      route: 'Recruitment',
    },
    {
      id: 'leave',
      label: 'Leave Management',
      icon: 'event-available',
      route: 'Leave',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: 'access-time',
      route: 'Attendance',
    },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: 'account-balance-wallet',
      route: 'Payroll',
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: 'trending-up',
      route: 'Performance',
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: 'receipt',
      route: 'Expenses',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: 'verified',
      route: 'Compliance',
    },
  ],
  bottomItems: [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: 'Settings',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'help-outline',
      route: 'Help',
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'logout',
      route: 'Logout',
    },
  ],
};

export const hrManagerSidebarConfig: SidebarConfig = {
  role: 'HR_MANAGER',
  menuItems: [
    {
      id: 'dashboard',
      label: 'HR Dashboard',
      icon: 'dashboard',
      route: 'HRHome',
      section: 'Overview',
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: 'people',
      route: 'Employees',
    },
    {
      id: 'recruitment',
      label: 'Recruitment',
      icon: 'work',
      route: 'Recruitment',
    },
    {
      id: 'leave',
      label: 'Leave Management',
      icon: 'event-available',
      route: 'Leave',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: 'access-time',
      route: 'Attendance',
    },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: 'account-balance-wallet',
      route: 'Payroll',
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: 'trending-up',
      route: 'Performance',
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: 'receipt',
      route: 'Expenses',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: 'verified',
      route: 'Compliance',
    },
  ],
  bottomItems: [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: 'Settings',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'help-outline',
      route: 'Help',
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'logout',
      route: 'Logout',
    },
  ],
};

export const hrStaffSidebarConfig: SidebarConfig = {
  role: 'HR_STAFF',
  menuItems: [
    {
      id: 'dashboard',
      label: 'HR Dashboard',
      icon: 'dashboard',
      route: 'HRHome',
      section: 'Overview',
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: 'people',
      route: 'Employees',
    },
    {
      id: 'recruitment',
      label: 'Recruitment',
      icon: 'work',
      route: 'Recruitment',
    },
    {
      id: 'leave',
      label: 'Leave Management',
      icon: 'event-available',
      route: 'Leave',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: 'access-time',
      route: 'Attendance',
    },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: 'account-balance-wallet',
      route: 'Payroll',
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: 'trending-up',
      route: 'Performance',
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: 'receipt',
      route: 'Expenses',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: 'verified',
      route: 'Compliance',
    },
  ],
  bottomItems: [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: 'Settings',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'help-outline',
      route: 'Help',
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'logout',
      route: 'Logout',
    },
  ],
};

/**
 * Get sidebar configuration for a specific role
 */
export const getSidebarConfig = (role: Role): SidebarConfig => {
  switch (role) {
    case 'STUDENT':
      return studentSidebarConfig;
    case 'FACULTY':
      return facultySidebarConfig;
    case 'ADMIN':
      return adminSidebarConfig;
    case 'SUPPORT':
      return supportSidebarConfig;
    case 'SECURITY':
      return securitySidebarConfig;
    case 'HR_ADMIN':
      return hrAdminSidebarConfig;
    case 'HR_MANAGER':
      return hrManagerSidebarConfig;
    case 'HR_STAFF':
      return hrStaffSidebarConfig;
    default:
      return adminSidebarConfig; // Default fallback
  }
};

/**
 * Get all menu items (main + bottom) for a role
 */
export const getAllMenuItems = (role: Role): SidebarMenuItem[] => {
  const config = getSidebarConfig(role);
  return [...config.menuItems, ...config.bottomItems];
};

