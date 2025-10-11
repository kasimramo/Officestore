import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

export interface Permission {
  category: string;
  action: string;
  description: string;
  scope: string;
  fullName: string;
}

interface PermissionsContextType {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissionList: string[]) => boolean;
  hasAllPermissions: (permissionList: string[]) => boolean;
  getPermissionsByCategory: (category: string) => Permission[];
  isSuperAdmin: () => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    // Only fetch if we have an auth token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: any = await api.get('/api/users/me');

      if (response.success) {
        setPermissions(response.data.permissions || []);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch permissions');
      }
    } catch (err: any) {
      // Check if it's an authentication error (session expired)
      if (err.message?.includes('session has expired') || err.message?.includes('expired') || err.message?.includes('Authentication')) {
        // Don't show error, just clear permissions - auth provider will handle redirect
        console.log('[Permissions] Auth token expired, clearing permissions');
        setPermissions([]);
        setError(null); // Don't show error to user
      } else {
        console.error('Error fetching permissions:', err);
        setError(err.message || 'Failed to fetch permissions');
        setPermissions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for auth token changes
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      if (token && permissions.length === 0 && !loading) {
        fetchPermissions();
      } else if (!token) {
        setPermissions([]);
        setLoading(false);
      }
    };

    // Check immediately
    checkAuth();

    // Listen for storage events (when token is set in another tab/window)
    window.addEventListener('storage', checkAuth);

    // Also check periodically (for same-tab token updates)
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, [permissions.length, loading]);

  const hasPermission = (permission: string): boolean => {
    return permissions.some(p => p.fullName === permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  };

  const getPermissionsByCategory = (category: string): Permission[] => {
    return permissions.filter(p => p.category === category);
  };

  const isSuperAdmin = (): boolean => {
    return hasPermission('system.full_admin_access');
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        loading,
        error,
        refetch: fetchPermissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        getPermissionsByCategory,
        isSuperAdmin,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }
  return context;
}
