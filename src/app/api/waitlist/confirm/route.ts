import { NextRequest, NextResponse } from 'next/server';
import { createPool } from '@/lib/db/client';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';
import { createReservationAtomic } from '@/lib/reservations/create-atomic';
import { z } from 'zod';

export const runtime = 'nodejs';

/**
 * POST /api/waitlist/confirm
 *
 * Membro confirma reserva a partir de uma entrada na waitlist.
 * Só funciona para entradas com status = 'notified' e que não expiraram.
 *
 * Fluxo:
 * 1. Valida que o membro logado é o dono da entrada
 * 2. Verifica se a entrada está em status 'notified' e não expirou
 * 3. Cria a reserva atômica (com row-level locking)
 * 4. Atualiza entrada da waitlist para 'confirmed' + link da reserva
 */
export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 'write');
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 });
    }

    const body = await request.json();
    const { waitlistId } = z.object({ waitlistId: z.string().uuid() }).parse(body);

    const pool = createPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Busca entrada da waitlist com lock
      const entryResult = await client.query(
        `SELECT w.id, w.space_id, w.member_id, w.date, w.start_time, w.end_time,
                w.status, w.expires_at, m.user_id
         FROM reservation_waitlist w
         JOIN members m ON m.id = w.member_id
         WHERE w.id = $1 AND w.tenant_id = $2
         FOR UPDATE OF w`,
        [waitlistId, tenantId]
      );

      if (entryResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Entrada não encontrada' }, { status: 404 });
      }

      const entry = entryResult.rows[0];

      // Valida que o membro logado é o dono
      if (entry.user_id !== userId) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
      }

      // Valida status
      if (entry.status !== 'notified') {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Esta entrada não está aguardando confirmação', status: entry.status },
          { status: 409 }
        );
      }

      // Valida que não expirou
      if (entry.expires_at && new Date(entry.expires_at) < new Date()) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Tempo de confirmação expirou' }, { status: 410 });
      }

      // Tenta criar a reserva atômica
      const reservationResult = await createReservationAtomic({
        tenantId,
        spaceId: entry.space_id,
        memberId: entry.member_id,
        date: entry.date,
        startTime: entry.start_time,
        endTime: entry.end_time,
      });

      if (!reservationResult.success) {
        await client.query('ROLLBACK');

        if (reservationResult.error === 'CONFLICT') {
          return NextResponse.json(
            { error: 'O horário não está mais disponível', conflicts: reservationResult.conflicts },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: 'Erro ao criar reserva' }, { status: 500 });
      }

      // Atualiza entrada da waitlist para confirmed
      const reservationId = reservationResult.reservations![0].id;
      await client.query(
        `UPDATE reservation_waitlist
         SET status = 'confirmed', linked_reservation_id = $1
         WHERE id = $2`,
        [reservationId, waitlistId]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Reserva confirmada!',
        reservation: reservationResult.reservations![0],
      }, { status: 201 });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.format() }, { status: 400 });
    }
    console.error('[waitlist/confirm] Error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}