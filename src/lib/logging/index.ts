import { db } from '@/lib/db/client';
import { auditLogs } from '@/lib/db/schema';

interface AuditLogParams {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  tenantId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function auditLog(params: AuditLogParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      userId: params.userId,
      tenantId: params.tenantId,
      changes: params.changes || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    // Log do erro mas não falha a operação principal
    console.error('[AUDIT LOG ERROR]', error);
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }));
  },

  error: (message: string, error?: Error, context?: Record<string, unknown>) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      timestamp: new Date().toISOString(),
      ...context,
    }));
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }));
  },
};
