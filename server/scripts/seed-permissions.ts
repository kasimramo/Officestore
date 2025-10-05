import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL')
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { prepare: false })

type Perm = { category: string; action: string; description: string; is_system?: boolean }

const toSeed: Perm[] = [
  { category: 'requests', action: 'submit_requests', description: 'Submit new requests', is_system: true },
  { category: 'requests', action: 'view_requests', description: 'View requests', is_system: true },
  { category: 'reports', action: 'view_reports', description: 'View reports and dashboards', is_system: true },
]

async function ensurePermission(p: Perm) {
  const exists = await sql/* sql */`
    SELECT 1 FROM permissions WHERE category = ${p.category} AND action = ${p.action} LIMIT 1
  `
  if (exists.length) return false
  await sql/* sql */`
    INSERT INTO permissions (category, action, description, is_system)
    VALUES (${p.category}, ${p.action}, ${p.description}, ${p.is_system ?? true})
  `
  return true
}

async function main() {
  let inserted = 0
  for (const p of toSeed) {
    const did = await ensurePermission(p)
    if (did) inserted++
  }
  console.log(`Seed complete. Inserted ${inserted} permission(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  try { await sql.end({ timeout: 5 }) } catch {}
})

