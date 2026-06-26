import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dependents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

const createDependentSchema = z.object({
  memberId: z.string().uuid(),
  type: z.enum(['conjuge', 'filho', 'enteado', 'pais', 'irmao', 'outro']),
  name: z.string().min(1).max(255),
  birthDate: z.string(),
  documentType: z.enum(['rg', 'cpf', 'passaporte']).optional(),
  documentNumber: z.string().max(50).optional(),
});

const updateDependentSchema = createDependentSchema.partial().omit({ memberId: true });

// GET /api/dependents?memberId=xxx
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
    const memberId = searchParams.get('memberId');
    const queryTenantId = searchParams.get('tenantId');

    const sessionData = await getSessionWithTenant(request.headers);
    const sessionTenantId = sessionData?.user.tenantId;
    const tenantId = queryTenantId || sessionTenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
    }

    const userId = sessionData?.user.id;

    const response = await withTenantContext(tenantId, userId, async () => {
      if (!memberId) {
        return NextResponse.json({ error: 'memberId é obrigatório' }, { status: 400 });
      }

      const result = await db
        .select()
        .from(dependents)
        .where(eq(dependents.memberId, memberId));

      return NextResponse.json({ data: result });
    });

    response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));
    return response;
  } catch (error) {
    console.error('Error fetching dependents:', error);
    return NextResponse.json({ error: 'Erro ao buscar dependentes' }, { status: 500 });
  }
}

// POST /api/dependents
export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 'write');
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

    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 400 });
    }

    const body = await request.json();
    const validated = createDependentSchema.parse(body);

    const response = await withTenantContext(tenantId, userId, async () => {
      const [newDependent] = await db
        .insert(dependents)
        .values({
          ...validated,
          status: 'ativo',
        })
        .returning();

      return NextResponse.json(newDependent, { status: 201 });
    });

    response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error creating dependent:', error);
    return NextResponse.json({ error: 'Erro ao criar dependente' }, { status: 500 });
  }
}
