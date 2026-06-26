import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { spaces } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

const createSpaceSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(['esportivo', 'social', 'equipamento']),
  bufferMinutes: z.number().int().min(0).default(15),
  minReservationMinutes: z.number().int().min(15).default(30),
  maxReservationMinutes: z.number().int().min(30).default(480),
  maxAdvanceDays: z.number().int().min(1).default(30),
  maxReservationsPerDay: z.number().int().optional(),
  openTime: z.string().default('06:00'),
  closeTime: z.string().default('22:00'),
  hasCost: z.boolean().default(false),
  costAmount: z.number().optional(),
  isActive: z.boolean().default(true),
});

// GET /api/spaces - Listar espaços
export async function GET(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 'api');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)) } }
      );
    }
    const { searchParams } = new URL(request.url);
    let tenantId = searchParams.get('tenantId');
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    // Resolve tenantId from session (with DB lookup for tenant_id)
    const sessionData = await getSessionWithTenant(request.headers);
    const sessionTenantId = sessionData?.user.tenantId;
    const resolvedTenantId = tenantId || sessionTenantId;

    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
    }

    const userId = sessionData?.user.id;

    return withTenantContext(resolvedTenantId, userId, async () => {
      const conditions = [eq(spaces.tenantId, resolvedTenantId)];

      if (category) {
        conditions.push(eq(spaces.category, category as 'esportivo' | 'social' | 'equipamento'));
      }

      if (active !== null) {
        conditions.push(eq(spaces.isActive, active === 'true'));
      }

      const result = await db
        .select()
        .from(spaces)
        .where(and(...conditions))
        .orderBy(desc(spaces.createdAt));

      return NextResponse.json({ data: result });
    });
  } catch (error) {
    console.error('Error fetching spaces:', error);
    return NextResponse.json({ error: 'Erro ao buscar espaços' }, { status: 500 });
  }
}

// POST /api/spaces - Criar espaço
export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 'write');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)) } }
      );
    }
    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 400 });
    }

    const body = await request.json();
    const validated = createSpaceSchema.parse(body);

    return withTenantContext(tenantId, userId, async () => {
      const [newSpace] = await db
        .insert(spaces)
        .values({
          ...validated,
          tenantId,
          costAmount: validated.costAmount?.toString(),
        })
        .returning();

      return NextResponse.json(newSpace, { status: 201 });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error creating space:', error);
    return NextResponse.json({ error: 'Erro ao criar espaço' }, { status: 500 });
  }
}
