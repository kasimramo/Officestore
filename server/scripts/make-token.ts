import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
if (!ACCESS_SECRET) {
  console.error('Missing JWT_ACCESS_SECRET')
  process.exit(1)
}

const [userId, email, role, organizationId] = process.argv.slice(2)
if (!userId || !role) {
  console.error('Usage: tsx server/scripts/make-token.ts <userId> <email?> <role> <organizationId?>')
  process.exit(1)
}

const payload: any = {
  userId,
  role,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8h
}
if (email) payload.email = email
if (organizationId) payload.organizationId = organizationId

const token = jwt.sign(payload, ACCESS_SECRET, {
  issuer: 'officestore-api',
  audience: 'officestore-client',
})
console.log(token)
