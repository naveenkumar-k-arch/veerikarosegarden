import { PrismaClient } from '@prisma/client';

// Global singletons to survive hot-reload in serverless environments
declare global {
  // eslint-disable-next-line no-var
  var __prismaGlobal: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __prismaNeonReadGlobal: PrismaClient | undefined;
}

function getPrimaryDatabaseUrl(): string | null {
  const dbUrl = (process.env.DATABASE_URL || '').trim();
  const neonUrl = (process.env.NEON_DATABASE_URL || '').trim();

  // If DATABASE_URL is pointing to dead/inactive Supabase instance, failover directly to active NEON
  if ((dbUrl.includes('supabase.co') || dbUrl.includes('supabase.com')) && neonUrl) {
    return neonUrl;
  }

  // If neonUrl is provided and valid, and dbUrl is missing or points to supabase
  if (neonUrl && (!dbUrl || dbUrl.includes('supabase'))) {
    return neonUrl;
  }

  if (dbUrl) return dbUrl;
  if (neonUrl) return neonUrl;
  return null;
}

/**
 * Returns a lazy-initialized Prisma Client instance for the Primary Database.
 * Automatically falls back to NEON_DATABASE_URL if DATABASE_URL is pointing to dead Supabase or missing.
 */
export function getPrismaClient(): PrismaClient | null {
  const dbUrl = getPrimaryDatabaseUrl();
  if (!dbUrl) {
    return null;
  }

  if (!global.__prismaGlobal) {
    try {
      let serverlessUrl = dbUrl;
      if (!serverlessUrl.includes('pgbouncer') && (serverlessUrl.includes('pooler') || serverlessUrl.includes('neon.tech') || serverlessUrl.includes('6543'))) {
        serverlessUrl += (serverlessUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
      }
      if (!serverlessUrl.includes('connection_limit')) {
        serverlessUrl += (serverlessUrl.includes('?') ? '&' : '?') + 'connection_limit=3';
      }
      if (!serverlessUrl.includes('pool_timeout')) {
        serverlessUrl += '&pool_timeout=10';
      }
      if (!serverlessUrl.includes('connect_timeout')) {
        serverlessUrl += '&connect_timeout=10';
      }

      global.__prismaGlobal = new PrismaClient({
        datasources: { db: { url: serverlessUrl } },
        log: ['error']
      });

      global.__prismaGlobal.$connect().catch((err) => {
        console.warn('Prisma eager connect notice:', err);
      });
    } catch (err) {
      console.error('Failed to initialize Prisma Client:', err);
      return null;
    }
  }

  return global.__prismaGlobal;
}

/**
 * Returns a lazy-initialized Prisma Client instance for the High-Egress Read Database (Neon).
 * If primary and read database URLs are identical, reuses the primary client to save serverless connections.
 */
export function getReadPrismaClient(): PrismaClient | null {
  const neonUrl = (process.env.NEON_DATABASE_URL || '').trim();
  const primaryUrl = getPrimaryDatabaseUrl();

  // If read URL is identical to resolved primary URL, reuse primary client
  if (!neonUrl || (primaryUrl && neonUrl === primaryUrl)) {
    return getPrismaClient();
  }

  if (!global.__prismaNeonReadGlobal) {
    try {
      let serverlessUrl = neonUrl;
      if (!serverlessUrl.includes('pgbouncer') && (serverlessUrl.includes('pooler') || serverlessUrl.includes('neon.tech'))) {
        serverlessUrl += (serverlessUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
      }
      if (!serverlessUrl.includes('connection_limit')) {
        serverlessUrl += (serverlessUrl.includes('?') ? '&' : '?') + 'connection_limit=3';
      }

      global.__prismaNeonReadGlobal = new PrismaClient({
        datasources: { db: { url: serverlessUrl } },
        log: ['error']
      });

      global.__prismaNeonReadGlobal.$connect().catch((err) => {
        console.warn('Prisma Neon eager connect notice:', err);
      });
    } catch (err) {
      console.warn('Failed to initialize Neon Prisma Client, using Primary client:', err);
      return getPrismaClient();
    }
  }

  return global.__prismaNeonReadGlobal;
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
