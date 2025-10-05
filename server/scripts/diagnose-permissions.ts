import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment')
  process.exit(1)
}

const sql = postgres(DATABASE_URL, {
  max: 4,
  idle_timeout: 10,
  connect_timeout: 10,
  max_lifetime: 60 * 10,
  prepare: false,
})

async function tableExists(name: string) {
  const rows = await sql/* sql */`
    SELECT to_regclass(${name}) AS reg
  `
  return !!rows[0]?.reg
}

async function getUserByEmail(email: string) {
  const rows = await sql/* sql */`
    SELECT id, username, email, role, organization_id
    FROM users
    WHERE (email = ${email} OR username = ${email}) AND is_active = true
    LIMIT 1
  `
  return rows[0]
}

async function getUserRoles(userId: string) {
  const rows = await sql/* sql */`
    SELECT ur.user_id, ur.role_id, ur.site_id, ur.area_id,
           r.name, r.description, r.scope, r.color, r.is_system
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ${userId}::uuid
  `
  return rows
}

async function getRolePermissionCount(roleId: string) {
  const rows = await sql/* sql */`
    SELECT COUNT(*)::int AS cnt
    FROM role_permissions
    WHERE role_id = ${roleId}::uuid
  `
  return rows[0]?.cnt ?? 0
}

async function getEffectivePermissions(userId: string) {
  const rows = await sql/* sql */`
    SELECT DISTINCT
      p.category,
      p.action,
      p.description
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = ${userId}::uuid
    ORDER BY p.category, p.action
  `
  return rows
}

async function findPermission(fullName: string) {
  const [category, action] = fullName.split('.')
  const rows = await sql/* sql */`
    SELECT id, category, action FROM permissions
    WHERE category = ${category} AND action = ${action}
    LIMIT 1
  `
  return rows[0]
}

async function main() {
  const targetEmails = [
    'support@d365boq.com',
    'support@d365.com',
  ]

  console.log('--- Table existence checks ---')
  for (const t of ['permissions', 'roles', 'role_permissions', 'user_roles']) {
    const exists = await tableExists(t)
    console.log(`${t}: ${exists ? 'exists' : 'MISSING'}`)
  }

  for (const email of targetEmails) {
    console.log(`\n=== Inspecting user: ${email} ===`)
    const user = await getUserByEmail(email)
    if (!user) {
      console.log('User not found or inactive')
      continue
    }
    console.log('User:', user)
    // Super admin check (same as server helper)
    const superAdmin = await sql/* sql */`
      SELECT 1
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ${user.id}::uuid
        AND p.category = 'system'
        AND p.action = 'full_admin_access'
      LIMIT 1
    `
    console.log('Has super admin:', !!superAdmin.length)
    const roles = await getUserRoles(user.id)
    console.log(`Roles assigned (${roles.length}):`)
    for (const r of roles) {
      const permCount = await getRolePermissionCount(r.role_id)
      console.log(` - ${r.name} (id=${r.role_id}) system=${r.is_system} scope=${r.scope} perms=${permCount}`)
    }
    const eff = await getEffectivePermissions(user.id)
    console.log(`Effective permissions (${eff.length}):`)
    for (const p of eff) {
      console.log(` * ${p.category}.${p.action}`)
    }
  }

  console.log('\n--- Sanity check specific permissions ---')
  const needed = [
    'users_roles.view_users',
    'users_roles.view_roles',
    'sites_areas.view_sites',
    'sites_areas.view_areas',
    'catalogue.view_catalogue',
    'requests.submit_requests',
    'requests.view_requests',
    'reports.view_reports',
    'system.full_admin_access',
  ]
  for (const perm of needed) {
    const row = await findPermission(perm)
    console.log(`${perm}: ${row ? 'exists' : 'MISSING'}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  try { await sql.end({ timeout: 5 }) } catch {}
})
