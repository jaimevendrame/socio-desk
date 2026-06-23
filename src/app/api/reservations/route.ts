import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations, spaces } from '@/lib/db/schema';
import { eq, and, gte, lte, or } from 'drizzle-orm';
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
  recurringPattern: z.string().optional(),
  recurringUntil: z.string().optional(),
  amount: z.number().optional(),
  isPaid: z.boolean().default(false),
});

// GET /api/reservations - Listar reservas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const spaceId = searchParams.get('spaceId');
    const memberId = searchParams.get('memberId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
    }

    const conditions: any[] = [eq(reservations.tenantId, tenantId)];

    if (spaceId) {
      conditions.push(eq(reservations.spaceId, spaceId));
    }

    if (memberId) {
      conditions.push(eq(reservations.memberId, memberId));
    }

    if (startDate) {
      conditions.push(gte(reservations.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(reservations.date, endDate));
    }

    if (status) {
      conditions.push(eq(reservations.status, status as 'pendente' | 'confirmada' | 'cancelada' | 'concluida'));
    }

    const result = await db
      .select()
      .from(reservations)
      .where(and(...conditions))
      .orderBy(reservations.date, reservations.startTime);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'Erro ao buscar reservas' }, { status: 500 });
  }
}

// POST /api/reservations - Criar reserva
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createReservationSchema.parse(body);

    // Verificar conflito de horários
    const conflicts = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.spaceId, validated.spaceId),
          eq(reservations.date, validated.date),
          eq(reservations.status, 'confirmada'),
          // Conflito: startTime < novo endTime AND endTime > novo startTime
          or(
            and(lte(reservations.startTime, validated.startTime), gte(reservations.endTime, validated.startTime)),
            and(lte(reservations.startTime, validated.endTime), gte(reservations.endTime, validated.endTime)),
            and(gte(reservations.startTime, validated.startTime), lte(reservations.endTime, validated.endTime))
          )
        )
      );

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Conflito de horario', conflicts },
        { status: 409 }
      );
    }

    // Buscar custo do espaço se não informado
    let amount = validated.amount;
    if (!amount) {
      const [space] = await db
        .select()
        .from(spaces)
        .where(eq(spaces.id, validated.spaceId));

      if (space?.hasCost && space?.costAmount) {
        amount = parseFloat(space.costAmount.toString());
      }
    }

    const [newReservation] = await db
      .insert(reservations)
      .values({
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
        amount: amount?.toString(),
        isPaid: validated.isPaid,
        status: 'confirmada',
      })
      .returning();

    return NextResponse.json(newReservation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error creating reservation:', error);
    return NextResponse.json({ error: 'Erro ao criar reserva' }, { status: 500 });
  }
}
