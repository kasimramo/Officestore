// Permission helper functions
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

/**
 * Get all effective permissions for a user
 * Considers org/site/area scope
 */
export async function getUserPermissions(
  userId: string,
  siteId?: string,
  areaId?: string
): Promise<Array<{ category: string; action: string; description: string; scope: string }>> {
  try {
    console.log('[perm] getUserPermissions called for userId:', userId, 'siteId:', siteId, 'areaId:', areaId);

    // 1) Super admin detection WITHOUT site/area filters
    const superAdminRows = await db.execute(sql`
      SELECT 1
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ${userId}::uuid
        AND p.category = 'system'
        AND p.action = 'full_admin_access'
      LIMIT 1
    `);

    // Drizzle's db.execute() returns an array directly, not an object with .rows
    const hasSuperAdmin = Array.isArray(superAdminRows) && superAdminRows.length > 0;

    if (hasSuperAdmin) {
      // Return ALL permissions defined in the system for super admin
      const allPermissionsResult = await db.execute(sql`
        SELECT category, action, description, 'organization'::text as scope
        FROM permissions
        WHERE is_system = true OR category != 'system'
        ORDER BY category, action
      `);
      return (Array.isArray(allPermissionsResult) ? allPermissionsResult : []) as Array<{ category: string; action: string; description: string; scope: string }>;
    }

    // 2) Effective permissions for non-super-admins
    // If no site/area specified, include all assignments (org/site/area)
    let result;
    if (!siteId && !areaId) {
      result = await db.execute(sql`
        SELECT DISTINCT
          p.category,
          p.action,
          p.description,
          CASE
            WHEN ur.area_id IS NOT NULL THEN 'area'
            WHEN ur.site_id IS NOT NULL THEN 'site'
            ELSE 'organization'
          END::text AS scope
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ${userId}::uuid
        ORDER BY p.category, p.action
      `);
    } else {
      // Filtered by provided site/area
      result = await db.execute(sql`
        SELECT DISTINCT
          p.category,
          p.action,
          p.description,
          CASE
            WHEN ur.area_id IS NOT NULL THEN 'area'
            WHEN ur.site_id IS NOT NULL THEN 'site'
            ELSE 'organization'
          END::text AS scope
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ${userId}::uuid
          AND (
            (ur.site_id IS NULL AND ur.area_id IS NULL)
            OR (ur.site_id = ${siteId || null}::uuid AND ur.area_id IS NULL)
            OR (ur.area_id = ${areaId || null}::uuid)
          )
        ORDER BY p.category, p.action
      `);
    }

    return (Array.isArray(result) ? result : []) as Array<{ category: string; action: string; description: string; scope: string }>;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Check if user has a specific permission
 * @param userId - User ID
 * @param permission - Permission in format "category.action" (e.g., "inventory.adjust_stock")
 * @param siteId - Optional site ID for site-scoped checks
 * @param areaId - Optional area ID for area-scoped checks
 */
export async function userHasPermission(
  userId: string,
  permission: string,
  siteId?: string,
  areaId?: string
): Promise<boolean> {
  try {
    // Check if user has Super Admin permission (full_admin_access) via direct join
    const superAdminRows = await db.execute(sql`
      SELECT 1
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ${userId}::uuid
        AND p.category = 'system'
        AND p.action = 'full_admin_access'
      LIMIT 1
    `);

    if (Array.isArray(superAdminRows) && superAdminRows.length > 0) {
      return true; // Super Admin has all permissions
    }

    // Split permission into category.action
    const [category, action] = permission.split('.');
    if (!category || !action) {
      console.error(`Invalid permission format: ${permission}. Expected "category.action"`);
      return false;
    }

    // Direct permission existence check via joins
    let existsQuery;
    if (!siteId && !areaId) {
      existsQuery = await db.execute(sql`
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ${userId}::uuid
          AND p.category = ${category}
          AND p.action = ${action}
        LIMIT 1
      `);
    } else {
      existsQuery = await db.execute(sql`
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ${userId}::uuid
          AND p.category = ${category}
          AND p.action = ${action}
          AND (
            (ur.site_id IS NULL AND ur.area_id IS NULL)
            OR (ur.site_id = ${siteId || null}::uuid AND ur.area_id IS NULL)
            OR (ur.area_id = ${areaId || null}::uuid)
          )
        LIMIT 1
      `);
    }

    return Array.isArray(existsQuery) && existsQuery.length > 0;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

/**
 * Check if user has ANY of the specified permissions
 */
export async function userHasAnyPermission(
  userId: string,
  permissions: string[],
  siteId?: string,
  areaId?: string
): Promise<boolean> {
  for (const permission of permissions) {
    if (await userHasPermission(userId, permission, siteId, areaId)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has ALL of the specified permissions
 */
export async function userHasAllPermissions(
  userId: string,
  permissions: string[],
  siteId?: string,
  areaId?: string
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await userHasPermission(userId, permission, siteId, areaId))) {
      return false;
    }
  }
  return true;
}

/**
 * Get user's roles with their permissions
 */
export async function getUserRoles(userId: string) {
  try {
    const result = await db.execute(sql`
      SELECT
        r.id,
        r.name,
        r.description,
        r.scope,
        r.color,
        ur.site_id,
        ur.area_id,
        COUNT(rp.permission_id) as permission_count
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      WHERE ur.user_id = ${userId}::uuid
      GROUP BY r.id, r.name, r.description, r.scope, r.color, ur.site_id, ur.area_id
      ORDER BY r.name
    `);

    return (Array.isArray(result) ? result : []);
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}
