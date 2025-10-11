import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
// Ensure environment variables are loaded before any DB access
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Load root .env (works in dev and prod builds)
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
} catch {}

// Lazy initialize the database connection
let dbInstance: ReturnType<typeof drizzle> | null = null;
let queryClient: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create postgres connection with Railway-optimized pooling
    queryClient = postgres(connectionString, {
      max: 20,                    // Railway free tier supports up to 20 connections
      idle_timeout: 30,          // Close idle connections after 30s
      connect_timeout: 10,       // Fail fast if connection takes >10s
      max_lifetime: 60 * 30,     // Rotate connections every 30 minutes
      onnotice: () => {},        // Silence NOTICE messages
      prepare: false,            // Disable prepared statements for better compatibility
    });

    // Create drizzle instance
    dbInstance = drizzle(queryClient, { schema });

    console.log('✅ Database connection pool initialized (max: 20 connections)');
  }

  return dbInstance;
}

// Graceful shutdown handler
export async function closeDatabase() {
  if (queryClient) {
    console.log('🔌 Closing database connections...');
    await queryClient.end({ timeout: 5 });
    dbInstance = null;
    queryClient = null;
    console.log('✅ Database connections closed');
  }
}

// Export a proxy that lazily initializes the database
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  }
});

// Export sql function for raw queries (used by workflow engine)
export function sql(strings: TemplateStringsArray, ...values: any[]) {
  if (!queryClient) {
    getDb(); // Initialize connection if needed
  }
  return queryClient!(strings, ...values);
}
