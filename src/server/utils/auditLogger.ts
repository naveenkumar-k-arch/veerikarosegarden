import { getPrismaClient } from '../prisma.js';

export interface AuditLogOptions {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any> | string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(options: AuditLogOptions): Promise<void> {
  const detailsStr = typeof options.details === 'object' 
    ? JSON.stringify(options.details) 
    : options.details || '';

  const prisma = getPrismaClient();
  if (prisma) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: options.userId || null,
          action: options.action,
          entity: options.entity,
          entityId: options.entityId || null,
          details: detailsStr,
          ipAddress: options.ipAddress || null,
          userAgent: options.userAgent || null
        }
      });
      return;
    } catch (err) {
      console.warn('[AUDIT] Failed to save audit log to database:', err);
    }
  }

  // Fallback console log for audit trail
  console.log(`[AUDIT_LOG] [${new Date().toISOString()}] Action: ${options.action} | Entity: ${options.entity} | User: ${options.userId || 'ANONYMOUS'} | IP: ${options.ipAddress || 'UNKNOWN'}`);
}
