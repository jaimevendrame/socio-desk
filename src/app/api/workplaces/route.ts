import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workplaces } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

// GET /api/workplaces - Listar locais de trabalho
export async function GET(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 'api');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryTenantId = searchParams.get('tenantId');

    const sessionData = await getSessionWithTenant(request.headers);
    const sessionTenantId = sessionData?.user.tenantId;
    const tenantId = queryTenantId || sessionTenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
    }

    const userId = sessionData?.user.id;

    const response = await withTenantContext(tenantId, userId, async () => {
      const result = await db
        .select()
        .from(workplaces)
        .where(eq(workplaces.tenantId, tenantId))
        .orderBy(desc(workplaces.createdAt));

      return NextResponse.json({ data: result });
    });

    response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));
    return response;
  } catch (error) {
    console.error('Error fetching workplaces:', error);
    return NextResponse.json({ error: 'Erro ao buscar locais de trabalho' }, { status: 500 });
  }
}
