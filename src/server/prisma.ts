import { PrismaClient } from '@prisma/client';

// Global singleton to survive hot-reload in serverless environments
declare global {
  // eslint-disable-next-line no-var
  var __prismaGlobal: PrismaClient | undefined;
}

/**
 * Returns a lazy-initialized Prisma Client instance if DATABASE_URL is set in environment.
 * Uses global singleton to prevent connection exhaustion in serverless (Vercel).
 */
export function getPrismaClient(): PrismaClient | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim() === '') {
    return null;
  }

  if (!global.__prismaGlobal) {
    try {
      // For Neon serverless: use pooler URL with pgbouncer
      const serverlessUrl = dbUrl.includes('pgbouncer')
        ? dbUrl
        : dbUrl.includes('-pooler.')
        ? `${dbUrl}${dbUrl.includes('?') ? '&' : '?'}pgbouncer=true&connect_timeout=15`
        : dbUrl.replace(
            /(@ep-[^.]+)(\.)/,
            '$1-pooler$2'
          ).replace('?sslmode=require', '?sslmode=require&pgbouncer=true&connect_timeout=15');

      global.__prismaGlobal = new PrismaClient({
        datasources: {
          db: {
            url: serverlessUrl
          }
        },
        log: ['error']
      });

      // Eagerly connect to wake up Neon on cold start (free tier sleeps)
      global.__prismaGlobal.$connect().catch(() => {
        // Ignore initial connect error — Neon wakes up on first query
      });
    } catch (err) {
      console.error('Failed to initialize Prisma Client:', err);
      return null;
    }
  }

  return global.__prismaGlobal;
}

/**
 * Check if the Prisma PostgreSQL database is connected and available.
 */
export async function isPrismaConnected(): Promise<boolean> {
  const client = getPrismaClient();
  if (!client) return false;

  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    console.warn('Prisma database health check failed:', err);
    return false;
  }
}

/**
 * Execute a callback inside an ACID compliant Prisma transaction.
 */
export async function executeInTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const client = getPrismaClient();
  if (!client) {
    throw new Error('PostgreSQL / Prisma client is not configured.');
  }

  return await client.$transaction(async (tx) => {
    return await callback(tx);
  });
}
