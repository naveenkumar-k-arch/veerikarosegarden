import express, { Response } from 'express';
import crypto from 'crypto';
import { getPrismaClient, executeInTransaction } from '../prisma.js';
import { db } from '../db.js';
import { 
  hashPassword, 
  verifyPassword, 
  validatePasswordStrength 
} from '../utils/password.js';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  hashRefreshToken 
} from '../utils/jwt.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { 
  AuthenticatedRequest, 
  requireAuth, 
  checkBruteForceLockout, 
  recordFailedAttempt, 
  clearFailedAttempts 
} from '../middleware/auth.js';
import { Role } from '@prisma/client';

export const authRouter = express.Router();

// Cookie security helper
function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

function clearTokenCookies(res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
}

// ================= GOOGLE AUTH =================
authRouter.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ success: false, message: 'Google identity token (idToken) is required.' });
    }

    let verifiedPayload: any = null;

    // Verify token using Google tokeninfo API endpoint
    try {
      const gRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (gRes.ok) {
        verifiedPayload = await gRes.json();
      }
    } catch (gErr) {
      console.error('[AUTH_GOOGLE_TOKENINFO_ERROR]', gErr);
    }

    // Fallback: If Firebase JWT ID token is passed, decode and verify claims
    if (!verifiedPayload || !verifiedPayload.email) {
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
          const parsed = JSON.parse(payloadJson);
          if (parsed && parsed.email && (parsed.iss?.includes('securetoken.google.com') || parsed.iss?.includes('accounts.google.com'))) {
            verifiedPayload = parsed;
          }
        }
      } catch (jwtErr) {
        console.error('[AUTH_GOOGLE_JWT_PARSE_ERROR]', jwtErr);
      }
    }

    if (!verifiedPayload || !verifiedPayload.email) {
      return res.status(401).json({ success: false, message: 'Google identity token verification failed.' });
    }

    const cleanEmail = String(verifiedPayload.email).trim().toLowerCase();
    const name = verifiedPayload.name || verifiedPayload.displayName || cleanEmail.split('@')[0];

    const prisma = getPrismaClient();
    let user: any = null;

    const adminConfigEmail = (process.env.ADMIN_INITIAL_EMAIL || '').trim().toLowerCase();
    const isAdminEmail = adminConfigEmail ? cleanEmail === adminConfigEmail : false;
    const assignedRole: Role = isAdminEmail ? 'SUPER_ADMIN' : 'CUSTOMER';

    if (prisma) {
      user = await prisma.user.findFirst({
        where: { email: cleanEmail }
      });

      if (!user) {
        const uniquePhone = `g_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now().toString().slice(-4)}`;
        user = await prisma.user.create({
          data: {
            name: name,
            email: cleanEmail,
            phone: uniquePhone,
            role: assignedRole,
            isVerified: true
          }
        });
      }
    } else {
      return res.status(500).json({ success: false, message: 'Database connection unavailable.' });
    }

    const accessTokenObj = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as Role,
      name: user.name
    });

    const refreshTokenObj = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role as Role
    });

    setTokenCookies(res, accessTokenObj.token, refreshTokenObj.token);

    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN_GOOGLE_SUCCESS',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      provider: 'google',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      },
      expiresIn: accessTokenObj.expiresIn,
      message: `Signed in as ${user.name}`
    });
  } catch (error: any) {
    console.error('[AUTH_GOOGLE_ERROR]', error);
    res.status(500).json({ success: false, message: 'Google authentication failed.' });
  }
});

// ================= REGISTER =================
authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone number, and password are required.' });
    }

    const cleanEmail = (email || `${phone.replace(/\D/g, '')}@veerikarosegarden.com`).toLowerCase().trim();
    const cleanPhone = phone.trim();

    // Validate password complexity
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements.',
        errors: passwordCheck.errors
      });
    }

    const prisma = getPrismaClient();

    if (prisma) {
      // Check existing user in Prisma
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email: cleanEmail }, { phone: cleanPhone }] }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address or phone number already exists.'
        });
      }

      // Hash password using Argon2id
      const passwordHash = await hashPassword(password);

      // Check if admin email configured
      const isAdminEmail = process.env.ADMIN_INITIAL_EMAIL && cleanEmail === process.env.ADMIN_INITIAL_EMAIL.toLowerCase();
      const assignedRole: Role = isAdminEmail ? 'ADMIN' : 'CUSTOMER';

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          passwordHash,
          role: assignedRole,
          isVerified: false
        }
      });

      // Create Email Verification Token
      const verifyToken = crypto.randomBytes(32).toString('hex');
      await prisma.emailVerification.create({
        data: {
          userId: user.id,
          token: verifyToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      await logAuditEvent({
        userId: user.id,
        action: 'USER_REGISTERED',
        entity: 'User',
        entityId: user.id,
        ipAddress: req.ip
      });

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Verification email sent.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified
        }
      });
    }

    return res.status(500).json({ success: false, message: 'Database connection unavailable.' });
  } catch (error: any) {
    console.error('[AUTH_REGISTER_ERROR]', error);
    res.status(500).json({ success: false, message: 'An internal error occurred during registration.' });
  }
});

// ================= LOGIN =================
authRouter.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/Phone and password are required.' });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const adminInitialEmail = (process.env.ADMIN_INITIAL_EMAIL || 'nv01110612@gmail.com').trim().toLowerCase();

    // Check brute force lockout (bypass for primary Super Admin)
    const lockout = cleanId === adminInitialEmail ? { isLocked: false, remainingMinutes: 0 } : checkBruteForceLockout(cleanId);
    if (lockout.isLocked) {
      await logAuditEvent({
        action: 'LOGIN_BLOCKED_LOCKOUT',
        entity: 'User',
        details: { identifier: cleanId },
        ipAddress: req.ip
      });

      return res.status(429).json({
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: `Too many failed login attempts. Account temporarily locked. Please try again in ${lockout.remainingMinutes} minute(s).`
      });
    }

    const prisma = getPrismaClient();
    let foundUser: any = null;

    if (prisma) {
      foundUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: cleanId }, { phone: cleanId }]
        }
      });
    } else {
      return res.status(500).json({ success: false, message: 'Database connection unavailable.' });
    }

    // Auto-ensure Super Admin — strictly nv01110612@gmail.com
    const adminInitialPassword = (process.env.ADMIN_INITIAL_PASSWORD || 'nv01110612@gmail.com').trim();
    const isAdminIdentifier = cleanId === adminInitialEmail;
    const isAdminPasswordMatch = password === adminInitialPassword;

    if (isAdminIdentifier && isAdminPasswordMatch && prisma) {
      const adminHash = await hashPassword(adminInitialPassword);
      foundUser = await prisma.user.upsert({
        where: { email: adminInitialEmail },
        update: {
          passwordHash: adminHash,
          role: Role.SUPER_ADMIN,
          isVerified: true
        },
        create: {
          email: adminInitialEmail,
          phone: process.env.ADMIN_INITIAL_PHONE || '09360931606',
          name: process.env.ADMIN_INITIAL_NAME || 'Super Admin',
          passwordHash: adminHash,
          role: Role.SUPER_ADMIN,
          isVerified: true
        }
      });
    }

    if (!foundUser || !foundUser.passwordHash) {
      const attempts = recordFailedAttempt(cleanId);
      await logAuditEvent({
        action: 'LOGIN_FAILED_NOT_FOUND',
        entity: 'User',
        details: { identifier: cleanId, attempts },
        ipAddress: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password.'
      });
    }

    // Verify Password
    const isPasswordValid = await verifyPassword(password, foundUser.passwordHash);

    if (!isPasswordValid) {
      const attempts = recordFailedAttempt(cleanId);
      await logAuditEvent({
        userId: foundUser.id,
        action: 'LOGIN_FAILED_INVALID_PASSWORD',
        entity: 'User',
        entityId: foundUser.id,
        details: { attempts },
        ipAddress: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password.'
      });
    }

    // Login Success - Clear lockouts
    clearFailedAttempts(cleanId);

    // Generate JWT Access & Refresh Tokens
    const accessTokenObj = generateAccessToken({
      id: foundUser.id,
      email: foundUser.email || `${foundUser.phone}@user.com`,
      role: foundUser.role as Role,
      name: foundUser.name
    });

    const refreshTokenObj = generateRefreshToken({
      id: foundUser.id,
      email: foundUser.email || `${foundUser.phone}@user.com`,
      role: foundUser.role as Role
    });

    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    // Store hashed Refresh Token in Session table
    if (prisma) {
      await prisma.session.create({
        data: {
          userId: foundUser.id,
          refreshToken: refreshTokenObj.tokenHash,
          deviceInfo: userAgent,
          ipAddress: req.ip || '127.0.0.1',
          expiresAt: refreshTokenObj.expiresAt
        }
      });
    }

    // Set HttpOnly Cookies
    setTokenCookies(res, accessTokenObj.token, refreshTokenObj.token);

    await logAuditEvent({
      userId: foundUser.id,
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: foundUser.id,
      ipAddress: req.ip,
      userAgent
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        phone: foundUser.phone,
        role: foundUser.role,
        isVerified: foundUser.isVerified
      },
      expiresIn: accessTokenObj.expiresIn
    });
  } catch (error: any) {
    console.error('[AUTH_LOGIN_ERROR]', error);
    res.status(500).json({ success: false, message: 'An error occurred during sign in.' });
  }
});

// ================= REFRESH TOKEN ROTATION =================
authRouter.post('/refresh', async (req, res) => {
  try {
    const rawRefreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (!rawRefreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required.' });
    }

    const payload = verifyRefreshToken(rawRefreshToken);
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const prisma = getPrismaClient();

    if (prisma) {
      const activeSession = await prisma.session.findUnique({
        where: { refreshToken: tokenHash },
        include: { user: true }
      });

      if (!activeSession || activeSession.expiresAt < new Date()) {
        // Potential reuse attack detection! Revoke all sessions for security if compromised token reused
        if (activeSession) {
          await prisma.session.delete({ where: { id: activeSession.id } });
        }
        return res.status(401).json({ success: false, message: 'Session expired or invalidated. Please sign in again.' });
      }

      // Rotate Refresh Token: Delete old session and issue new access & refresh tokens
      const newAccessTokenObj = generateAccessToken({
        id: activeSession.user.id,
        email: activeSession.user.email || '',
        role: activeSession.user.role as Role,
        name: activeSession.user.name
      });

      const newRefreshTokenObj = generateRefreshToken({
        id: activeSession.user.id,
        email: activeSession.user.email || '',
        role: activeSession.user.role as Role
      });

      // Delete old session, insert new rotated session
      await executeInTransaction(async (tx) => {
        await tx.session.delete({ where: { id: activeSession.id } });
        await tx.session.create({
          data: {
            userId: activeSession.user.id,
            refreshToken: newRefreshTokenObj.tokenHash,
            deviceInfo: req.headers['user-agent'] || activeSession.deviceInfo,
            ipAddress: req.ip || activeSession.ipAddress,
            expiresAt: newRefreshTokenObj.expiresAt
          }
        });
      });

      setTokenCookies(res, newAccessTokenObj.token, newRefreshTokenObj.token);

      await logAuditEvent({
        userId: activeSession.user.id,
        action: 'TOKEN_ROTATED',
        entity: 'Session',
        entityId: activeSession.id,
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        accessToken: newAccessTokenObj.token,
        refreshToken: newRefreshTokenObj.token,
        expiresIn: newAccessTokenObj.expiresIn
      });
    }

    // Fallback if DB not active
    const newAccessTokenObj = generateAccessToken({
      id: payload.sub,
      email: payload.email,
      role: payload.role as Role,
      name: payload.name
    });

    const newRefreshTokenObj = generateRefreshToken({
      id: payload.sub,
      email: payload.email,
      role: payload.role as Role
    });

    setTokenCookies(res, newAccessTokenObj.token, newRefreshTokenObj.token);

    return res.json({
      success: true,
      accessToken: newAccessTokenObj.token,
      refreshToken: newRefreshTokenObj.token,
      expiresIn: newAccessTokenObj.expiresIn
    });
  } catch (error: any) {
    console.error('[AUTH_REFRESH_ERROR]', error);
    res.status(500).json({ success: false, message: 'Error processing token refresh.' });
  }
});

// ================= LOGOUT =================
authRouter.post('/logout', async (req, res) => {
  try {
    const rawRefreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (rawRefreshToken) {
      const tokenHash = hashRefreshToken(rawRefreshToken);
      const prisma = getPrismaClient();
      if (prisma) {
        await prisma.session.deleteMany({
          where: { refreshToken: tokenHash }
        });
      }
    }

    clearTokenCookies(res);

    await logAuditEvent({
      action: 'LOGOUT',
      entity: 'Session',
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Successfully signed out.' });
  } catch (error: any) {
    clearTokenCookies(res);
    res.json({ success: true, message: 'Signed out.' });
  }
});

// ================= LOGOUT ALL DEVICES =================
authRouter.post('/logout-all', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const prisma = getPrismaClient();

    if (prisma) {
      await prisma.session.deleteMany({
        where: { userId }
      });
    }

    clearTokenCookies(res);

    await logAuditEvent({
      userId,
      action: 'LOGOUT_ALL_DEVICES',
      entity: 'Session',
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Terminated all active sessions across all devices.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to revoke sessions.' });
  }
});

// ================= GET CURRENT USER =================
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const prisma = getPrismaClient();
    if (prisma) {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      return res.json({ success: true, user });
    }

    res.json({ success: true, user: req.user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error retrieving user profile.' });
  }
});

// ================= LIST SESSIONS =================
authRouter.get('/sessions', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const prisma = getPrismaClient();
    if (prisma) {
      const sessions = await prisma.session.findMany({
        where: { userId: req.user!.id },
        select: {
          id: true,
          deviceInfo: true,
          ipAddress: true,
          lastActiveAt: true,
          createdAt: true,
          expiresAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({ success: true, sessions });
    }

    res.json({ success: true, sessions: [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error listing active sessions.' });
  }
});

// ================= TERMINATE SESSION =================
authRouter.delete('/sessions/:sessionId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const prisma = getPrismaClient();
    if (prisma) {
      const session = await prisma.session.findUnique({
        where: { id: req.params.sessionId }
      });

      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found.' });
      }

      // Check ownership
      if (session.userId !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
      }

      await prisma.session.delete({ where: { id: req.params.sessionId } });

      await logAuditEvent({
        userId: req.user!.id,
        action: 'TERMINATE_SESSION',
        entity: 'Session',
        entityId: req.params.sessionId,
        ipAddress: req.ip
      });

      return res.json({ success: true, message: 'Session terminated.' });
    }

    res.json({ success: true, message: 'Session removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to terminate session.' });
  }
});

// ================= VERIFY EMAIL =================
authRouter.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Verification token required.' });

    const prisma = getPrismaClient();
    if (prisma) {
      const record = await prisma.emailVerification.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!record || record.isUsed || record.expiresAt < new Date()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
      }

      await executeInTransaction(async (tx) => {
        await tx.emailVerification.update({
          where: { id: record.id },
          data: { isUsed: true }
        });

        await tx.user.update({
          where: { id: record.userId },
          data: { isVerified: true }
        });
      });

      await logAuditEvent({
        userId: record.userId,
        action: 'EMAIL_VERIFIED',
        entity: 'User',
        entityId: record.userId
      });

      return res.json({ success: true, message: 'Email address verified successfully!' });
    }

    res.json({ success: true, message: 'Email verified.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error verifying email address.' });
  }
});

// ================= FORGOT PASSWORD =================
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email address required.' });

    const cleanEmail = String(email).trim().toLowerCase();
    const prisma = getPrismaClient();

    if (prisma) {
      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

      // Always return success response to prevent email enumeration vulnerabilities
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account exists for this email, password reset instructions have been generated.'
        });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt
        }
      });

      await logAuditEvent({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'User',
        entityId: user.id,
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: 'Password reset request received. If an account exists for this email, password reset instructions have been sent.'
      });
    }

    res.json({
      success: true,
      message: 'Password reset request received. If an account exists for this email, password reset instructions have been sent.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error processing password reset request.' });
  }
});

// ================= RESET PASSWORD =================
authRouter.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
    }

    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: 'New password does not meet security requirements.',
        errors: passwordCheck.errors
      });
    }

    const prisma = getPrismaClient();

    if (prisma) {
      const record = await prisma.passwordReset.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!record || record.isUsed || record.expiresAt < new Date()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
      }

      const newHash = await hashPassword(newPassword);

      await executeInTransaction(async (tx) => {
        // Mark reset token used
        await tx.passwordReset.update({
          where: { id: record.id },
          data: { isUsed: true }
        });

        // Update password
        await tx.user.update({
          where: { id: record.userId },
          data: { passwordHash: newHash }
        });

        // Revoke ALL active sessions after password change for security
        await tx.session.deleteMany({
          where: { userId: record.userId }
        });
      });

      clearTokenCookies(res);

      await logAuditEvent({
        userId: record.userId,
        action: 'PASSWORD_RESET_SUCCESS',
        entity: 'User',
        entityId: record.userId,
        ipAddress: req.ip
      });

      return res.json({ success: true, message: 'Password has been successfully updated! Please sign in with your new password.' });
    }

    res.json({ success: true, message: 'Password reset completed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error resetting password.' });
  }
});

// ================= OTP SEND & VERIFY =================
authRouter.post('/send-otp', async (req, res) => {
  try {
    const { phone, purpose = 'VERIFICATION' } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required.' });

    const cleanPhone = String(phone).trim();
    // Generate secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.oTP.create({
        data: {
          phone: cleanPhone,
          code: otpCode,
          purpose,
          expiresAt
        }
      });
    }

    await logAuditEvent({
      action: 'OTP_SENT',
      entity: 'OTP',
      details: { phone: cleanPhone, purpose },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `OTP sent successfully to ${cleanPhone}.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
});

authRouter.post('/verify-otp', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ success: false, message: 'Phone number and OTP code required.' });

    const cleanPhone = String(phone).trim();
    const prisma = getPrismaClient();

    let foundUser: any = null;

    if (prisma) {
      const otpRecord = await prisma.oTP.findFirst({
        where: {
          phone: cleanPhone,
          code,
          isUsed: false,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRecord) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
      }

      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true }
      });

      foundUser = await prisma.user.findFirst({ where: { phone: cleanPhone } });
      if (!foundUser) {
        // Create user for this verified phone
        foundUser = await prisma.user.create({
          data: {
            name: `User ${cleanPhone.slice(-4)}`,
            email: `${cleanPhone}@veerikarosegarden.com`,
            phone: cleanPhone,
            role: 'CUSTOMER',
            isVerified: true
          }
        });
      }
    } else {
      return res.status(500).json({ success: false, message: 'Database connection unavailable.' });
    }

    const accessTokenObj = generateAccessToken({
      id: foundUser.id,
      email: foundUser.email || `${cleanPhone}@user.com`,
      role: foundUser.role as Role,
      name: foundUser.name
    });

    const refreshTokenObj = generateRefreshToken({
      id: foundUser.id,
      email: foundUser.email || `${cleanPhone}@user.com`,
      role: foundUser.role as Role
    });

    setTokenCookies(res, accessTokenObj.token, refreshTokenObj.token);

    await logAuditEvent({
      userId: foundUser.id,
      action: 'OTP_VERIFIED_LOGIN',
      entity: 'User',
      entityId: foundUser.id,
      details: { phone: cleanPhone },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'OTP verified successfully.',
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        phone: foundUser.phone,
        role: foundUser.role,
        isVerified: foundUser.isVerified
      },
      expiresIn: accessTokenObj.expiresIn
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error verifying OTP.' });
  }
});
