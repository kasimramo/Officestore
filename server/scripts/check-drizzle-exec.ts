import { db } from '../db/index.js'
import { sql } from 'drizzle-orm'

const run = async () => {
  const res = await db.execute(sql`SELECT 1 as one`)
  console.log('typeof res:', typeof res)
  console.log('keys:', Object.keys(res as any))
  console.log('res:', res)
  // Try common shapes
  // @ts-ignore
  console.log('rows?', (res as any)?.rows)
}

run().catch((e) => { console.error(e); process.exit(1) })

