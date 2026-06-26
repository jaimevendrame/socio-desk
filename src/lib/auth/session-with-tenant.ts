// Get session with tenantId in a single call
// Calls auth.api.getSession() + db query for tenant_id (bypasses RLS on sessions)
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';
import type { SessionUser } from './permissions';

interface SessionWithTenant {
  user: SessionUser;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    tenantId: string | undefined;
  };
}

export async function getSessionWithTenant(headers: Headers): Promise<SessionWithTenant | null> {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;

  let tenantId: string | undefined;
  if ((session.session as any)?.token) {
    try {
      const result = await db.execute(
        sql`SELECT tenant_id FROM sessions WHERE token = ${(session.session as any).token} LIMIT 1`,
      );
      tenantId = result.rows?.[0]?.tenant_id as string | undefined;
    } catch { /* non-critical */ }
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      name: session.user.name ?? undefined,
      image: session.user.image ?? undefined,
      emailVerified: (session.user as any).emailVerified ?? false,
      tenantId,
    },
    session: {
      id: session.session.id,
      expiresAt: session.session.expiresAt,
      token: (session.session as any).token ?? '',
      tenantId,
    },
  };
}
