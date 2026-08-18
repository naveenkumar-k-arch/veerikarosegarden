// Vercel Serverless Function — wraps the Express app for /api/* routes
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { apiRouter } from '../src/server/routes.js';
import { globalLimiter, authLimiter, adminLimiter, errorHandler } from '../src/server/middleware/security.js';
import { AUTH_CONFIG } from '../src/server/config/authConfig.js';
import type { Request, Response } from 'express';

const app = express();

// Enable gzip response compression on Vercel
app.use(compression({ threshold: 512, level: 6 }));

// Trust proxy (Vercel runs behind a load balancer)
app.set('trust proxy', 1);

// FIX A05: Enable helmet with proper CSP instead of disabling it completely
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://apis.google.com", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:", "https://*.razorpay.com"],
      connectSrc: ["'self'", "https://*.firebaseapp.com", "https://*.googleapis.com", "https://api.qrserver.com", "https://*.neon.tech", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Cookie parser
app.use(cookieParser(AUTH_CONFIG.cookieSecret));

// Allowed origins — covers all known deployment domains
const ALLOWED_ORIGINS = new Set([
  // Production custom domain
  'https://vrgnursery.in',
  'https://www.vrgnursery.in',
  'https://veerikarosegarden.com',
  'https://www.veerikarosegarden.com',
  // Vercel deployments (main + previews handled by endsWith below)
  'https://veerikarosegarden.vercel.app',
  'https://flower.vercel.app',
  // Render.com deployments
  'https://veerika-rose-garden.onrender.com',
  // From env (set CLIENT_URL in Vercel/Render dashboard)
  process.env.CLIENT_URL,
  // Local development
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
].filter(Boolean) as string[]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin / server-to-server / null-origin requests (embedded browsers, curl, etc.)
    if (!origin || origin === 'null') return callback(null, true);
    // Allow any *.vercel.app (covers preview deployments like flower-abc123.vercel.app)
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow any *.onrender.com (covers Render.com preview/production deployments)
    if (origin.endsWith('.onrender.com')) return callback(null, true);
    // Allow explicit allowed origins
    if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);
    // Allow any localhost / 127.0.0.1 regardless of port in development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    // Reject unauthorized origins — log for monitoring
    console.warn(`[CORS] Blocked origin: ${origin}`);
    // Return null (allow the request but without CORS headers) rather than throwing
    // an Error that cascades into the error handler as a confusing 500 response.
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
