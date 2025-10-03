import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { roles } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get all roles for organization
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_ORGANIZATION',
          message: 'User must be associated with an organization'
        }
      });
    }

    const allRoles = await db
      .select()
      .from(roles)
      .where(eq(roles.organization_id, organizationId));

    const formattedRoles = allRoles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isActive: role.is_active,
      createdAt: role.created_at.toISOString(),
      updatedAt: role.updated_at.toISOString()
    }));

    res.json({
      success: true,
      data: formattedRoles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ROLES_ERROR',
        message: 'Failed to fetch roles'
      }
    });
  }
});

// Create new role
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role name is required'
        }
      });
    }

    const user = (req as any).user;
    const organizationId = user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_ORGANIZATION',
          message: 'User must be associated with an organization'
        }
      });
    }

    // Check if role with same name already exists for this organization
    const existingRole = await db
      .select()
      .from(roles)
      .where(and(eq(roles.organization_id, organizationId), eq(roles.name, name)))
      .limit(1);

    if (existingRole.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ROLE_EXISTS',
          message: 'A role with this name already exists'
        }
      });
    }

    const newRole = await db
      .insert(roles)
      .values({
        id: randomUUID(),
        organization_id: organizationId,
        name,
        description: description || null,
        permissions: permissions || {},
        is_active: true
      })
      .returning();

    const roleData = {
      id: newRole[0].id,
      name: newRole[0].name,
      description: newRole[0].description,
      permissions: newRole[0].permissions,
      isActive: newRole[0].is_active,
      createdAt: newRole[0].created_at.toISOString(),
      updatedAt: newRole[0].updated_at.toISOString()
    };

    res.status(201).json({
      success: true,
      data: roleData
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ROLE_ERROR',
        message: 'Failed to create role'
      }
    });
  }
});

// Update role
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role name is required'
        }
      });
    }

    const user = (req as any).user;
    const organizationId = user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_ORGANIZATION',
          message: 'User must be associated with an organization'
        }
      });
    }

    // Verify the role exists and belongs to the organization
    const existingRole = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), eq(roles.organization_id, organizationId)))
      .limit(1);

    if (existingRole.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      });
    }

    // Check if another role with same name exists (excluding current role)
    const duplicateRole = await db
      .select()
      .from(roles)
      .where(and(
        eq(roles.organization_id, organizationId),
        eq(roles.name, name)
      ))
      .limit(1);

    if (duplicateRole.length > 0 && duplicateRole[0].id !== id) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ROLE_EXISTS',
          message: 'A role with this name already exists'
        }
      });
    }

    const updatedRole = await db
      .update(roles)
      .set({
        name,
        description: description || null,
        permissions: permissions || {},
        updated_at: new Date()
      })
      .where(eq(roles.id, id))
      .returning();

    const roleData = {
      id: updatedRole[0].id,
      name: updatedRole[0].name,
      description: updatedRole[0].description,
      permissions: updatedRole[0].permissions,
      isActive: updatedRole[0].is_active,
      createdAt: updatedRole[0].created_at.toISOString(),
      updatedAt: updatedRole[0].updated_at.toISOString()
    };

    res.json({
      success: true,
      data: roleData
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ROLE_ERROR',
        message: 'Failed to update role'
      }
    });
  }
});

// Toggle role status
router.patch('/:id/toggle-status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = (req as any).user;
    const organizationId = user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_ORGANIZATION',
          message: 'User must be associated with an organization'
        }
      });
    }

    // Verify the role exists and belongs to the organization
    const existingRole = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), eq(roles.organization_id, organizationId)))
      .limit(1);

    if (existingRole.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      });
    }

    const newStatus = !existingRole[0].is_active;

    const updatedRole = await db
      .update(roles)
      .set({
        is_active: newStatus,
        updated_at: new Date()
      })
      .where(eq(roles.id, id))
      .returning();

    const roleData = {
      id: updatedRole[0].id,
      name: updatedRole[0].name,
      description: updatedRole[0].description,
      permissions: updatedRole[0].permissions,
      isActive: updatedRole[0].is_active,
      createdAt: updatedRole[0].created_at.toISOString(),
      updatedAt: updatedRole[0].updated_at.toISOString()
    };

    res.json({
      success: true,
      data: roleData
    });
  } catch (error) {
    console.error('Error toggling role status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TOGGLE_ROLE_STATUS_ERROR',
        message: 'Failed to toggle role status'
      }
    });
  }
});

// Delete role (soft delete by setting inactive)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = (req as any).user;
    const organizationId = user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_ORGANIZATION',
          message: 'User must be associated with an organization'
        }
      });
    }

    // Verify the role exists and belongs to the organization
    const existingRole = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), eq(roles.organization_id, organizationId)))
      .limit(1);

    if (existingRole.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      });
    }

    // Soft delete by setting is_active to false
    await db
      .update(roles)
      .set({
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(roles.id, id));

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ROLE_ERROR',
        message: 'Failed to delete role'
      }
    });
  }
});

export { router as rolesRouter };
