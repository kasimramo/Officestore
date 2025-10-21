import { eq, and } from 'drizzle-orm';
import { User, AuthTokens, UserRole, Organization } from '@officestore/shared';
import { db } from '../config/database.js';
import { users, sessions, organizations } from '../db/schema.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateTokenPair, verifyRefreshToken, TokenPayload } from '../utils/jwt.js';
import { sessionCache } from '../config/redis.js';

export class AuthService {
  async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    organizationName?: string
  ): Promise<{ user: Omit<User, 'password_hash'>; tokens: AuthTokens; organization?: Organization }> {

    const existingEmailUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existingEmailUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await hashPassword(password);

    // Determine if this should be an admin user
    // If organizationName is provided, this user will be the admin of that org
    // If no organizationName and no users exist, this is the system bootstrap admin
    const [anyUser] = await db.select({ id: users.id }).from(users).limit(1);
    const isSystemBootstrap = !anyUser;
    const isOrgAdmin = !!organizationName;

    if (isSystemBootstrap && (!organizationName || organizationName.trim().length === 0)) {
      throw new Error('Organization name is required for the first admin account');
    }

    // If organizationName provided, create new organization
    let organization: Organization | undefined;
    let organizationId: string | undefined;

    if (organizationName) {
      const slug = this.generateOrganizationSlug(organizationName);


      const [newOrg] = await db
        .insert(organizations)
        .values({
          name: organizationName,
          slug,
          description: null,
          settings: {
            require_approval: true,
            approval_levels: 2,
            allow_staff_requests: true,
            email_notifications: true
          },
          is_active: true
        })
        .returning();

      organization = newOrg;
      organizationId = newOrg.id;
    }

    // Create user


    const [newUser] = await db
      .insert(users)
      .values({
        username: email,
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: isOrgAdmin ? UserRole.ADMIN : UserRole.STAFF,
        organization_id: organizationId || null,
        is_active: true,
        email_verified: false
      })
      .returning();

    const userPayload: TokenPayload = {
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email || undefined,
      role: newUser.role,
      organizationId: newUser.organization_id || undefined
    };

    const tokens = generateTokenPair(userPayload);

    // Store refresh token in database and cache
    await this.storeRefreshToken(newUser.id, tokens.refreshToken);

    const { password_hash, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword,
      tokens,
      organization
    };
  }

  async signIn(username: string, password: string): Promise<{ user: Omit<User, 'password_hash'>; tokens: AuthTokens; forcePasswordChange?: boolean; organization?: Organization }> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), eq(users.is_active, true)))
      .limit(1);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const userPayload: TokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email || undefined,
      role: user.role,
      organizationId: user.organization_id || undefined
    };

    const tokens = generateTokenPair(userPayload);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    let organization: Organization | undefined;

    if (user.organization_id) {
      const [orgRecord] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user.organization_id))
        .limit(1);

      if (orgRecord) {
        organization = {
          id: orgRecord.id,
          name: orgRecord.name,
          slug: orgRecord.slug,
          description: orgRecord.description,
          settings: orgRecord.settings,
          is_active: orgRecord.is_active,
          created_at: orgRecord.created_at,
          updated_at: orgRecord.updated_at
        };
      }
    }

    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
      forcePasswordChange: user.force_password_change,
      organization
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = verifyRefreshToken(refreshToken);

      // Check if refresh token exists in database
      const [session] = await db
        .select()
        .from(sessions)
        .where(and(
          eq(sessions.refresh_token, refreshToken),
          eq(sessions.user_id, payload.userId)
        ))
        .limit(1);

      if (!session) {
        throw new Error('Invalid refresh token');
      }

      if (session.expires_at < new Date()) {
        // Clean up expired session
        await db.delete(sessions).where(eq(sessions.id, session.id));
        await sessionCache.delete(session.id);
        throw new Error('Refresh token expired');
      }

      // Get fresh user data
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, payload.userId), eq(users.is_active, true)))
        .limit(1);

      if (!user) {
        throw new Error('User not found or inactive');
      }

      const userPayload: TokenPayload = {
        userId: user.id,
        username: user.username,
        email: user.email || undefined,
        role: user.role,
        organizationId: user.organization_id || undefined
      };

      const newTokens = generateTokenPair(userPayload);

      // Update refresh token in database
      await db
        .update(sessions)
        .set({
          refresh_token: newTokens.refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          updated_at: new Date()
        })
        .where(eq(sessions.id, session.id));

      // Update session cache
      await sessionCache.set(session.id, {
        userId: user.id,
        refreshToken: newTokens.refreshToken
      });

      return newTokens;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async signOut(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Remove specific session
      await db
        .delete(sessions)
        .where(and(
          eq(sessions.user_id, userId),
          eq(sessions.refresh_token, refreshToken)
        ));
    } else {
      // Remove all sessions for user
      await db
        .delete(sessions)
        .where(eq(sessions.user_id, userId));
    }

    // Clear from cache
    await sessionCache.deleteUserSessions(userId);
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [session] = await db
      .insert(sessions)
      .values({
        user_id: userId,
        refresh_token: refreshToken,
        expires_at: expiresAt
      })
      .returning();

    // Store in cache for faster lookups
    await sessionCache.set(session.id, {
      userId,
      refreshToken
    });
  }

  private generateOrganizationSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  async getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.is_active, true)))
      .limit(1);

    if (!user) return null;

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUserProfile(
    userId: string,
    updates: { firstName?: string; lastName?: string; email?: string }
  ): Promise<Omit<User, 'password_hash'>> {
    const updateData: any = { updated_at: new Date() };

    if (updates.firstName) updateData.first_name = updates.firstName;
    if (updates.lastName) updateData.last_name = updates.lastName;
    if (updates.email) updateData.email = updates.email;

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    const { password_hash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        password_hash: hashedNewPassword,
        updated_at: new Date()
      })
      .where(eq(users.id, userId));

    // Invalidate all sessions to force re-authentication
    await this.signOut(userId);
  }

  async createUser(
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole,
    organizationId: string,
    createdBy: string,
    email?: string
  ): Promise<Omit<User, 'password_hash'>> {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User with this username already exists');
    }

    if (email) {
      const existingEmailUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingEmailUser.length > 0) {
        throw new Error('User with this email already exists');
      }
    }

    const hashedPassword = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email: email || null,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role,
        organization_id: organizationId,
        created_by: createdBy,
        force_password_change: true
      })
      .returning();

    const { password_hash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async resetUserPassword(
    userId: string,
    newPassword: string,
    forcePasswordChange: boolean = true
  ): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        password_hash: hashedPassword,
        force_password_change: forcePasswordChange,
        updated_at: new Date()
      })
      .where(eq(users.id, userId));

    // Invalidate all sessions for this user
    await this.signOut(userId);
  }

  async handleFirstLoginPasswordChange(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.force_password_change) {
      throw new Error('Password change not required');
    }

    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        password_hash: hashedNewPassword,
        force_password_change: false,
        updated_at: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getOrganizationUsers(organizationId: string): Promise<Omit<User, 'password_hash'>[]> {
    const organizationUsers = await db
      .select()
      .from(users)
      .where(and(eq(users.organization_id, organizationId), eq(users.is_active, true)));

    return organizationUsers.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  // Google OAuth methods
  async findUserByGoogleId(googleId: string): Promise<Omit<User, 'password_hash'> | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.google_id, googleId), eq(users.is_active, true)))
      .limit(1);

    if (!user) return null;

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findUserByEmail(email: string): Promise<Omit<User, 'password_hash'> | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.is_active, true)))
      .limit(1);

    if (!user) return null;

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<Omit<User, 'password_hash'>> {
    const [updatedUser] = await db
      .update(users)
      .set({
        google_id: googleId,
        updated_at: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    const { password_hash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async createGoogleUser(userData: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    provider: string;
  }): Promise<Omit<User, 'password_hash'>> {
    // For Google users, we'll generate a random password they'll never use
    const randomPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = await hashPassword(randomPassword);

    const [newUser] = await db
      .insert(users)
      .values({
        username: userData.email,
        email: userData.email,
        password_hash: hashedPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        google_id: userData.googleId,
        avatar_url: userData.avatar,
        role: UserRole.STAFF, // New Google users start as staff
        is_active: true,
        email_verified: true, // Google accounts are pre-verified
        provider: userData.provider,
        terms_accepted: false // This will be checked for T&C flow
      })
      .returning();

    const { password_hash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async acceptTermsAndConditions(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        terms_accepted: true,
        terms_accepted_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(users.id, userId));
  }

  async googleSignIn(user: Omit<User, 'password_hash'>): Promise<{ user: Omit<User, 'password_hash'>; tokens: AuthTokens; needsTermsAcceptance?: boolean }> {
    const userPayload: TokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email || undefined,
      role: user.role,
      organizationId: user.organization_id || undefined
    };

    const tokens = generateTokenPair(userPayload);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      tokens,
      needsTermsAcceptance: !user.terms_accepted
    };
  }
}

export const authService = new AuthService();
