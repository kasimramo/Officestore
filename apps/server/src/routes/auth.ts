import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { signUpSchema, signInSchema, refreshTokenSchema, updateProfileSchema, changePasswordSchema } from '@officestore/shared';
import { authService } from '../services/auth.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validatePasswordStrength } from '../utils/password.js';

const router = Router();


// Validation middleware
const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors
          }
        });
        return;
      }
      next(error);
    }
  };
};

// POST /api/auth/signup
router.post('/signup', validateBody(signUpSchema), async (req: Request, res: Response) => {
  try {
    const { username, email, password, firstName, lastName, organizationName } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password does not meet security requirements',
          details: passwordValidation.errors
        }
      });
      return;
    }

    const result = await authService.signUp(email, password, firstName, lastName, organizationName);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens,
        organization: result.organization
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error);

    if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: error.message
        }
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SIGNUP_FAILED',
        message: 'Failed to create user account'
      }
    });
  }
});

// POST /api/auth/signin
router.post('/signin', validateBody(signInSchema), async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const result = await authService.signIn(username, password);

    res.json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens,
        organization: result.organization
      }
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', validateBody(refreshTokenSchema), async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshTokens(refreshToken);

    res.json({
      success: true,
      data: { tokens }
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token'
      }
    });
  }
});

// POST /api/auth/signout
router.post('/signout', requireAuth, async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken;
    await authService.signOut(req.user!.userId, refreshToken);

    res.json({
      success: true,
      data: { message: 'Successfully signed out' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SIGNOUT_FAILED',
        message: 'Failed to sign out'
      }
    });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await authService.getUserById(req.user!.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_USER_FAILED',
        message: 'Failed to fetch user information'
      }
    });
  }
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, validateBody(updateProfileSchema), async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const user = await authService.updateUserProfile(req.user!.userId, updates);

    res.json({
      success: true,
      data: { user }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PROFILE_FAILED',
        message: 'Failed to update user profile'
      }
    });
  }
});

// PUT /api/auth/password
router.put('/password', requireAuth, validateBody(changePasswordSchema), async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'New password does not meet security requirements',
          details: passwordValidation.errors
        }
      });
      return;
    }

    await authService.changePassword(req.user!.userId, currentPassword, newPassword);

    res.json({
      success: true,
      data: { message: 'Password changed successfully' }
    });
  } catch (error: any) {
    if (error.message.includes('incorrect')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INCORRECT_PASSWORD',
          message: error.message
        }
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'CHANGE_PASSWORD_FAILED',
        message: 'Failed to change password'
      }
    });
  }
});


export { router as authRouter };
