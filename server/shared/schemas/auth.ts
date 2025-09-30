import { z } from 'zod';
import { UserRole } from '../types/database.js';

export const signUpSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organizationName: z.string().min(1, 'Organization name is required').optional()
});

export const signInSchema = z.object({
  username: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(UserRole)
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required')
});

export const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.nativeEnum(UserRole)
});

export const resetUserPasswordSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  forcePasswordChange: z.boolean().default(true)
});

export const firstLoginPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

export const userRoleSchema = z.nativeEnum(UserRole);

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;
export type FirstLoginPasswordChangeInput = z.infer<typeof firstLoginPasswordChangeSchema>;