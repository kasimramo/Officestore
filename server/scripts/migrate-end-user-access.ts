import { and, eq, or, sql } from 'drizzle-orm'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from '../db/index.js'
import { endUsers, endUserSites, endUserAreas, users, roles } from '../db/schema.js'

async function migrateAccessToUserRoles() {
  // Load env from project root
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  dotenv.config({ path: path.resolve(__dirname, '../../.env') })
  const dryRun = process.argv.includes('--dry-run')
  console.log('[migrate] Starting access migration: end_user_* -> user_roles')
  if (dryRun) console.log('[migrate] DRY RUN: No changes will be written')

  const allEndUsers = await db.select().from(endUsers)
  console.log(`[migrate] Found ${allEndUsers.length} end_users to process`)

  let orgAssignments = 0
  let siteAssignments = 0
  let areaAssignments = 0
  let skippedNoMainUser = 0
  let skippedNoRole = 0

  for (const eu of allEndUsers) {
    // find matching main users row
    const [mainUser] = await db
      .select()
      .from(users)
      .where(or(eq(users.username, eu.username), eu.email ? eq(users.email, eu.email) : eq(users.username, '__no_match__')))
      .limit(1)

    if (!mainUser) {
      console.warn(`[migrate] No matching users row for ${eu.username}, skipping`)
      skippedNoMainUser++
      continue
    }

    // resolve a role id: prefer end-user's role_id, otherwise lookup by name in org
    let roleId = eu.role_id || null
    if (!roleId) {
      const [roleRow] = await db
        .select()
        .from(roles)
        .where(and(eq(roles.organization_id, eu.organization_id), eq(roles.name, eu.role)))
        .limit(1)
      roleId = roleRow ? roleRow.id : null
    }

    if (!roleId) {
      console.warn(`[migrate] No role found for ${eu.username} (${eu.role}), skipping`)
      skippedNoRole++
      continue
    }

    // insert org-level assignment if not exists
    const orgInsert = sql`
      INSERT INTO user_roles (user_id, role_id, site_id, area_id)
      SELECT ${mainUser.id}::uuid, ${roleId}::uuid, NULL::uuid, NULL::uuid
      WHERE NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = ${mainUser.id}::uuid AND role_id = ${roleId}::uuid AND site_id IS NULL AND area_id IS NULL
      )
    `
    if (dryRun) {
      console.log(`[migrate] Would assign ORG role to ${mainUser.username}`)
    } else {
      await db.execute(orgInsert)
    }
    orgAssignments++

    // migrate site access
    const siteRows = await db
      .select()
      .from(endUserSites)
      .where(eq(endUserSites.end_user_id, eu.id))

    for (const sr of siteRows) {
      const siteInsert = sql`
        INSERT INTO user_roles (user_id, role_id, site_id, area_id)
        SELECT ${mainUser.id}::uuid, ${roleId}::uuid, ${sr.site_id}::uuid, NULL::uuid
        WHERE NOT EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = ${mainUser.id}::uuid AND role_id = ${roleId}::uuid AND site_id = ${sr.site_id}::uuid AND area_id IS NULL
        )
      `
      if (dryRun) {
        console.log(`[migrate] Would assign SITE role to ${mainUser.username} site ${sr.site_id}`)
      } else {
        await db.execute(siteInsert)
      }
      siteAssignments++
    }

    // migrate area access
    const areaRows = await db
      .select()
      .from(endUserAreas)
      .where(eq(endUserAreas.end_user_id, eu.id))

    for (const ar of areaRows) {
      const areaInsert = sql`
        INSERT INTO user_roles (user_id, role_id, site_id, area_id)
        SELECT ${mainUser.id}::uuid, ${roleId}::uuid, NULL::uuid, ${ar.area_id}::uuid
        WHERE NOT EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = ${mainUser.id}::uuid AND role_id = ${roleId}::uuid AND area_id = ${ar.area_id}::uuid
        )
      `
      if (dryRun) {
        console.log(`[migrate] Would assign AREA role to ${mainUser.username} area ${ar.area_id}`)
      } else {
        await db.execute(areaInsert)
      }
      areaAssignments++
    }
  }

  console.log(`[migrate] Done.`)
  console.log(`[migrate] ORG assignments: ${orgAssignments}`)
  console.log(`[migrate] SITE assignments: ${siteAssignments}`)
  console.log(`[migrate] AREA assignments: ${areaAssignments}`)
  console.log(`[migrate] Skipped (no main user): ${skippedNoMainUser}`)
  console.log(`[migrate] Skipped (no role): ${skippedNoRole}`)
}

migrateAccessToUserRoles()
  .then(() => {
    console.log('[migrate] Access migration completed successfully')
    process.exit(0)
  })
  .catch((err) => {
    console.error('[migrate] Access migration failed:', err)
    process.exit(1)
  })
