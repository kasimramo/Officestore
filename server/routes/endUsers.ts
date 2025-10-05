import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';
import { db } from '../db/index.js';
import { endUsers, endUserSites, endUserAreas, endUserCategories, sites, areas, categories, roles, users } from '../db/schema.js';
import { eq, and, or, inArray, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/end-users - Get all end users for the organization
router.get('/', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;

    // Get all end users with their site, area, and category access
    const usersResult = await db
      .select()
      .from(endUsers)
      .where(eq(endUsers.organization_id, organizationId));

    // For each user, get their sites, areas, and categories
    const usersWithAccess = await Promise.all(
      usersResult.map(async (user) => {
        const userSites = await db
          .select({ site: sites })
          .from(endUserSites)
          .innerJoin(sites, eq(sites.id, endUserSites.site_id))
          .where(eq(endUserSites.end_user_id, user.id));

        const userAreas = await db
          .select({ area: areas })
          .from(endUserAreas)
          .innerJoin(areas, eq(areas.id, endUserAreas.area_id))
          .where(eq(endUserAreas.end_user_id, user.id));

        const userCategories = await db
          .select({ category: categories })
          .from(endUserCategories)
          .innerJoin(categories, eq(categories.id, endUserCategories.category_id))
          .where(eq(endUserCategories.end_user_id, user.id));

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role, // Keep legacy role for backward compatibility
          roleId: user.role_id, // New role reference
          isActive: user.is_active,
          forcePasswordChange: user.force_password_change,
          lastLoginAt: user.last_login_at,
          createdAt: user.created_at,
          sites: userSites.map(s => ({ id: s.site.id, name: s.site.name })),
          areas: userAreas.map(a => ({ id: a.area.id, name: a.area.name })),
          categories: userCategories.map(c => ({ id: c.category.id, name: c.category.name }))
        };
      })
    );

    res.json({
      success: true,
      data: usersWithAccess
    });
  } catch (error) {
    console.error('Error fetching end users:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch end users' }
    });
  }
});

// POST /api/end-users - Create a new end user (without role/site, assign later)
router.post('/', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const adminId = req.user!.userId;
    const { username, email, firstName, lastName, password } = req.body;

    // Validate required fields
    if (!username || !firstName || !lastName || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if username already exists in this organization
    const existingUser = await db
      .select()
      .from(endUsers)
      .where(
        and(
          eq(endUsers.username, username),
          eq(endUsers.organization_id, organizationId)
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get default STAFF role for the organization
    const defaultRole = await db
      .select()
      .from(roles)
      .where(and(eq(roles.organization_id, organizationId), eq(roles.name, 'STAFF')))
      .limit(1);

    if (defaultRole.length === 0) {
      return res.status(500).json({ error: 'Default STAFF role not found. Please create roles first.' });
    }

    // Create user with default STAFF role
    const [newUser] = await db
      .insert(endUsers)
      .values({
        organization_id: organizationId,
        username,
        email: email || null,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: 'STAFF', // Keep legacy role for backward compatibility
        role_id: defaultRole[0].id, // Assign default STAFF role
        is_active: true,
        force_password_change: true, // Always force password change on first login
        created_by: adminId
      })
      .returning();

    // Sync to main users table (insert or update)
    const condition = email
      ? or(eq(users.username, username), eq(users.email, email))
      : eq(users.username, username);
    const [existingMain] = await db
      .select()
      .from(users)
      .where(condition)
      .limit(1);

    if (existingMain) {
      await db
        .update(users)
        .set({
          email: email || existingMain.email || null,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          role: 'STAFF',
          role_id: defaultRole[0].id,
          organization_id: organizationId,
          is_active: true,
          force_password_change: true,
          updated_at: new Date(),
        })
        .where(eq(users.id, existingMain.id));
    } else {
      await db.insert(users).values({
        username,
        email: email || null,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: 'STAFF' as any,
        role_id: defaultRole[0].id,
        organization_id: organizationId,
        is_active: true,
        email_verified: false,
        force_password_change: true,
        created_by: adminId,
      });
    }

    // Ensure a base org-level role assignment exists in user_roles
    const [mainUser] = await db
      .select()
      .from(users)
      .where(or(eq(users.username, username), email ? eq(users.email, email) : eq(users.username, '__no_match__')))
      .limit(1)

    if (mainUser) {
      await db.execute(sql`
        INSERT INTO user_roles (user_id, role_id, site_id, area_id)
        SELECT ${mainUser.id}::uuid, ${defaultRole[0].id}::uuid, NULL::uuid, NULL::uuid
        WHERE NOT EXISTS (
          SELECT 1 FROM user_roles WHERE user_id = ${mainUser.id}::uuid AND role_id = ${defaultRole[0].id}::uuid AND site_id IS NULL AND area_id IS NULL
        )
      `)
    }

    res.status(201).json({
      success: true,
      data: {
        endUser: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role,
          roleId: newUser.role_id,
          isActive: newUser.is_active,
          forcePasswordChange: newUser.force_password_change,
          createdAt: newUser.created_at,
          sites: [],
          areas: [],
          categories: []
        }
      }
    });
  } catch (error) {
    console.error('Error creating end user:', error);
    res.status(500).json({ error: 'Failed to create end user' });
  }
});

// PUT /api/end-users/:id - Update end user (basic info and role only)
router.put('/:id', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const userId = req.params.id;
    const { firstName, lastName, email, role } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate role
    const validRoles = ['STAFF', 'PROCUREMENT', 'APPROVER_L1', 'APPROVER_L2'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Update user
    const [updatedUser] = await db
      .update(endUsers)
      .set({
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        role,
        updated_at: new Date()
      })
      .where(
        and(
          eq(endUsers.id, userId),
          eq(endUsers.organization_id, organizationId)
        )
      )
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's access
    const userSites = await db
      .select({ site: sites })
      .from(endUserSites)
      .innerJoin(sites, eq(sites.id, endUserSites.site_id))
      .where(eq(endUserSites.end_user_id, updatedUser.id));

    const userAreas = await db
      .select({ area: areas })
      .from(endUserAreas)
      .innerJoin(areas, eq(areas.id, endUserAreas.area_id))
      .where(eq(endUserAreas.end_user_id, updatedUser.id));

    const userCategories = await db
      .select({ category: categories })
      .from(endUserCategories)
      .innerJoin(categories, eq(categories.id, endUserCategories.category_id))
      .where(eq(endUserCategories.end_user_id, updatedUser.id));

    res.json({
      endUser: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
        forcePasswordChange: updatedUser.force_password_change,
        lastLoginAt: updatedUser.last_login_at,
        createdAt: updatedUser.created_at,
        sites: userSites.map(s => ({ id: s.site.id, name: s.site.name })),
        areas: userAreas.map(a => ({ id: a.area.id, name: a.area.name })),
        categories: userCategories.map(c => ({ id: c.category.id, name: c.category.name }))
      }
    });
  } catch (error) {
    console.error('Error updating end user:', error);
    res.status(500).json({ error: 'Failed to update end user' });
  }
});

// POST /api/end-users/:id/reset-password - Reset user password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and force password change
    const [updatedUser] = await db
      .update(endUsers)
      .set({
        password_hash: passwordHash,
        force_password_change: true,
        updated_at: new Date()
      })
      .where(
        and(
          eq(endUsers.id, userId),
          eq(endUsers.organization_id, organizationId)
        )
      )
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// PUT /api/end-users/:id/toggle-status - Enable/Disable user
router.put('/:id/toggle-status', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const userId = req.params.id;

    // Get current user status
    const [currentUser] = await db
      .select()
      .from(endUsers)
      .where(
        and(
          eq(endUsers.id, userId),
          eq(endUsers.organization_id, organizationId)
        )
      )
      .limit(1);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Toggle status
    const [updatedUser] = await db
      .update(endUsers)
      .set({
        is_active: !currentUser.is_active,
        updated_at: new Date()
      })
      .where(
        and(
          eq(endUsers.id, userId),
          eq(endUsers.organization_id, organizationId)
        )
      )
      .returning();

    // Sync active flag in main users table
    await db
      .update(users)
      .set({ is_active: updatedUser.is_active, updated_at: new Date() })
      .where(or(eq(users.username, updatedUser.username), eq(users.email, updatedUser.email)));

    res.json({
      endUser: {
        id: updatedUser.id,
        isActive: updatedUser.is_active
      }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

// PUT /api/end-users/:id/access - Assign sites, areas, and categories to user
router.put('/:id/access', async (req, res) => {
  try {
    const organizationId = req.user!.organizationId;
    const userId = req.params.id;
    const { siteIds, areaIds, categoryIds } = req.body;

    // Validate user exists
    const [user] = await db
      .select()
      .from(endUsers)
      .where(
        and(
          eq(endUsers.id, userId),
          eq(endUsers.organization_id, organizationId)
        )
      )
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove existing access
    await db.delete(endUserSites).where(eq(endUserSites.end_user_id, userId));
    await db.delete(endUserAreas).where(eq(endUserAreas.end_user_id, userId));
    await db.delete(endUserCategories).where(eq(endUserCategories.end_user_id, userId));

    // Add new site access
    if (siteIds && siteIds.length > 0) {
      await db.insert(endUserSites).values(
        siteIds.map((siteId: string) => ({
          end_user_id: userId,
          site_id: siteId
        }))
      );
    }

    // Add new area access
    if (areaIds && areaIds.length > 0) {
      await db.insert(endUserAreas).values(
        areaIds.map((areaId: string) => ({
          end_user_id: userId,
          area_id: areaId
        }))
      );
    }

    // Add new category access
    if (categoryIds && categoryIds.length > 0) {
      await db.insert(endUserCategories).values(
        categoryIds.map((categoryId: string) => ({
          end_user_id: userId,
          category_id: categoryId
        }))
      );
    }

    // Get updated user with access
    const userSites = await db
      .select({ site: sites })
      .from(endUserSites)
      .innerJoin(sites, eq(sites.id, endUserSites.site_id))
      .where(eq(endUserSites.end_user_id, userId));

    const userAreas = await db
      .select({ area: areas })
      .from(endUserAreas)
      .innerJoin(areas, eq(areas.id, endUserAreas.area_id))
      .where(eq(endUserAreas.end_user_id, userId));

    const userCategories = await db
      .select({ category: categories })
      .from(endUserCategories)
      .innerJoin(categories, eq(categories.id, endUserCategories.category_id))
      .where(eq(endUserCategories.end_user_id, userId));

    res.json({
      endUser: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
        sites: userSites.map(s => ({ id: s.site.id, name: s.site.name })),
        areas: userAreas.map(a => ({ id: a.area.id, name: a.area.name })),
        categories: userCategories.map(c => ({ id: c.category.id, name: c.category.name }))
      }
    });
  } catch (error) {
    console.error('Error updating user access:', error);
    res.status(500).json({ error: 'Failed to update user access' });
  }
});

// GET /api/end-users/:id/roles - Get user's assigned roles
router.get('/:id/roles', checkPermission('users_roles.view_users'), async (req, res) => {
  try {
    const userId = req.params.id;
    const organizationId = req.user!.organizationId;

    // Verify user belongs to organization
    const [user] = await db
      .select()
      .from(endUsers)
      .where(and(eq(endUsers.id, userId), eq(endUsers.organization_id, organizationId)))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    // Get user's roles using raw SQL to access new RBAC tables
    const result = await db.execute(sql`
      SELECT
        r.id,
        r.name,
        r.description,
        r.scope,
        r.color,
        r.is_system,
        ur.site_id,
        ur.area_id,
        s.name as site_name,
        a.name as area_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN sites s ON ur.site_id = s.id
      LEFT JOIN areas a ON ur.area_id = a.id
      WHERE ur.user_id = ${userId}::uuid
      ORDER BY r.name
    `);

    res.json({
      success: true,
      data: result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        scope: row.scope,
        color: row.color,
        isSystem: row.is_system,
        siteId: row.site_id,
        areaId: row.area_id,
        siteName: row.site_name,
        areaName: row.area_name,
      }))
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_USER_ROLES_FAILED', message: 'Failed to fetch user roles' }
    });
  }
});

// POST /api/end-users/:id/roles - Assign roles to user
router.post('/:id/roles', checkPermission('users_roles.edit_users'), async (req, res) => {
  try {
    const userId = req.params.id;
    const organizationId = req.user!.organizationId;
    const { roles: roleAssignments } = req.body; // Array of { roleId, siteId?, areaId? }

    if (!Array.isArray(roleAssignments)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'roles must be an array' }
      });
    }

    // Verify user belongs to organization
    const [user] = await db
      .select()
      .from(endUsers)
      .where(and(eq(endUsers.id, userId), eq(endUsers.organization_id, organizationId)))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    // Remove existing role assignments
    await db.execute(sql`
      DELETE FROM user_roles WHERE user_id = ${userId}::uuid
    `);

    // Add new role assignments
    if (roleAssignments.length > 0) {
      for (const assignment of roleAssignments) {
        const { roleId, siteId, areaId } = assignment;

        // Verify role belongs to organization
        const roleCheck = await db.execute(sql`
          SELECT id FROM roles WHERE id = ${roleId}::uuid AND organization_id = ${organizationId}::uuid
        `);

        if (roleCheck.rows.length === 0) {
          continue; // Skip invalid roles
        }

        await db.execute(sql`
          INSERT INTO user_roles (user_id, role_id, site_id, area_id)
          VALUES (
            ${userId}::uuid,
            ${roleId}::uuid,
            ${siteId || null}::uuid,
            ${areaId || null}::uuid
          )
        `);
      }
    }

    // Fetch updated roles
    const result = await db.execute(sql`
      SELECT
        r.id,
        r.name,
        r.description,
        r.scope,
        r.color,
        r.is_system,
        ur.site_id,
        ur.area_id
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${userId}::uuid
      ORDER BY r.name
    `);

    res.json({
      success: true,
      data: result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        scope: row.scope,
        color: row.color,
        isSystem: row.is_system,
        siteId: row.site_id,
        areaId: row.area_id,
      })),
      message: 'User roles updated successfully'
    });
  } catch (error) {
    console.error('Error assigning user roles:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ASSIGN_ROLES_FAILED', message: 'Failed to assign roles' }
    });
  }
});

// DELETE /api/end-users/:id/roles/:roleId - Remove a specific role from user
router.delete('/:id/roles/:roleId', checkPermission('users_roles.edit_users'), async (req, res) => {
  try {
    const { id: userId, roleId } = req.params;
    const organizationId = req.user!.organizationId;

    // Verify user belongs to organization
    const [user] = await db
      .select()
      .from(endUsers)
      .where(and(eq(endUsers.id, userId), eq(endUsers.organization_id, organizationId)))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    // Remove the role assignment
    await db.execute(sql`
      DELETE FROM user_roles
      WHERE user_id = ${userId}::uuid AND role_id = ${roleId}::uuid
    `);

  res.json({
      success: true,
      message: 'Role removed from user successfully'
    });
  } catch (error) {
    console.error('Error removing user role:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REMOVE_ROLE_FAILED', message: 'Failed to remove role' }
    });
  }
});

export default router;
