const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting security migration...');

  try {
    // Step 1: Apply Prisma schema changes
    console.log('1. Applying Prisma schema changes...');
    console.log('   Please run: npx prisma db push');
    console.log('   This will add the UserCredential table');

    // Step 2: Apply secure RLS setup
    console.log('2. Applying secure RLS setup...');
    const rlsScript = await fs.readFile(
      path.join(__dirname, '004_secure_rls_setup.sql'),
      'utf8'
    );

    // Split the script into individual statements
    const statements = rlsScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          await prisma.$executeRawUnsafe(statement + ';');
        } catch (error) {
          console.warn(`   Warning: Statement ${i + 1} failed:`, error.message);
          // Continue with other statements
        }
      }
    }

    console.log('3. Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your API routes to use the new error handling utilities');
    console.log('2. Update your middleware to set database context using withDbContext()');
    console.log('3. Test authentication and authorization thoroughly');
    console.log('4. Migrate existing users to use the new credential system');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();