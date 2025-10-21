// Helper to check JSONB-based role permissions (new system)
import { db } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { users, endUsers, roles } from '../db/schema.js';

/**
 * Check if a user has a permission via their role's JSONB permissions field
 * This is for the new permission system
 */
export async function userHasRolePermission(userId: string, permission: string): Promise<boolean> {
  try {
    // Check users table first
    const [userRecord] = await db
      .select({ role_id: users.role_id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    let roleId = userRecord?.role_id;

    // If not in users, check end_users table
    if (!roleId) {
      const [endUserRecord] = await db
        .select({ role_id: endUsers.role_id })
        .from(endUsers)
        .where(eq(endUsers.id, userId))
        .limit(1);

      roleId = endUserRecord?.role_id;
    }

    // If no role_id found, return false
    if (!roleId) {
      return false;
    }

    // Get role permissions from JSONB field
    const [roleRecord] = await db
      .select({ permissions: roles.permissions })
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!roleRecord || !roleRecord.permissions) {
      return false;
    }

    // Check if permission is set to true in JSONB
    return roleRecord.permissions[permission] === true;
  } catch (error) {
    console.error('[rolePermissions] Error checking user role permission:', error);
    return false;
  }
}

/**
 * Get all permissions for a user from their role's JSONB permissions field
 */
export async function getUserRolePermissions(userId: string): Promise<string[]> {
  try {
    // Check users table first
    const [userRecord] = await db
      .select({ role_id: users.role_id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    let roleId = userRecord?.role_id;

    // If not in users, check end_users table
    if (!roleId) {
      const [endUserRecord] = await db
        .select({ role_id: endUsers.role_id })
        .from(endUsers)
        .where(eq(endUsers.id, userId))
        .limit(1);

      roleId = endUserRecord?.role_id;
    }

    // If no role_id found, return empty array
    if (!roleId) {
      return [];
    }

    // Get role permissions from JSONB field
    const [roleRecord] = await db
      .select({ permissions: roles.permissions })
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!roleRecord || !roleRecord.permissions) {
      return [];
    }

    // Extract all permissions that are set to true
    const permissionList: string[] = [];
    for (const [key, value] of Object.entries(roleRecord.permissions)) {
      if (value === true) {
        permissionList.push(key);
      }
    }

    return permissionList;
  } catch (error) {
    console.error('[rolePermissions] Error getting user role permissions:', error);
    return [];
  }
}
