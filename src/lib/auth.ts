import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import { prisma } from "./db";
import { verifyPassword } from "./password";
import { OrgRole } from "@prisma/client";

export interface ExtendedSession {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  orgId?: string;
  role?: OrgRole;
  membership?: {
    orgId: string;
    role: OrgRole;
    orgName: string;
    orgSlug: string;
  }[];
}

type TokenWithOrgContext = JWT & {
  orgId?: string;
  role?: OrgRole;
  membership?: ExtendedSession["membership"];
};

async function hydrateToken(token: TokenWithOrgContext) {
  if (!token.sub) {
    return token;
  }

  const user = await prisma.user.findUnique({
    where: { id: token.sub },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!user) {
    token.orgId = undefined;
    token.role = undefined;
    token.membership = [];
    return token;
  }

  token.email = user.email;
  token.name = user.name ?? undefined;

  const membership = user.memberships.map((m) => ({
    orgId: m.orgId,
    role: m.role,
    orgName: m.organization.name,
    orgSlug: m.organization.slug,
  }));

  token.membership = membership;

  if (membership.length > 0) {
    token.orgId = membership[0].orgId;
    token.role = membership[0].role;
  } else {
    token.orgId = undefined;
    token.role = undefined;
  }

  return token;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            memberships: {
              include: {
                organization: true,
              },
            },
          },
        });

        if (!user) {
          return null;
        }

        const userCredentials = await prisma.userCredential.findUnique({
          where: { userId: user.id },
        });

        if (!userCredentials) {
          return null;
        }

        const isValid = await verifyPassword(credentials.password, userCredentials.hashedPassword);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const typedToken = token as TokenWithOrgContext;

      if (user) {
        typedToken.sub = user.id;
      }

      const shouldHydrate =
        !!typedToken.sub &&
        (Boolean(user) || typedToken.orgId === undefined || typedToken.membership === undefined || trigger === "update");

      if (shouldHydrate) {
        await hydrateToken(typedToken);
      }

      return typedToken;
    },
    async session({ session, token }) {
      const typedToken = token as TokenWithOrgContext;

      if (!typedToken.sub) {
        return session;
      }

      const extendedSession: ExtendedSession = {
        user: {
          id: typedToken.sub,
          email: (typedToken.email ?? session.user?.email ?? "") as string,
          name: (typedToken.name ?? session.user?.name ?? undefined) ?? undefined,
        },
        orgId: typedToken.orgId,
        role: typedToken.role,
        membership: typedToken.membership,
      };

      return extendedSession;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  events: {
    async signIn({ user, account }) {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "USER_SIGNIN",
          targetType: "User",
          targetId: user.id,
          meta: {
            provider: account?.provider,
            ip: "unknown",
          },
        },
      });
    },
    async signOut({ token }) {
      if (token?.sub) {
        await prisma.auditLog.create({
          data: {
            actorId: token.sub,
            action: "USER_SIGNOUT",
            targetType: "User",
            targetId: token.sub,
            meta: {},
          },
        });
      }
    },
  },
};
