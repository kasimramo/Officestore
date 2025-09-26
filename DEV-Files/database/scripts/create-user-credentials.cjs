const { PrismaClient } = require('@prisma/client');
const { hash } = require('argon2');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:UXRyioyJFQQjYhxpeEAbVAtHHXrPsOaY@nozomi.proxy.rlwy.net:47611/railway"
    }
  }
});

const HASH_OPTIONS = {
  type: 2, // argon2id
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3,
  parallelism: 1,
};

async function createUserCredentials() {
  try {
    const email = 'support@d365boq.com';
    const password = 'Support@0104';

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return;
    }

    console.log('✅ User found:', user.email);

    // Check if credentials already exist
    const existingCredentials = await prisma.userCredential.findUnique({
      where: { userId: user.id }
    });

    if (existingCredentials) {
      console.log('📝 Credentials already exist, updating...');
    } else {
      console.log('🔧 Creating new credentials...');
    }

    // Hash the password
    console.log('🔐 Hashing password...');
    const hashedPassword = await hash(password, HASH_OPTIONS);

    // Create or update credentials
    await prisma.userCredential.upsert({
      where: { userId: user.id },
      update: {
        hashedPassword,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        hashedPassword
      }
    });

    console.log('✅ Credentials created/updated successfully!');

    // Verify the credentials work
    console.log('🧪 Testing password verification...');
    const { verify } = require('argon2');
    const isValid = await verify(hashedPassword, password);
    console.log('Password verification test:', isValid ? '✅ PASSED' : '❌ FAILED');

  } catch (error) {
    console.error('❌ Error creating credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUserCredentials();