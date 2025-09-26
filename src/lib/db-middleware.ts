import { prisma } from "./db";
import { DbCtx } from "./db";

export async function setDbContext(ctx: DbCtx): Promise<void> {
  await prisma.$executeRaw`SET LOCAL app.current_org_id = ${ctx.orgId}`;
  await prisma.$executeRaw`SET LOCAL app.current_user_id = ${ctx.userId}`;
  await prisma.$executeRaw`SET LOCAL app.current_role = ${ctx.role}`;
}

export async function withDbContext<T>(
  ctx: DbCtx,
  operation: () => Promise<T>
): Promise<T> {
  // Use a transaction to ensure the context is set for all queries
  return await prisma.$transaction(async (tx) => {
    // Set the application context
    await tx.$executeRaw`SET LOCAL app.current_org_id = ${ctx.orgId}`;
    await tx.$executeRaw`SET LOCAL app.current_user_id = ${ctx.userId}`;
    await tx.$executeRaw`SET LOCAL app.current_role = ${ctx.role}`;

    // Execute the operation with the context set
    return await operation();
  });
}