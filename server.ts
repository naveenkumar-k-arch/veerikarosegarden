import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes.js';
import { globalLimiter, authLimiter, errorHandler } from './src/server/middleware/security.js';
import { AUTH_CONFIG } from './src/server/config/authConfig.js';
import { prewarmAllCaches } from './src/server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable gzip response compression for fast API transfers
  app.use(compression({ threshold: 512, level: 6 }));

  // Enable trust proxy for reverse proxies (Nginx / Cloud Run)
  app.set('trust proxy', 1);

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Vite handles script injection; disabled CSP blocking Vite dev scripts
    crossOriginEmbedderPolicy: false
  }));

  // Cookie Parser
  app.use(cookieParser(AUTH_CONFIG.cookieSecret));

  // Allowed CORS Origins — covers local dev and any configured CLIENT_URL
  const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    process.env.CLIENT_URL
  ].filter(Boolean));

  // Restrict CORS to allowed origins
  app.use(cors({
    origin: (origin, callback) => {
      // Allow server-to-server, null-origin (embedded browser/preview), or curl requests
      if (!origin || origin === 'null') return callback(null, true);
      // Allow explicit origins
      if (allowedOrigins.has(origin)) return callback(null, true);
      // Allow any localhost / 127.0.0.1 regardless of port
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      // Reject non-whitelisted origin — log for visibility, don't throw (avoids 500 error response)
      console.warn(`[CORS] Rejected origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Verify', 'X-Merchant-Id']
  }));

  // Body size limit — 15mb to support payment proof screenshot uploads
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Global Rate Limiter
  app.use('/api', globalLimiter);

  // Dedicated Auth Rate Limiter
  app.use('/api/auth', authLimiter);

  // Mount API routes
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Veerika Rose Garden Nursery E-Commerce',
      timestamp: new Date().toISOString()
    });
  });

  // Catch-all 404 handler for unmatched API routes (ensures API always returns JSON, never HTML)
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: `API endpoint '${req.originalUrl}' not found`
    });
  });

  // Dynamic robots.txt endpoint
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`);
  });

  // Dynamic sitemap.xml endpoint
  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    const host = `${req.protocol}://${req.get('host')}`;
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${host}/#/shop</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${host}/#/care-guide</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${host}/#/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`);
  });

  // Vite Dev Server or Production Static Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/src/data/**',
            '**/src/data/*.json',
            '**/data/**',
            '**/scratch/**',
            '**/*.json',
            '**/.git/**'
          ]
        }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Error Handler
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌿 Veerika Rose Garden Server running on http://0.0.0.0:${PORT}`);
    // Warm all high-traffic RAM caches in background so cold start latency is eliminated
    prewarmAllCaches().catch(() => {});
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
