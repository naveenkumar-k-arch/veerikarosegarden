// Vercel Serverless Function — wraps the Express app for /api/* routes
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiRouter } from '../src/server/routes.js';
import { globalLimiter, authLimiter, errorHandler } from '../src/server/middleware/security.js';
import { AUTH_CONFIG } from '../src/server/config/authConfig.js';
import type { Request, Response } from 'express';

const app = express();

// Trust proxy (Vercel runs behind a load balancer)
app.set('trust proxy', 1);

// Security
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// Cookie parser
app.use(cookieParser(AUTH_CONFIG.cookieSecret));

// CORS — allow Vercel preview + production URLs
const allowedOrigins = new Set([
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean) as string[]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.endsWith('.vercel.app') || allowedOrigins.has(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Verify', 'X-Merchant-Id', 'X-Admin-Email', 'X-Admin-Role'],
}));

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Rate limiters
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// API Routes
app.use('/api', apiRouter);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Veerika Rose Garden — Vercel Serverless',
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
