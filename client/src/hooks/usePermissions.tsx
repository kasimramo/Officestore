import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export interface Permission {
  category: string;
  action: string;
  description: string;
  scope: string;
  fullName: string;
}

export interface PermissionCheck {
  permission: string;
  allowed: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to get all permissions for the current user
 * @param siteId - Optional site ID for site-scoped permissions
 * @param areaId - Optional area ID for area-scoped permissions
 */
export function usePermissions(siteId?: string, areaId?: string) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (siteId) params.append('siteId', siteId);
        if (areaId) params.append('areaId', areaId);

        const response: any = await api.get(`/api/users/me?${params.toString()}`);

        if (response.success) {
          setPermissions(response.data.permissions);
        } else {
          throw new Error(response.error?.message || 'Failed to fetch permissions');
        }
      } catch (err: any) {
        console.error('Error fetching permissions:', err);
        setError(err.message || 'Failed to fetch permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [siteId, areaId]);

  /**
   * Check if user has a specific permission
   * @param permission - Permission to check (e.g., "inventory.view_stock_levels")
   */
  const hasPermission = (permission: string): boolean => {
    return permissions.some(p => p.fullName === permission);
  };

  /**
   * Check if user has ANY of the specified permissions
   * @param permissionList - Array of permissions to check
   */
  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  };

  /**
   * Check if user has ALL of the specified permissions
   * @param permissionList - Array of permissions to check
   */
  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  };

  /**
   * Get all permissions for a specific category
   * @param category - Category name (e.g., "inventory", "requests")
   */
  const getPermissionsByCategory = (category: string): Permission[] => {
    return permissions.filter(p => p.category === category);
  };

  /**
   * Check if user has Super Admin access (full_admin_access)
   */
  const isSuperAdmin = (): boolean => {
    return hasPermission('system.full_admin_access');
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionsByCategory,
    isSuperAdmin,
  };
}

/**
 * Hook to check a specific permission (lighter than usePermissions)
 * @param permission - Permission to check (e.g., "inventory.view_stock_levels")
 * @param siteId - Optional site ID
 * @param areaId - Optional area ID
 */
export function usePermissionCheck(permission: string, siteId?: string, areaId?: string) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (siteId) params.append('siteId', siteId);
        if (areaId) params.append('areaId', areaId);

        const response: any = await api.get(`/api/users/me/can/${permission}?${params.toString()}`);

        if (response.success) {
          setAllowed(response.data.allowed);
        } else {
          throw new Error(response.error?.message || 'Failed to check permission');
        }
      } catch (err: any) {
        console.error('Error checking permission:', err);
        setError(err.message || 'Failed to check permission');
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    if (permission) {
      checkPermission();
    }
  }, [permission, siteId, areaId]);

  return { allowed, loading, error };
}

/**
 * Component to conditionally render children based on permission
 * @example
 * <RequirePermission permission="inventory.view_stock_levels">
 *   <StockLevelDisplay />
 * </RequirePermission>
 */
export function RequirePermission({
  permission,
  children,
  fallback = null,
  siteId,
  areaId,
}: {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  siteId?: string;
  areaId?: string;
}) {
  const { hasPermission, hasAnyPermission, loading } = usePermissions(siteId, areaId);

  if (loading) {
    return null; // or a loading spinner
  }

  const allowed = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission);

  return allowed ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component to require ALL of the specified permissions
 * @example
 * <RequireAllPermissions permissions={["inventory.view_stock_levels", "inventory.adjust_stock"]}>
 *   <InventoryManagement />
 * </RequireAllPermissions>
 */
export function RequireAllPermissions({
  permissions,
  children,
  fallback = null,
  siteId,
  areaId,
}: {
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  siteId?: string;
  areaId?: string;
}) {
  const { hasAllPermissions, loading } = usePermissions(siteId, areaId);

  if (loading) {
    return null;
  }

  return hasAllPermissions(permissions) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component to require Super Admin access
 * @example
 * <RequireSuperAdmin>
 *   <SystemSettings />
 * </RequireSuperAdmin>
 */
export function RequireSuperAdmin({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isSuperAdmin, loading } = usePermissions();

  if (loading) {
    return null;
  }

  return isSuperAdmin() ? <>{children}</> : <>{fallback}</>;
}
