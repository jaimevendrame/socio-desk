import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { reservations, members } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { checkConflict } from '@/lib/reservations/conflicts';
import { requireAuth, type SessionUser } from '@/lib/auth/permissions';

// Demo tenant ID - TODO: get from session when auth is ready
const DEMO_TENANT_ID = '1bdd8429-6dce-42ea-bf5b-6dc39a7a5490';

const conflictCheckSchema = z.object({
  spaceId: z.string().uuid('ID do espaço inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
  excludeReservationId: z.string().uuid().optional(),
});

/**
 * POST /api/reservations/check-conflict
 * Verifica se há conflitos de horário para uma reserva
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const session = await requireAuth(request);

    // Parse do body
    const body = await request.json();
    const data = conflictCheckSchema.parse(body);

    // Obter tenantId do session ou usar demo
    const user = session.user as SessionUser;
    const tenantId = user.tenantId || DEMO_TENANT_ID;

    // Verifica conflitos
    const conflictResult = await checkConflict({
      spaceId: data.spaceId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      tenantId,
      excludeReservationId: data.excludeReservationId,
    });

    // Se há conflitos, buscar nome dos membros
    if (conflictResult.hasConflict && conflictResult.conflictingReservations.length > 0) {
      const memberIds = conflictResult.conflictingReservations.map((r) => r.memberId);

      const membersResult = await db
        .select({ id: members.id, name: members.name })
        .from(members)
        .where(eq(members.tenantId, tenantId));

      const memberMap = new Map(membersResult.map((m) => [m.id, m.name]));

      conflictResult.conflictingReservations = conflictResult.conflictingReservations.map((r) => ({
        ...r,
        memberName: memberMap.get(r.memberId) || 'Membro não encontrado',
      }));
    }

    return NextResponse.json(conflictResult);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.format() },
        { status: 400 }
      );
    }

    console.error('[API] check-conflict error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
