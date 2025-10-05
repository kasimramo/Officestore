// Permission API endpoints
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';
import { getUserPermissions, userHasPermission } from '../helpers/permissionHelper.js';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/permissions
 * List all available permissions (grouped by category)
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT
          id,
          category,
          action,
          description,
          is_system
        FROM permissions
        ORDER BY category, action
      `);

      // Normalize drizzle response (array) vs node-postgres style (rows)
      const rows = Array.isArray(result) ? result : (result as any).rows || [];

      // Group by category
      const grouped: Record<string, any[]> = {};
      rows.forEach((perm: any) => {
        if (!grouped[perm.category]) {
          grouped[perm.category] = [];
        }
        grouped[perm.category].push({
          id: perm.id,
          action: perm.action,
          description: perm.description,
          isSystem: perm.is_system
        });
      });

      res.json({
        success: true,
        data: grouped
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_PERMISSIONS_FAILED',
          message: 'Failed to fetch permissions'
        }
      });
    }
  }
);

/**
 * GET /api/permissions/categories
 * Get list of permission categories
 */
router.get(
  '/categories',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT DISTINCT category
        FROM permissions
        ORDER BY category
      `);

      const rows = Array.isArray(result) ? result : (result as any).rows || [];

      res.json({
        success: true,
        data: rows.map((row: any) => row.category)
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_CATEGORIES_FAILED',
          message: 'Failed to fetch permission categories'
        }
      });
    }
  }
);

/**
 * GET /api/users/:userId/permissions
 * Get all effective permissions for a user
 */
router.get(
  '/users/:userId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { siteId, areaId } = req.query;

      // Users can only view their own permissions unless they have user management permission
      const canViewOthers = await userHasPermission(
        req.user!.userId,
        'users_roles.view_users'
      );

      if (userId !== req.user!.userId && !canViewOthers) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Cannot view other users\' permissions'
          }
        });
        return;
      }

      const permissions = await getUserPermissions(
        userId,
        siteId as string | undefined,
        areaId as string | undefined
      );

      res.json({
        success: true,
        data: {
          userId,
          permissions: permissions.map(p => ({
            category: p.category,
            action: p.action,
            description: p.description,
            scope: p.scope,
            fullName: `${p.category}.${p.action}`
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_USER_PERMISSIONS_FAILED',
          message: 'Failed to fetch user permissions'
        }
      });
    }
  }
);

/**
 * GET /api/users/me/permissions
 * Get current user's permissions
 */
// Handler to fetch current user's permissions
async function handleGetMyPermissions(req: Request, res: Response) {
    try {
      const { siteId, areaId } = req.query;
      const userId = req.user!.userId;

      const permissions = await getUserPermissions(
        userId,
        siteId as string | undefined,
        areaId as string | undefined
      );
      // Debug: log count
      try { console.log('[api] /users/me permissions count:', Array.isArray(permissions) ? permissions.length : 'n/a') } catch {}

      res.json({
        success: true,
        data: {
          userId,
          permissions: permissions.map(p => ({
            category: p.category,
            action: p.action,
            description: p.description,
            scope: p.scope,
            fullName: `${p.category}.${p.action}`
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching own permissions:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_OWN_PERMISSIONS_FAILED',
          message: 'Failed to fetch your permissions'
        }
      });
    }
}

// Primary route
router.get('/me', requireAuth, handleGetMyPermissions);

// Backward-compatible alias: /me/permissions
router.get('/me/permissions', requireAuth, handleGetMyPermissions);

/**
 * GET /api/users/me/can/:permission
 * Check if current user has a specific permission
 */
router.get(
  '/me/can/:permission',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { permission } = req.params;
      const { siteId, areaId } = req.query;
      const userId = req.user!.userId;

      const hasPermission = await userHasPermission(
        userId,
        permission,
        siteId as string | undefined,
        areaId as string | undefined
      );

      res.json({
        success: true,
        data: {
          permission,
          allowed: hasPermission,
          userId
        }
      });
    } catch (error) {
      console.error('Error checking permission:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: 'Failed to check permission'
        }
      });
    }
  }
);

export default router;
