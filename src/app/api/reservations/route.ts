import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { reservations, spaces, members } from '@/lib/db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';
import { createReservationAtomic } from '@/lib/reservations/create-atomic';
import { z } from 'zod';

const createReservationSchema = z.object({
  tenantId: z.string().uuid(),
  spaceId: z.string().uuid(),
  memberId: z.string().uuid(),
  teamMemberId: z.string().uuid().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.enum(['daily', 'weekly']).optional(),
  recurringUntil: z.string().optional(),
  amount: z.number().optional(),
  isPaid: z.boolean().default(false),
});

// GET /api/reservations - Listar reservas
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
    const spaceId = searchParams.get('spaceId');
    const memberId = searchParams.get('memberId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    const sessionData = await getSessionWithTenant(request.headers);
    const sessionTenantId = sessionData?.user.tenantId;
    const resolvedTenantId = tenantId || sessionTenantId;

    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
    }

    const userId = sessionData?.user.id;

    return withTenantContext(resolvedTenantId, userId, async () => {
      const conditions: any[] = [eq(reservations.tenantId, resolvedTenantId)];

      if (spaceId) conditions.push(eq(reservations.spaceId, spaceId));
      if (memberId) conditions.push(eq(reservations.memberId, memberId));
      if (startDate) conditions.push(gte(reservations.date, startDate));
      if (endDate) conditions.push(lte(reservations.date, endDate));
      if (status) conditions.push(eq(reservations.status, status as 'pendente' | 'confirmada' | 'cancelada' | 'concluida'));

      const result = await db
        .select({
          id: reservations.id,
          spaceId: reservations.spaceId,
          spaceName: spaces.name,
          memberId: reservations.memberId,
          memberName: members.name,
          date: reservations.date,
          startTime: reservations.startTime,
          endTime: reservations.endTime,
          status: reservations.status,
          notes: reservations.notes,
          createdAt: reservations.createdAt,
        })
        .from(reservations)
        .leftJoin(spaces, eq(reservations.spaceId, spaces.id))
        .leftJoin(members, eq(reservations.memberId, members.id))
        .where(and(...conditions))
        .orderBy(reservations.date, reservations.startTime);

      return NextResponse.json({ data: result });
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'Erro ao buscar reservas' }, { status: 500 });
  }
}

// POST /api/reservations - Criar reserva com row-level locking
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
    const validated = createReservationSchema.parse(body);

    if (validated.tenantId !== tenantId) {
      return NextResponse.json({ error: 'tenantId mismatch' }, { status: 403 });
    }

    // Usa transação atômica com row-level locking
    const result = await createReservationAtomic({
      tenantId: validated.tenantId,
      spaceId: validated.spaceId,
      memberId: validated.memberId,
      teamMemberId: validated.teamMemberId,
      date: validated.date,
      startTime: validated.startTime,
      endTime: validated.endTime,
      notes: validated.notes,
      isRecurring: validated.isRecurring,
      recurringPattern: validated.recurringPattern,
      recurringUntil: validated.recurringUntil,
      amount: validated.amount,
      isPaid: validated.isPaid,
    });

    if (!result.success) {
      if (result.error === 'CONFLICT') {
        return NextResponse.json(
          { error: result.message, conflicts: result.conflicts, failedDate: result.failedDate, canJoinWaitlist: true },
          { status: 409 }
        );
      }
      if (result.error === 'SPACE_NOT_FOUND') {
        return NextResponse.json({ error: result.message }, { status: 404 });
      }
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json(
      { data: result.reservations, message: result.message },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error creating reservation:', error);
    return NextResponse.json({ error: 'Erro ao criar reserva' }, { status: 500 });
  }
}