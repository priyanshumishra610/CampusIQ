export type AdminRole = 'REGISTRAR' | 'DEAN' | 'DIRECTOR' | 'EXECUTIVE';

export type Permission =
  | 'task:create'
  | 'task:view'
  | 'task:close'
  | 'task:escalate'
  | 'task:assign'
  | 'task:delete'
  | 'exam:create'
  | 'exam:view'
  | 'exam:edit'
  | 'exam:delete'
  | 'exam:publish'
  | 'exam:schedule'
  | 'report:export'
  | 'report:view'
  | 'dashboard:view'
  | 'dashboard:analytics'
  | 'compliance:view'
  | 'compliance:manage'
  | 'finance:view'
  | 'finance:manage'
  | 'system:config'
  | 'audit:view'
  | 'crowd:view';

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

export const hasPermission = (role: AdminRole | undefined, permission: Permission): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export const hasAnyPermission = (role: AdminRole | undefined, permissions: Permission[]): boolean => {
  if (!role) return false;
  return permissions.some(p => hasPermission(role, p));
};

export const hasAllPermissions = (role: AdminRole | undefined, permissions: Permission[]): boolean => {
  if (!role) return false;
  return permissions.every(p => hasPermission(role, p));
};

export const getRolePermissions = (role: AdminRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export const getRoleDisplayName = (role: AdminRole): string => {
  const names: Record<AdminRole, string> = {
    REGISTRAR: 'Registrar',
    DEAN: 'Dean',
    DIRECTOR: 'Director',
    EXECUTIVE: 'Executive',
  };
  return names[role] || role;
};

export const isReadOnlyRole = (role: AdminRole): boolean => {
  return role === 'EXECUTIVE';
};

