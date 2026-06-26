import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

const updateReservationSchema = z.object({
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  status: z.enum(['pendente', 'confirmada', 'cancelada', 'concluida']).optional(),
  notes: z.string().optional().nullable(),
  isPaid: z.boolean().optional(),
  cancelReason: z.string().optional().nullable(),
});

// GET /api/reservations/[id] - Obter reserva por ID
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
      const [reservation] = await db
        .select()
        .from(reservations)
        .where(eq(reservations.id, id));

      if (!reservation) {
        return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
      }

      return NextResponse.json(reservation);
    });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json({ error: 'Erro ao buscar reserva' }, { status: 500 });
  }
}

// PUT /api/reservations/[id] - Atualizar reserva
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
    const validated = updateReservationSchema.parse(body);

    return withTenantContext(tenantId, userId, async () => {
      let updateData: any = { ...validated, updatedAt: new Date() };

      if (validated.status === 'cancelada') {
        updateData.cancelledAt = new Date();
        if (validated.cancelReason) {
          updateData.cancelReason = validated.cancelReason;
        }
      }

      const [updatedReservation] = await db
        .update(reservations)
        .set(updateData)
        .where(eq(reservations.id, id))
        .returning();

      if (!updatedReservation) {
        return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
      }

      return NextResponse.json(updatedReservation);
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error updating reservation:', error);
    return NextResponse.json({ error: 'Erro ao atualizar reserva' }, { status: 500 });
  }
}

// DELETE /api/reservations/[id] - Cancelar/excluir reserva
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
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 401 });
    }

    return withTenantContext(tenantId, userId, async () => {
      const [cancelledReservation] = await db
        .update(reservations)
        .set({
          status: 'cancelada',
          cancelledAt: new Date(),
          cancelReason: reason || 'Cancelada pelo usuário',
          updatedAt: new Date(),
        })
        .where(eq(reservations.id, id))
        .returning();

      if (!cancelledReservation) {
        return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
      }

      return NextResponse.json({ success: true, cancelled: cancelledReservation });
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return NextResponse.json({ error: 'Erro ao cancelar reserva' }, { status: 500 });
  }
}
