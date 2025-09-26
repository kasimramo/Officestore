import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "./auth";
import { DbCtx } from "./db";
import { redirect } from "next/navigation";
import { AuthenticationError, OrganizationMembershipError } from "./errors";
import { OrgRole } from "@prisma/client";

export async function getDbContextFromRequest(): Promise<DbCtx> {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;

  if (!session?.user?.id) {
    throw new AuthenticationError("Authentication required");
  }

  if (!session.orgId || !session.role) {
    throw new OrganizationMembershipError("No organization membership found");
  }

  return {
    orgId: session.orgId,
    userId: session.user.id,
    role: session.role,
  };
}

export async function requireAuth(): Promise<ExtendedSession> {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return session;
}

export async function requireOrgMembership(): Promise<{
  session: ExtendedSession;
  ctx: DbCtx;
}> {
  const session = await requireAuth();

  if (!session.orgId || !session.role) {
    redirect("/onboarding");
  }

  const ctx: DbCtx = {
    orgId: session.orgId,
    userId: session.user.id,
    role: session.role,
  };

  return { session, ctx };
}