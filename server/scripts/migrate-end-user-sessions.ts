import { and, eq } from 'drizzle-orm'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from '../db/index.js'
import { endUserSessions, endUsers, sessions, users } from '../db/schema.js'

async function migrateEndUserSessions() {
  // Load env from project root
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  dotenv.config({ path: path.resolve(__dirname, '../../.env') })
  const dryRun = process.argv.includes('--dry-run')
  console.log('[migrate] Starting end_user_sessions -> sessions migration')
  if (dryRun) console.log('[migrate] DRY RUN: No changes will be written')

  // Pull all end-user sessions with user context
  const eus = await db
    .select({
      session: endUserSessions,
      user: endUsers,
    })
    .from(endUserSessions)
    .innerJoin(endUsers, eq(endUsers.id, endUserSessions.end_user_id))

  console.log(`[migrate] Found ${eus.length} end_user_sessions`)

  let inserted = 0
  let skipped = 0
  let deleted = 0

  for (const row of eus) {
    const endUser = row.user
    const s = row.session

    // Find corresponding users row by username/email
    const [mainUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, endUser.username))
      .limit(1)

    if (!mainUser) {
      console.warn(`[migrate] No matching users row for end-user ${endUser.username}, skipping session ${s.id}`)
      skipped++
      continue
    }

    // Check if a sessions row with this refresh token already exists
    const [existingSession] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.user_id, mainUser.id), eq(sessions.refresh_token, s.refresh_token)))
      .limit(1)

    if (existingSession) {
      console.log(`[migrate] Session already exists for user ${mainUser.username}, token ${s.refresh_token.slice(0,8)}...`)
    } else {
      if (dryRun) {
        console.log(`[migrate] Would INSERT session for ${mainUser.username} exp ${s.expires_at.toISOString()}`)
      } else {
        await db.insert(sessions).values({
          user_id: mainUser.id,
          refresh_token: s.refresh_token,
          expires_at: s.expires_at,
        })
        inserted++
      }
    }

    // Delete old end_user_session
    if (dryRun) {
      console.log(`[migrate] Would DELETE end_user_session ${s.id}`)
    } else {
      await db.delete(endUserSessions).where(eq(endUserSessions.id, s.id))
      deleted++
    }
  }

  console.log(`[migrate] Done. Inserted: ${inserted}, Skipped: ${skipped}, Deleted: ${deleted}`)
}

migrateEndUserSessions()
  .then(() => {
    console.log('[migrate] end_user_sessions migration completed successfully')
    process.exit(0)
  })
  .catch((err) => {
    console.error('[migrate] end_user_sessions migration failed:', err)
    process.exit(1)
  })
