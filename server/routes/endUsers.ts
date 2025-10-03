import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { endUsers, endUserSites, endUserAreas, endUserCategories, sites, areas, categories, roles } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
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

export default router;
