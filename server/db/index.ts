import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// Lazy initialize the database connection
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create postgres connection
    const queryClient = postgres(connectionString);

    // Create drizzle instance
    dbInstance = drizzle(queryClient, { schema });
  }

  return dbInstance;
}

// Export a proxy that lazily initializes the database
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  }
});
