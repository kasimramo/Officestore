import { db } from '../db/index.js'
import { sql } from 'drizzle-orm'

const userId = process.argv[2]
if (!userId) {
  console.error('Usage: tsx server/scripts/test-super-admin.ts <userId>')
  process.exit(1)
}

const run = async () => {
  const res = await db.execute(sql`
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = ${userId}::uuid
      AND p.category = 'system'
      AND p.action = 'full_admin_access'
    LIMIT 1
  `)
  console.log('db.execute result length:', (res as any).length)
  console.log('db.execute result:', res)
}

run().catch((e) => { console.error(e); process.exit(1) })

