import { Request, Response, NextFunction } from 'express';
import { UserRole, JWTPayload } from '@officestore/shared';
import { verifyAccessToken, extractBearerToken } from '../utils/jwt.js';
import { sessionCache } from '../config/redis.js';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication token is required'
        }
      });
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token'
      }
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions for this action'
        }
      });
      return;
    }

    next();
  };
}

export function requireOrganization(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.organizationId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'NO_ORGANIZATION',
        message: 'User must be associated with an organization'
      }
    });
    return;
  }

  next();
}

export function requireActiveSession(req: Request, res: Response, next: NextFunction): void {
  // This middleware can be used to validate session state from Redis
  // For now, we'll implement basic token validation
  requireAuth(req, res, next);
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (token) {
      try {
        const payload = verifyAccessToken(token);
        req.user = payload;
      } catch (error) {
        // Token is invalid, but we continue without user context
      }
    }

    next();
  } catch (error) {
    next();
  }
}

// Composed middleware functions for common use cases
export const requireAdminAuth = [requireAuth, requireRole(UserRole.ADMIN)];
export const requireProcurementAuth = [requireAuth, requireRole(UserRole.ADMIN, UserRole.PROCUREMENT)];
export const requireApproverAuth = [requireAuth, requireRole(UserRole.ADMIN, UserRole.PROCUREMENT, UserRole.APPROVER_L1, UserRole.APPROVER_L2)];
export const requireOrganizationAuth = [requireAuth, requireOrganization];