import { generateAccessToken } from '../utils/jwt.js'

const [userId, email, role, organizationId] = process.argv.slice(2)
if (!userId || !role) {
  console.error('Usage: tsx server/scripts/generate-admin-token.ts <userId> <email?> <role> <organizationId?>')
  process.exit(1)
}

const token = generateAccessToken({
  userId,
  username: email,
  email,
  role: role as any,
  organizationId,
})
console.log(token)

