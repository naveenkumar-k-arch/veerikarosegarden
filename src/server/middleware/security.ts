import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Global API rate limiter (2000 requests / 15 mins)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  // FIX A05: Removed 'admin' from skip list — admin routes now rate limited
  skip: (req) => req.path.startsWith('/health'),
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Dedicated Auth rate limiter (50 requests / 15 mins)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
  }
});

// FIX A05: Strict Admin rate limiter (20 requests / 15 mins)
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    code: 'ADMIN_RATE_LIMIT_EXCEEDED',
    message: 'Too many admin requests. Please wait before trying again.'
  }
});

// Sensitive Checkout rate limiter (100 requests / 15 mins)
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many checkout requests initiated. Please wait a few minutes before trying again.'
  }
});

// Helper to sanitize error objects and prevent PII/secret leaks
function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  const sensitiveKeys = ['password', 'token', 'resettoken', 'otpcode', 'phonepesaltkey', 'secret', 'authorization', 'cookie'];
  const sanitized: any = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Centralized error handler middleware
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const sanitizedErr = sanitizeLogData({
    method: req.method,
    path: req.path,
    error: err.message || String(err),
    timestamp: new Date().toISOString()
  });

  console.error(' [API Error]:', sanitizedErr);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Internal Server Error'
  });
}
