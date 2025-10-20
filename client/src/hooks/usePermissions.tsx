import { useState, useEffect } from 'react';
import { usePermissionsContext } from '../contexts/PermissionsContext';
import { api } from '../lib/api';

export type { Permission } from '../contexts/PermissionsContext';

export interface PermissionCheck {
  permission: string;
  allowed: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to get all permissions for the current user (uses cached context)
 * @deprecated Use usePermissionsContext() directly for better performance
 */
export function usePermissions() {
  return usePermissionsContext();
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
}: {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission, hasAnyPermission, loading } = usePermissionsContext();

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
}: {
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasAllPermissions, loading } = usePermissionsContext();

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
  const { isSuperAdmin, loading } = usePermissionsContext();

  if (loading) {
    return null;
  }

  return isSuperAdmin() ? <>{children}</> : <>{fallback}</>;
}
