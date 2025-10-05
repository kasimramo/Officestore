// Roles API endpoints (RBAC System)
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/roles
 * List all roles in the organization
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      console.log('[roles] GET /api/roles for user', req.user?.userId)
      const organizationId = req.user!.organizationId;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_ORGANIZATION',
            message: 'User must be associated with an organization'
          }
        });
        return;
      }

      const result = await db.execute(sql`
        SELECT
          r.id,
          r.name,
          r.description,
          r.scope,
          r.color,
          r.is_system,
          r.created_at,
          r.updated_at,
          COUNT(DISTINCT rp.permission_id) as permission_count,
          COUNT(DISTINCT ur.user_id) as user_count
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        WHERE r.organization_id = ${organizationId}::uuid
        GROUP BY r.id, r.name, r.description, r.scope, r.color, r.is_system, r.created_at, r.updated_at
        ORDER BY r.is_system DESC, r.name ASC
      `);

      const rows: any[] = Array.isArray(result) ? (result as any[]) : (result as any).rows || []
      console.log('[roles] roles fetched count:', rows.length)

      res.json({
        success: true,
        data: rows.map((role: any) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          scope: role.scope,
          color: role.color,
          isSystem: role.is_system,
          permissionCount: parseInt(role.permission_count),
          userCount: parseInt(role.user_count),
          createdAt: role.created_at,
          updatedAt: role.updated_at
        }))
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ROLES_FAILED',
          message: 'Failed to fetch roles'
        }
      });
    }
  }
);

/**
 * GET /api/roles/templates
 * Get pre-built role templates (system roles from any org as templates)
 */
router.get(
  '/templates',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT DISTINCT
          r.id,
          r.name,
          r.description,
          r.scope,
          r.color,
          r.organization_id,
          COUNT(rp.permission_id) as permission_count
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        WHERE r.is_system = true
        GROUP BY r.id, r.name, r.description, r.scope, r.color, r.organization_id
        ORDER BY r.name
      `);

      const rows = Array.isArray(result) ? (result as any[]) : (result as any).rows || [];

      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error fetching role templates:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_TEMPLATES_FAILED',
          message: 'Failed to fetch role templates'
        }
      });
    }
  }
);

/**
 * GET /api/roles/:id
 * Get role details including permissions
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      // Get role details
      const roleResult = await db.execute(sql`
        SELECT
          r.id,
          r.organization_id,
          r.name,
          r.description,
          r.scope,
          r.color,
          r.is_system,
          r.created_at,
          r.updated_at
        FROM roles r
        WHERE r.id = ${id}::uuid
        AND r.organization_id = ${organizationId}::uuid
      `);

      const role = roleResult.rows[0];

      if (!role) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found'
          }
        });
        return;
      }

      // Get role permissions
      const permissions = await db.execute(sql`
        SELECT
          p.id,
          p.category,
          p.action,
          p.description
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ${id}::uuid
        ORDER BY p.category, p.action
      `);

      res.json({
        success: true,
        data: {
          ...role,
          permissions: permissions.rows.map((p: any) => ({
            id: p.id,
            category: p.category,
            action: p.action,
            description: p.description,
            fullName: `${p.category}.${p.action}`
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ROLE_FAILED',
          message: 'Failed to fetch role'
        }
      });
    }
  }
);

/**
 * POST /api/roles
 * Create a new custom role
 */
router.post(
  '/',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { name, description, scope = 'organization', color = '#10B981', permissions = [] } = req.body;
      const organizationId = req.user!.organizationId;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_ORGANIZATION',
            message: 'User must be associated with an organization'
          }
        });
        return;
      }

      if (!name) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_NAME',
            message: 'Role name is required'
          }
        });
        return;
      }

      // Validate scope
      if (!['organization', 'site', 'area'].includes(scope)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SCOPE',
            message: 'Scope must be organization, site, or area'
          }
        });
        return;
      }

      // Check if role name already exists in this org
      const existingResult = await db.execute(sql`
        SELECT id FROM roles
        WHERE organization_id = ${organizationId}::uuid
        AND name = ${name}
      `);

      if (existingResult.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: {
            code: 'ROLE_EXISTS',
            message: 'A role with this name already exists'
          }
        });
        return;
      }

      // Create role
      const roleResult = await db.execute(sql`
        INSERT INTO roles (organization_id, name, description, scope, color, is_system)
        VALUES (
          ${organizationId}::uuid,
          ${name},
          ${description || null},
          ${scope},
          ${color},
          false
        )
        RETURNING id, name, description, scope, color, is_system, created_at, updated_at
      `);

      const newRole = roleResult.rows[0];

      // Add permissions if provided
      if (permissions.length > 0) {
        for (const permFullName of permissions) {
          const [category, action] = permFullName.split('.');
          if (!category || !action) continue;

          const permResult = await db.execute(sql`
            SELECT id FROM permissions
            WHERE category = ${category} AND action = ${action}
          `);

          if (permResult.rows.length > 0) {
            await db.execute(sql`
              INSERT INTO role_permissions (role_id, permission_id)
              VALUES (${newRole.id}::uuid, ${permResult.rows[0].id}::uuid)
              ON CONFLICT DO NOTHING
            `);
          }
        }
      }

      // Log in audit
      await db.execute(sql`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_value)
        VALUES (
          ${req.user!.userId}::uuid,
          'role_created',
          'role',
          ${newRole.id}::uuid,
          ${JSON.stringify(newRole)}::jsonb
        )
      `);

      res.status(201).json({
        success: true,
        data: newRole
      });
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_ROLE_FAILED',
          message: 'Failed to create role'
        }
      });
    }
  }
);

/**
 * PUT /api/roles/:id
 * Update a custom role
 */
router.put(
  '/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, scope, color, permissions } = req.body;
      const organizationId = req.user!.organizationId;

      // Get existing role
      const existingResult = await db.execute(sql`
        SELECT * FROM roles
        WHERE id = ${id}::uuid AND organization_id = ${organizationId}::uuid
      `);

      if (existingResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found'
          }
        });
        return;
      }

      const existing = existingResult.rows[0];

      // Cannot modify system roles
      if ((existing as any).is_system) {
        res.status(403).json({
          success: false,
          error: {
            code: 'CANNOT_MODIFY_SYSTEM_ROLE',
            message: 'System roles cannot be modified'
          }
        });
        return;
      }

      // Update role
      const updateResult = await db.execute(sql`
        UPDATE roles
        SET
          name = COALESCE(${name}, name),
          description = COALESCE(${description}, description),
          scope = COALESCE(${scope}, scope),
          color = COALESCE(${color}, color),
          updated_at = NOW()
        WHERE id = ${id}::uuid
        RETURNING *
      `);

      const updated = updateResult.rows[0];

      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
        // Delete existing permissions
        await db.execute(sql`
          DELETE FROM role_permissions WHERE role_id = ${id}::uuid
        `);

        // Add new permissions
        for (const permFullName of permissions) {
          const [category, action] = permFullName.split('.');
          if (!category || !action) continue;

          const permResult = await db.execute(sql`
            SELECT id FROM permissions
            WHERE category = ${category} AND action = ${action}
          `);

          if (permResult.rows.length > 0) {
            await db.execute(sql`
              INSERT INTO role_permissions (role_id, permission_id)
              VALUES (${id}::uuid, ${permResult.rows[0].id}::uuid)
              ON CONFLICT DO NOTHING
            `);
          }
        }
      }

      // Log in audit
      await db.execute(sql`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_value, new_value)
        VALUES (
          ${req.user!.userId}::uuid,
          'role_updated',
          'role',
          ${id}::uuid,
          ${JSON.stringify(existing)}::jsonb,
          ${JSON.stringify(updated)}::jsonb
        )
      `);

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ROLE_FAILED',
          message: 'Failed to update role'
        }
      });
    }
  }
);

/**
 * DELETE /api/roles/:id
 * Delete a custom role
 */
router.delete(
  '/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      // Get existing role
      const existingResult = await db.execute(sql`
        SELECT * FROM roles
        WHERE id = ${id}::uuid AND organization_id = ${organizationId}::uuid
      `);

      if (existingResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found'
          }
        });
        return;
      }

      const existing = existingResult.rows[0];

      // Cannot delete system roles
      if ((existing as any).is_system) {
        res.status(403).json({
          success: false,
          error: {
            code: 'CANNOT_DELETE_SYSTEM_ROLE',
            message: 'System roles cannot be deleted'
          }
        });
        return;
      }

      // Check if role is assigned to users
      const userCountResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM user_roles WHERE role_id = ${id}::uuid
      `);

      if (parseInt((userCountResult.rows[0] as any).count) > 0) {
        res.status(409).json({
          success: false,
          error: {
            code: 'ROLE_IN_USE',
            message: 'Cannot delete role that is assigned to users'
          }
        });
        return;
      }

      // Delete role (CASCADE will delete role_permissions)
      await db.execute(sql`
        DELETE FROM roles WHERE id = ${id}::uuid
      `);

      // Log in audit
      await db.execute(sql`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_value)
        VALUES (
          ${req.user!.userId}::uuid,
          'role_deleted',
          'role',
          ${id}::uuid,
          ${JSON.stringify(existing)}::jsonb
        )
      `);

      res.json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_ROLE_FAILED',
          message: 'Failed to delete role'
        }
      });
    }
  }
);

/**
 * POST /api/roles/:id/clone
 * Clone an existing role
 */
router.post(
  '/:id/clone',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const organizationId = req.user!.organizationId;

      if (!name) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_NAME',
            message: 'New role name is required'
          }
        });
        return;
      }

      // Get original role
      const originalResult = await db.execute(sql`
        SELECT * FROM roles WHERE id = ${id}::uuid AND organization_id = ${organizationId}::uuid
      `);

      if (originalResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role to clone not found'
          }
        });
        return;
      }

      const original = originalResult.rows[0] as any;

      // Create cloned role
      const clonedResult = await db.execute(sql`
        INSERT INTO roles (organization_id, name, description, scope, color, is_system)
        VALUES (
          ${organizationId}::uuid,
          ${name},
          ${original.description},
          ${original.scope},
          ${original.color},
          false
        )
        RETURNING *
      `);

      const cloned = clonedResult.rows[0];

      // Copy permissions
      await db.execute(sql`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT ${(cloned as any).id}::uuid, permission_id
        FROM role_permissions
        WHERE role_id = ${id}::uuid
      `);

      res.status(201).json({
        success: true,
        data: cloned
      });
    } catch (error) {
      console.error('Error cloning role:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CLONE_ROLE_FAILED',
          message: 'Failed to clone role'
        }
      });
    }
  }
);

export { router as rolesRouter };
