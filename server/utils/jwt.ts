import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { AuthTokens, JWTPayload, UserRole } from '../shared';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined');
}
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export interface TokenPayload {
  userId: string;
  username?: string;
  email?: string;
  role: UserRole;
  organizationId?: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRY as any,
    issuer: 'officestore-api',
    audience: 'officestore-client'
  };
  return jwt.sign(payload as object, JWT_SECRET as Secret, options);
}

export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRY as any,
    issuer: 'officestore-api',
    audience: 'officestore-client'
  };
  return jwt.sign(payload as object, JWT_REFRESH_SECRET as Secret, options);
}

export function generateTokenPair(payload: TokenPayload): AuthTokens {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as Secret, {
      issuer: 'officestore-api',
      audience: 'officestore-client'
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid access token');
  }
}

export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET as Secret, {
      issuer: 'officestore-api',
      audience: 'officestore-client'
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}