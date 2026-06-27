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
    console.error('[AUDIT LOG ERROR]', error);
  }
}
