import { Pool, PoolClient, QueryResult } from "pg";
import { PrismaClient, OrgRole } from "@prisma/client";

// PostgreSQL connection pool for direct queries (needed for RLS context)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  application_name: "pantry-app",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Prisma client for ORM operations
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Database context for RLS
export type DbCtx = {
  orgId: string;   // uuid
  userId: string;  // uuid
  role: OrgRole;
};

// Execute queries within a database context (sets RLS variables)
export async function withDbContext<T>(
  ctx: DbCtx,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Set per-transaction context for RLS
    await client.query("SET LOCAL app.current_org_id = $1", [ctx.orgId]);
    await client.query("SET LOCAL app.current_user_id = $1", [ctx.userId]);
    await client.query("SET LOCAL app.current_role = $1", [ctx.role]);

    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Helper function for parameterized queries
export async function query<T = any>(
  client: PoolClient,
  sql: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return client.query<T>(sql, params);
}

// Prisma with RLS context (middleware approach)
export function createPrismaWithContext(ctx: DbCtx) {
  return prisma.$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        // For operations that need RLS context, we could inject it here
        // However, direct SQL with withDbContext is recommended for complex RLS scenarios
        return query(args);
      },
    },
  });
}

// Health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}