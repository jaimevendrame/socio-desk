import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { spaces, reservations } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

const updateSpaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  category: z.enum(['esportivo', 'social', 'equipamento']).optional(),
  bufferMinutes: z.number().int().min(0).optional(),
  minReservationMinutes: z.number().int().min(15).optional(),
  maxReservationMinutes: z.number().int().min(30).optional(),
  maxAdvanceDays: z.number().int().min(1).optional(),
  maxReservationsPerDay: z.number().int().optional().nullable(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  hasCost: z.boolean().optional(),
  costAmount: z.number().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/spaces/[id] - Obter espaço por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = checkRateLimit(request, 'api');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)) } }
      );
    }
    const { id } = await params;
    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 401 });
    }

    return withTenantContext(tenantId, userId, async () => {
      const [space] = await db
        .select()
        .from(spaces)
        .where(eq(spaces.id, id));

      if (!space) {
        return NextResponse.json({ error: 'Espaço não encontrado' }, { status: 404 });
      }

      const spaceReservations = await db
        .select()
        .from(reservations)
        .where(eq(reservations.spaceId, id))
        .orderBy(desc(reservations.date))
        .limit(10);

      return NextResponse.json({ ...space, reservations: spaceReservations });
    });
  } catch (error) {
    console.error('Error fetching space:', error);
    return NextResponse.json({ error: 'Erro ao buscar espaço' }, { status: 500 });
  }
}

// PUT /api/spaces/[id] - Atualizar espaço
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = checkRateLimit(request, 'api');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)) } }
      );
    }
    const { id } = await params;
    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateSpaceSchema.parse(body);

    return withTenantContext(tenantId, userId, async () => {
      const [updatedSpace] = await db
        .update(spaces)
        .set({
          name: validated.name,
          description: validated.description,
          category: validated.category,
          bufferMinutes: validated.bufferMinutes,
          minReservationMinutes: validated.minReservationMinutes,
          maxReservationMinutes: validated.maxReservationMinutes,
          maxAdvanceDays: validated.maxAdvanceDays,
          maxReservationsPerDay: validated.maxReservationsPerDay,
          openTime: validated.openTime,
          closeTime: validated.closeTime,
          hasCost: validated.hasCost,
          costAmount: validated.costAmount?.toString(),
          isActive: validated.isActive,
          updatedAt: new Date(),
        })
        .where(eq(spaces.id, id))
        .returning();

      if (!updatedSpace) {
        return NextResponse.json({ error: 'Espaço não encontrado' }, { status: 404 });
      }

      return NextResponse.json(updatedSpace);
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error updating space:', error);
    return NextResponse.json({ error: 'Erro ao atualizar espaço' }, { status: 500 });
  }
}

// DELETE /api/spaces/[id] - Excluir espaço
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = checkRateLimit(request, 'api');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)) } }
      );
    }
    const { id } = await params;
    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 401 });
    }

    return withTenantContext(tenantId, userId, async () => {
      const [deletedSpace] = await db
        .delete(spaces)
        .where(eq(spaces.id, id))
        .returning();

      if (!deletedSpace) {
        return NextResponse.json({ error: 'Espaço não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ success: true, deleted: deletedSpace });
    });
  } catch (error) {
    console.error('Error deleting space:', error);
    return NextResponse.json({ error: 'Erro ao excluir espaço' }, { status: 500 });
  }
}
