import React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {Permission, hasPermission, hasAnyPermission} from '../../config/permissions';

type Props = {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

const PermissionGate = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: Props) => {
  const adminRole = useSelector((state: RootState) => state.auth.user?.adminRole);

  if (!adminRole) {
    return <>{fallback}</>;
  }

  if (permission) {
    if (!hasPermission(adminRole, permission)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  if (permissions && permissions.length > 0) {
    if (requireAll) {
      const hasAll = permissions.every(p => hasPermission(adminRole, p));
      if (!hasAll) {
        return <>{fallback}</>;
      }
    } else {
      if (!hasAnyPermission(adminRole, permissions)) {
        return <>{fallback}</>;
      }
    }
  }

  return <>{children}</>;
};

export default PermissionGate;

export const usePermission = (permission: Permission): boolean => {
  const adminRole = useSelector((state: RootState) => state.auth.user?.adminRole);
  return hasPermission(adminRole, permission);
};

export const useAnyPermission = (permissions: Permission[]): boolean => {
  const adminRole = useSelector((state: RootState) => state.auth.user?.adminRole);
  return hasAnyPermission(adminRole, permissions);
};

