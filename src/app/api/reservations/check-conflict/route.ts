import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { reservations, members } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { checkConflict } from '@/lib/reservations/conflicts';
import { requireAuth, type SessionUser } from '@/lib/auth/permissions';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';

const conflictCheckSchema = z.object({
  spaceId: z.string().uuid('ID do espaço inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
  excludeReservationId: z.string().uuid().optional(),
});

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
    const session = await requireAuth(request);
    const user = session.user as SessionUser;
    const tenantId = user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 401 });
    }

    const body = await request.json();
    const data = conflictCheckSchema.parse(body);

    return withTenantContext(tenantId, user.id, async () => {
      const conflictResult = await checkConflict({
        spaceId: data.spaceId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        tenantId,
        excludeReservationId: data.excludeReservationId,
      });

      if (conflictResult.hasConflict && conflictResult.conflictingReservations.length > 0) {
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
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.format() }, { status: 400 });
    }
    console.error('[API] check-conflict error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
