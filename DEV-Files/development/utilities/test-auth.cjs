const { PrismaClient } = require('@prisma/client');
const { hash } = require('argon2');

const prisma = new PrismaClient({
  datasourceUrl: "postgresql://postgres:UXRyioyJFQQjYhxpeEAbVAtHHXrPsOaY@nozomi.proxy.rlwy.net:47611/railway"
});

async function createTestUser() {
  try {
    console.log('🔍 Checking existing users...');

    // Check existing users
    const users = await prisma.user.findMany({
      include: {
        memberships: {
          include: {
            organization: true
          }
        }
      }
    });

    console.log(`Found ${users.length} existing users:`);
    users.forEach(user => {
      console.log(`- ${user.email}: ${user.memberships.length} memberships`);
    });

    // Create test user for login testing
    const testUserExists = users.find(u => u.email === 'test@example.com');
    if (!testUserExists) {
      console.log('📝 Creating test user...');

      const hashedPassword = await hash('testpass123', {
        type: 2, // argon2id
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 3,
        parallelism: 1,
      });

      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          credentials: {
            create: {
              hashedPassword: hashedPassword
            }
          }
        }
      });

      console.log('✅ Test user created:', user.email);

      // Create test organization
      console.log('🏢 Creating test organization...');

      const org = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
          memberships: {
            create: {
              userId: user.id,
              role: 'ADMIN'
            }
          }
        }
      });

      console.log('✅ Test organization created:', org.name);

    } else {
      console.log('ℹ️  Test user already exists');
    }

    console.log('🎯 Test complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();