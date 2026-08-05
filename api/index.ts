// Vercel Serverless Function — wraps the Express app for /api/* routes
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiRouter } from '../src/server/routes.js';
import { globalLimiter, authLimiter, adminLimiter, errorHandler } from '../src/server/middleware/security.js';
import { AUTH_CONFIG } from '../src/server/config/authConfig.js';
import type { Request, Response } from 'express';

const app = express();

// Trust proxy (Vercel runs behind a load balancer)
app.set('trust proxy', 1);

// FIX A05: Enable helmet with proper CSP instead of disabling it completely
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "https://*.firebaseapp.com", "https://*.googleapis.com", "https://api.qrserver.com", "https://*.neon.tech"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Cookie parser
app.use(cookieParser(AUTH_CONFIG.cookieSecret));

// FIX A05: Strict CORS — only allow known origins, NOT catch-all
const ALLOWED_ORIGINS = new Set([
  'https://veerikarosegarden.vercel.app',
  'https://www.veerikarosegarden.com',
  'https://veerikarosegarden.com',
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean) as string[]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin requests (no origin header = server-to-server or curl)
    if (!origin) return callback(null, true);
    // Allow Vercel preview deployments (*.vercel.app)
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow explicit allowed origins
    if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);
    // Allow localhost in non-production
    if (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
      return callback(null, true);
    }
    // FIX: Reject all other origins (previously had catch-all that accepted everything)
    console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
    return callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // FIX A01: Removed X-Admin-Email and X-Admin-Role from allowed headers
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Verify', 'X-Merchant-Id'],
}));

// Body parsers (15mb limit to support payment proof screenshot uploads)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// FIX A05: Rate limit ALL routes including admin (removed admin skip)
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/admin', adminLimiter);  // FIX: Admin routes now have dedicated strict rate limiting

// API Routes
app.use('/api', apiRouter);

// Health check — stripped to bare minimum, no env details
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Veerika Rose Garden API',
    timestamp: new Date().toISOString(),
  });
});

// 404 fallback for API
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'API endpoint not found' });
});

// Centralized error handler
app.use(errorHandler);

export default app;
