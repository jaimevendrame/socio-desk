/**
 * API de Waitlist de Reservas
 *
 * GET  /api/waitlist              - Lista entradas da waitlist (filtros: spaceId, date, memberId)
 * POST /api/waitlist              - Adiciona membro à fila de espera
 * GET  /api/waitlist/[id]         - Detalhe de uma entrada
 * DELETE /api/waitlist/[id]       - Remove membro da fila
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { reservationWaitlist, spaces, members } from '@/lib/db/schema';
import { and, eq, gte, lte, asc } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';
import { z } from 'zod';

const addToWaitlistSchema = z.object({
  spaceId: z.string().uuid(),
  memberId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
});

// GET /api/waitlist - Lista waitlist com filtros
export async function GET(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 'api');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionData = await getSessionWithTenant(request.headers);
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 401 });
    }

    const spaceId = searchParams.get('spaceId');
    const date = searchParams.get('date');
    const memberId = searchParams.get('memberId');

    return withTenantContext(tenantId, sessionData?.user.id, async () => {
      const conditions: any[] = [eq(reservationWaitlist.tenantId, tenantId)];

      if (spaceId) conditions.push(eq(reservationWaitlist.spaceId, spaceId));
      if (date) conditions.push(eq(reservationWaitlist.date, date));
      if (memberId) conditions.push(eq(reservationWaitlist.memberId, memberId));

      const entries = await db
        .select({
          id: reservationWaitlist.id,
          spaceId: reservationWaitlist.spaceId,
          spaceName: spaces.name,
          memberId: reservationWaitlist.memberId,
          memberName: members.name,
          memberEmail: members.email,
          date: reservationWaitlist.date,
          startTime: reservationWaitlist.startTime,
          endTime: reservationWaitlist.endTime,
          position: reservationWaitlist.position,
          status: reservationWaitlist.status,
          notifiedAt: reservationWaitlist.notifiedAt,
          expiresAt: reservationWaitlist.expiresAt,
          createdAt: reservationWaitlist.createdAt,
        })
        .from(reservationWaitlist)
        .leftJoin(spaces, eq(reservationWaitlist.spaceId, spaces.id))
        .leftJoin(members, eq(reservationWaitlist.memberId, members.id))
        .where(and(...conditions))
        .orderBy(asc(reservationWaitlist.position));

      return NextResponse.json({ data: entries });
    });
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json({ error: 'Erro ao buscar fila de espera' }, { status: 500 });
  }
}

// POST /api/waitlist - Adiciona à fila de espera
export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 'write');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const sessionData = await getSessionWithTenant(request.headers);
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 401 });
    }

    const body = await request.json();
    const validated = addToWaitlistSchema.parse(body);

    return withTenantContext(tenantId, sessionData?.user.id, async () => {
      // Verifica se já existe entrada ativa para este membro neste slot
      const existing = await db
        .select({ id: reservationWaitlist.id })
        .from(reservationWaitlist)
        .where(
          and(
            eq(reservationWaitlist.tenantId, tenantId),
            eq(reservationWaitlist.spaceId, validated.spaceId),
            eq(reservationWaitlist.memberId, validated.memberId),
            eq(reservationWaitlist.date, validated.date),
            eq(reservationWaitlist.startTime, validated.startTime),
            eq(reservationWaitlist.endTime, validated.endTime),
            eq(reservationWaitlist.status, 'waiting')
          )
        );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'Você já está na fila de espera para este horário' },
          { status: 409 }
        );
      }

      // Determina próxima posição
      const lastEntry = await db
        .select({ position: reservationWaitlist.position })
        .from(reservationWaitlist)
        .where(
          and(
            eq(reservationWaitlist.tenantId, tenantId),
            eq(reservationWaitlist.spaceId, validated.spaceId),
            eq(reservationWaitlist.date, validated.date),
            eq(reservationWaitlist.startTime, validated.startTime),
            eq(reservationWaitlist.endTime, validated.endTime)
          )
        )
        .orderBy(asc(reservationWaitlist.position))
        .limit(1);

      const nextPosition = lastEntry.length > 0 ? lastEntry[0].position + 1 : 1;

      const [entry] = await db
        .insert(reservationWaitlist)
        .values({
          tenantId,
          spaceId: validated.spaceId,
          memberId: validated.memberId,
          date: validated.date,
          startTime: validated.startTime,
          endTime: validated.endTime,
          position: nextPosition,
          status: 'waiting',
        })
        .returning();

      return NextResponse.json(
        {
          data: entry,
          message: `Você entrou na fila de espera na posição ${nextPosition}`,
        },
        { status: 201 }
      );
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error adding to waitlist:', error);
    return NextResponse.json({ error: 'Erro ao adicionar à fila de espera' }, { status: 500 });
  }
}