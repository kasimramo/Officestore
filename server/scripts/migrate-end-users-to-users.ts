import { and, eq, or } from 'drizzle-orm'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from '../db/index.js'
import { endUsers, users } from '../db/schema.js'

async function migrateEndUsers() {
  // Load env from project root
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  dotenv.config({ path: path.resolve(__dirname, '../../.env') })
  const dryRun = process.argv.includes('--dry-run')
  console.log('[migrate] Starting end_users -> users migration')
  if (dryRun) console.log('[migrate] DRY RUN: No changes will be written')

  const allEndUsers = await db.select().from(endUsers)
  console.log(`[migrate] Found ${allEndUsers.length} end_users`)

  let inserted = 0
  let updated = 0

  for (const eu of allEndUsers) {
    // Look for existing by username or email
    const [existing] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, eu.username),
          eu.email ? eq(users.email, eu.email) : eq(users.username, '__no_match__') // fallback to avoid null comparison
        )
      )
      .limit(1)

    if (!existing) {
      // Insert
      const values = {
        username: eu.username,
        email: eu.email || null,
        password_hash: eu.password_hash,
        first_name: eu.first_name,
        last_name: eu.last_name,
        role: eu.role as any,
        role_id: eu.role_id || null,
        organization_id: eu.organization_id,
        is_active: eu.is_active,
        email_verified: false,
        force_password_change: eu.force_password_change,
        created_by: eu.created_by,
      } as const
      if (dryRun) {
        console.log(`[migrate] Would INSERT user ${eu.username}`)
      } else {
        await db.insert(users).values(values)
      }
      inserted++
    } else {
      // Update minimal fields to keep in sync
      const setValues = {
          email: eu.email || existing.email || null,
          password_hash: eu.password_hash || existing.password_hash,
          first_name: eu.first_name,
          last_name: eu.last_name,
          role: eu.role as any,
          role_id: eu.role_id || existing.role_id || null,
          organization_id: eu.organization_id,
          is_active: eu.is_active,
          force_password_change: eu.force_password_change,
          updated_at: new Date(),
        }
      if (dryRun) {
        console.log(`[migrate] Would UPDATE user ${existing.username}`)
      } else {
        await db
          .update(users)
          .set(setValues)
          .where(eq(users.id, existing.id))
      }
      updated++
    }
  }

  console.log(`[migrate] Done. Inserted: ${inserted}, Updated: ${updated}`)
}

migrateEndUsers()
  .then(() => {
    console.log('[migrate] Migration completed successfully')
    process.exit(0)
  })
  .catch((err) => {
    console.error('[migrate] Migration failed:', err)
    process.exit(1)
  })
