const { PrismaClient } = require('@prisma/client');
const { verify } = require('argon2');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:UXRyioyJFQQjYhxpeEAbVAtHHXrPsOaY@nozomi.proxy.rlwy.net:47611/railway"
    }
  }
});

async function testAuth() {
  try {
    const email = 'support@d365boq.com';
    const password = 'Support@0104';

    console.log('🔍 Testing authentication flow manually...');

    // Replicate the exact logic from auth.ts
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    console.log('1. User lookup:', user ? '✅ Found' : '❌ Not found');

    if (!user) {
      console.log('❌ Authentication failed - user not found');
      return;
    }

    // Get user credentials (note: we need to use the separate table)
    const credentials = await prisma.userCredential.findUnique({
      where: { userId: user.id }
    });

    console.log('2. Credentials lookup:', credentials ? '✅ Found' : '❌ Not found');

    if (!credentials) {
      console.log('❌ Authentication failed - credentials not found');
      return;
    }

    // Test password verification
    console.log('3. Testing password verification...');
    const isValid = await verify(credentials.hashedPassword, password);
    console.log('Password verification:', isValid ? '✅ VALID' : '❌ INVALID');

    if (isValid) {
      console.log('✅ Authentication should succeed!');
      console.log('User details:', {
        id: user.id,
        email: user.email,
        name: user.name,
        memberships: user.memberships.length
      });
    } else {
      console.log('❌ Authentication should fail - invalid password');
    }

  } catch (error) {
    console.error('❌ Error testing auth:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();