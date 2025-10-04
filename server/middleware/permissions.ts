// Permission checking middleware
import { Request, Response, NextFunction } from 'express';
import { userHasPermission, userHasAnyPermission, userHasAllPermissions } from '../helpers/permissionHelper.js';

/**
 * Middleware to check if user has a specific permission
 * @param permission - Permission in format "category.action" (e.g., "inventory.adjust_stock")
 * @param mode - 'any' or 'all' for multiple permissions (default: 'any')
 */
export function checkPermission(
  permission: string | string[],
  mode: 'any' | 'all' = 'any'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      try { console.log('[perm] checkPermission for', req.method, req.originalUrl, 'need:', Array.isArray(permission)? permission.join(',') : permission) } catch {}
      // Ensure user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      const userId = req.user.userId;
      const permissions = Array.isArray(permission) ? permission : [permission];

      // Admin role override: treat platform/org admins as having all permissions
      // This ensures critical admin pages (e.g., Roles, Users) load even if DB RBAC is in transition
      if ((req.user as any).role === 'ADMIN') {
        return next();
      }

      // Get site/area from request params or body if applicable
      const siteId = req.params.siteId || req.body.siteId;
      const areaId = req.params.areaId || req.body.areaId;

      let hasPermission = false;

      if (mode === 'any') {
        hasPermission = await userHasAnyPermission(userId, permissions, siteId, areaId);
      } else {
        hasPermission = await userHasAllPermissions(userId, permissions, siteId, areaId);
      }

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Missing required permission${permissions.length > 1 ? 's' : ''}: ${permissions.join(', ')}`
          }
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: 'Failed to verify permissions'
        }
      });
    }
  };
}

/**
 * Middleware to check if user has at least one of the specified permissions
 */
export function requireAnyPermission(...permissions: string[]) {
  return checkPermission(permissions, 'any');
}

/**
 * Middleware to check if user has all of the specified permissions
 */
export function requireAllPermissions(...permissions: string[]) {
  return checkPermission(permissions, 'all');
}

/**
 * Common permission middleware combinations
 */

// Inventory permissions
export const canViewInventory = checkPermission('inventory.view_stock_levels');
export const canAdjustStock = checkPermission('inventory.adjust_stock');
export const canManageInventory = requireAllPermissions(
  'inventory.view_stock_levels',
  'inventory.adjust_stock'
);

// Request permissions
export const canCreateRequest = checkPermission('requests.create_request');
export const canViewAllRequests = checkPermission('requests.view_all_requests');
export const canApproveRequests = checkPermission('requests.approve_requests');
export const canFulfillRequests = checkPermission('requests.fulfill_requests');

// Procurement permissions
export const canManageProcurement = requireAnyPermission(
  'procurement.create_pr',
  'procurement.edit_pr',
  'procurement.approve_pr'
);

// Catalogue permissions
export const canViewCatalogue = checkPermission('catalogue.view_catalogue');
export const canManageCatalogue = requireAnyPermission(
  'catalogue.create_items',
  'catalogue.edit_items',
  'catalogue.delete_items'
);

// Site/Area permissions
export const canManageSites = requireAnyPermission(
  'sites_areas.create_sites',
  'sites_areas.edit_sites',
  'sites_areas.delete_sites'
);

// User/Role permissions
export const canManageUsers = requireAnyPermission(
  'users_roles.create_users',
  'users_roles.edit_users',
  'users_roles.deactivate_users'
);

export const canManageRoles = requireAnyPermission(
  'users_roles.view_roles',
  'users_roles.create_roles',
  'users_roles.edit_roles'
);

// Workflow permissions
export const canManageWorkflows = requireAnyPermission(
  'workflows.create_workflows',
  'workflows.edit_workflows',
  'workflows.delete_workflows'
);

// System admin
export const requireSuperAdmin = checkPermission('system.full_admin_access');
