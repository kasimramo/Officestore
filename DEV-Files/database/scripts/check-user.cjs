const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:UXRyioyJFQQjYhxpeEAbVAtHHXrPsOaY@nozomi.proxy.rlwy.net:47611/railway"
    }
  }
});

async function checkUser() {
  try {
    // First check what tables exist
    console.log('Checking database schema...');

    // Check if user table exists and get users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    console.log('All users in database:', users);
    console.log('Looking for user: support@d365boq.com');

    const targetUser = users.find(u => u.email === 'support@d365boq.com');
    if (targetUser) {
      console.log('✅ Target user exists:', targetUser);
    } else {
      console.log('❌ Target user not found');
    }

    // Check for user_credential table
    try {
      const credentialCount = await prisma.$queryRaw`SELECT COUNT(*) FROM user_credential`;
      console.log('user_credential table exists with records:', credentialCount);
    } catch (e) {
      console.log('❌ user_credential table does not exist');
    }

    // Check memberships if user exists
    if (targetUser) {
      try {
        const memberships = await prisma.membership.findMany({
          where: { userId: targetUser.id },
          include: {
            organization: true
          }
        });
        console.log('User memberships:', memberships.map(m => ({
          orgName: m.organization.name,
          role: m.role
        })));
      } catch (e) {
        console.log('❌ Could not fetch memberships:', e.message);
      }
    }

  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();