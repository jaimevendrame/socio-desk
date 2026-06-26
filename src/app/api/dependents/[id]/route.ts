import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dependents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

const updateDependentSchema = z.object({
  type: z.enum(['conjuge', 'filho', 'enteado', 'pais', 'irmao', 'outro']).optional(),
  name: z.string().min(1).max(255).optional(),
  birthDate: z.string().optional(),
  documentType: z.enum(['rg', 'cpf', 'passaporte']).optional().nullable(),
  documentNumber: z.string().max(50).optional().nullable(),
  status: z.enum(['ativo', 'inativo', 'migrado']).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/dependents/[id]
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 400 });
    }

    const response = await withTenantContext(tenantId, userId, async () => {
      const result = await db
        .select()
        .from(dependents)
        .where(eq(dependents.id, id))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json({ error: 'Dependente não encontrado' }, { status: 404 });
      }

      return NextResponse.json(result[0]);
    });

    response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));
    return response;
  } catch (error) {
    console.error('Error fetching dependent:', error);
    return NextResponse.json({ error: 'Erro ao buscar dependente' }, { status: 500 });
  }
}

// PATCH /api/dependents/[id]
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 400 });
    }

    const body = await request.json();
    const validated = updateDependentSchema.parse(body);

    const response = await withTenantContext(tenantId, userId, async () => {
      const [updated] = await db
        .update(dependents)
        .set(validated)
        .where(eq(dependents.id, id))
        .returning();

      if (!updated) {
        return NextResponse.json({ error: 'Dependente não encontrado' }, { status: 404 });
      }

      return NextResponse.json(updated);
    });

    response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error updating dependent:', error);
    return NextResponse.json({ error: 'Erro ao atualizar dependente' }, { status: 500 });
  }
}

// DELETE /api/dependents/[id]
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 400 });
    }

    const response = await withTenantContext(tenantId, userId, async () => {
      const [deleted] = await db
        .delete(dependents)
        .where(eq(dependents.id, id))
        .returning();

      if (!deleted) {
        return NextResponse.json({ error: 'Dependente não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Dependente removido com sucesso' });
    });

    response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));
    return response;
  } catch (error) {
    console.error('Error deleting dependent:', error);
    return NextResponse.json({ error: 'Erro ao remover dependente' }, { status: 500 });
  }
}
