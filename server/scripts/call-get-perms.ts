import { getUserPermissions } from '../helpers/permissionHelper.js'

const userId = process.argv[2]
if (!userId) {
  console.error('Usage: tsx server/scripts/call-get-perms.ts <userId>')
  process.exit(1)
}

const run = async () => {
  const perms = await getUserPermissions(userId)
  console.log('count:', Array.isArray(perms) ? perms.length : 'n/a')
  console.log('sample:', (perms as any[]).slice(0, 10))
}

run().catch((e) => { console.error(e); process.exit(1) })

