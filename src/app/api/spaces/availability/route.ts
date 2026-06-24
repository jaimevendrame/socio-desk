import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { reservations, spaces, members } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/permissions';
import { calculateAvailableSlots, timeToMinutes } from '@/lib/reservations/conflicts';

const availabilitySchema = z.object({
  spaceId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * GET /api/spaces/availability
 * Retorna disponibilidade de horários para um espaço e data
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação opcional para MVP
    // const session = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const spaceId = searchParams.get('spaceId');
    const date = searchParams.get('date');

    if (!tenantId || !date) {
      return NextResponse.json(
        { error: 'tenantId e date são obrigatórios' },
        { status: 400 }
      );
    }

    // Busca espaços (ou espaço específico)
    let spacesQuery = db
      .select()
      .from(spaces)
      .where(and(
        eq(spaces.tenantId, tenantId),
        eq(spaces.isActive, true)
      ));

    if (spaceId) {
      spacesQuery = spacesQuery.where(eq(spaces.id, spaceId)) as any;
    }

    const spacesResult = await spacesQuery;

    if (spacesResult.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum espaço encontrado' },
        { status: 404 }
      );
    }

    // Busca reservas confirmadas para a data
    const reservationsResult = await db
      .select({
        id: reservations.id,
        spaceId: reservations.spaceId,
        memberId: reservations.memberId,
        startTime: reservations.startTime,
        endTime: reservations.endTime,
        status: reservations.status,
        memberName: members.name,
      })
      .from(reservations)
      .leftJoin(members, eq(reservations.memberId, members.id))
      .where(
        and(
          eq(reservations.tenantId, tenantId),
          eq(reservations.date, date),
          eq(reservations.status, 'confirmada')
        )
      );

    // Monta resultado por espaço
    const availability = spacesResult.map((space) => {
      const spaceReservations = reservationsResult.filter(
        (r) => r.spaceId === space.id
      );

      const availableSlots = calculateAvailableSlots(
        date,
        spaceReservations.map((r) => ({
          startTime: r.startTime,
          endTime: r.endTime,
        })),
        space.bufferMinutes || 15
      );

      return {
        id: space.id,
        name: space.name,
        category: space.category,
        openTime: space.openTime,
        closeTime: space.closeTime,
        bufferMinutes: space.bufferMinutes,
        slots: availableSlots.map((slot) => {
          const reservation = spaceReservations.find((r) => {
            const resStart = timeToMinutes(r.startTime);
            const resEnd = timeToMinutes(r.endTime);
            const slotStart = timeToMinutes(slot.start);
            const slotEnd = timeToMinutes(slot.end);
            return slotStart >= resStart && slotEnd <= resEnd;
          });

          return {
            ...slot,
            available: !reservation,
            reservation: reservation
              ? {
                  id: reservation.id,
                  memberId: reservation.memberId,
                  memberName: reservation.memberName || 'Membro',
                  status: reservation.status,
                }
              : undefined,
          };
        }),
      };
    });

    return NextResponse.json({ data: availability });
  } catch (error) {
    console.error('[API] availability error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar disponibilidade' },
      { status: 500 }
    );
  }
}
