import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AUTH_CONFIG } from '../config/authConfig.js';
import { Role } from '@prisma/client';

export interface TokenPayload {
  sub: string;             // User ID
  email: string;
  role: Role;
  name?: string;
  jti: string;             // Unique JWT ID
  type: 'ACCESS' | 'REFRESH';
  iss?: string;
  aud?: string;
}

export function generateAccessToken(user: { id: string; email: string; role: Role; name?: string }): { token: string; jti: string; expiresIn: string } {
  const jti = crypto.randomUUID();
  const payload: Omit<TokenPayload, 'iss' | 'aud'> = {
    sub: user.id,
    email: user.email.toLowerCase(),
    role: user.role,
    name: user.name,
    jti,
    type: 'ACCESS'
  };

  const token = jwt.sign(payload, AUTH_CONFIG.jwtAccessSecret as jwt.Secret, {
    expiresIn: '7d',
    issuer: AUTH_CONFIG.issuer,
    audience: AUTH_CONFIG.audience
  });

  return { token, jti, expiresIn: AUTH_CONFIG.accessTokenExpiresIn };
}

export function generateRefreshToken(user: { id: string; email: string; role: Role }): { token: string; jti: string; tokenHash: string; expiresAt: Date } {
  const jti = crypto.randomUUID();
  const payload: Omit<TokenPayload, 'iss' | 'aud'> = {
    sub: user.id,
    email: user.email.toLowerCase(),
    role: user.role,
    jti,
    type: 'REFRESH'
  };

  const token = jwt.sign(payload, AUTH_CONFIG.jwtRefreshSecret as jwt.Secret, {
    expiresIn: '7d',
    issuer: AUTH_CONFIG.issuer,
    audience: AUTH_CONFIG.audience
  });

  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + AUTH_CONFIG.refreshTokenExpiresDays * 24 * 60 * 60 * 1000);

  return { token, jti, tokenHash, expiresAt };
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, AUTH_CONFIG.jwtAccessSecret, {
      issuer: AUTH_CONFIG.issuer,
      audience: AUTH_CONFIG.audience
    }) as TokenPayload;

    if (decoded && decoded.type === 'ACCESS') {
      return decoded;
    }
    return null;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, AUTH_CONFIG.jwtRefreshSecret, {
      issuer: AUTH_CONFIG.issuer,
      audience: AUTH_CONFIG.audience
    }) as TokenPayload;

    if (decoded && decoded.type === 'REFRESH') {
      return decoded;
    }
    return null;
  } catch (err) {
    return null;
  }
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
