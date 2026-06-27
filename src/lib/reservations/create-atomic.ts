/**
 * Criação Atômica de Reservas com Row-Level Locking
 *
 * Previne double-booking em cenários de race condition usando:
 * 1. SELECT ... FOR UPDATE para travar linhas potencialmente conflitantes
 * 2. Re-checagem de conflito dentro da transação (já com lock)
 * 3. INSERT atômico ou ROLLBACK em caso de conflito
 *
 * Baseado na spec: socio-desk-spec-complementar.md §2.5-2.6
 */

import { pool } from '@/lib/db/client';
import { reservationWaitlist } from '@/lib/db/schema';
import { generateRecurringDates } from './recurring';
import { auditLog } from '@/lib/logging';
import { sendWaitlistNotification } from '@/lib/email/reservations';

export interface CreateReservationInput {
  tenantId: string;
  spaceId: string;
  memberId: string;
  teamMemberId?: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly';
  recurringUntil?: string;
  amount?: number;
  isPaid?: boolean;
}

export interface CreateReservationResult {
  success: boolean;
  reservations?: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
  error?: 'CONFLICT' | 'SPACE_NOT_FOUND' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR';
  conflicts?: Array<{
    id: string;
    memberName: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
  failedDate?: string;
  message: string;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Executa criação de reserva com row-level locking
 *
 * Fluxo:
 * BEGIN
 *   → SELECT ... FOR UPDATE (trava conflitos)
 *   → Re-checa conflito (com lock ativo)
 *   → INSERT ou ROLLBACK
 * COMMIT
 */
export async function createReservationAtomic(
  input: CreateReservationInput
): Promise<CreateReservationResult> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Buscar espaço para obter buffer_minutes
    const spaceResult = await client.query(
      `SELECT id, buffer_minutes, has_cost, cost_amount
       FROM spaces WHERE id = $1 AND tenant_id = $2`,
      [input.spaceId, input.tenantId]
    );

    if (spaceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'SPACE_NOT_FOUND', message: 'Espaço não encontrado' };
    }

    const space = spaceResult.rows[0];
    const bufferMinutes = space.buffer_minutes ?? 15;

    // 2. Lock nas reservas que poderiam conflitar
    // Trava todas as reservas do mesmo espaço/data que sobrepõem o intervalo desejado
    const newStartMin = timeToMinutes(input.startTime);
    const newEndMin = timeToMinutes(input.endTime);

    const lockedRows = await client.query(
      `SELECT r.id, r.start_time, r.end_time, r.member_id, m.name as member_name
       FROM reservations r
       LEFT JOIN members m ON m.id = r.member_id
       WHERE r.space_id = $1
         AND r.date = $2
         AND r.status = 'confirmada'
         AND r.start_time::interval < ($3 || ' minutes')::interval
         AND r.end_time::interval + ($4 || ' minutes')::interval > ($5 || ' minutes')::interval
       FOR UPDATE OF r`,
      [
        input.spaceId,
        input.date,
        newEndMin,       // $3: novo fim
        bufferMinutes,   // $4: buffer
        newStartMin,     // $5: novo início
      ]
    );

    // 3. Re-checar conflito com lock ativo (precisamos fazer em JS pois o lock já ocorreu)
    // Se há linhas locked, verificamos sobreposição real
    const conflicts = lockedRows.rows.filter((row) => {
      const rowStart = timeToMinutes(row.start_time);
      const rowEnd = timeToMinutes(row.end_time);

      // Verifica sobreposição com buffer
      const effectiveEnd = rowEnd + bufferMinutes;
      const effectiveStart = rowStart - bufferMinutes;

      return newStartMin < effectiveEnd && effectiveEnd > rowStart;
    });

    if (conflicts.length > 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'CONFLICT',
        conflicts: conflicts.map((c) => ({
          id: c.id,
          memberName: c.member_name || 'Membro não encontrado',
          date: input.date,
          startTime: c.start_time,
          endTime: c.end_time,
        })),
        message: 'Conflito de horário detectado',
      };
    }

    // 4. Determinar valor da reserva
    let amount: string | undefined;
    if (input.amount !== undefined) {
      amount = input.amount.toString();
    } else if (space.has_cost && space.cost_amount) {
      amount = parseFloat(space.cost_amount).toFixed(2);
    }

    // 5. Gerar datas para reserva recorrente
    const dates = input.isRecurring && input.recurringPattern && input.recurringUntil
      ? generateRecurringDates(input.date, input.recurringPattern, input.recurringUntil)
      : [input.date];

    // 6. Verificar conflitos para cada data (para recorrentes)
    for (const reservationDate of dates) {
      if (reservationDate === input.date) continue; // já verificamos a primeira

      const recurringLocked = await client.query(
        `SELECT r.id, r.start_time, r.end_time, r.member_id, m.name as member_name
         FROM reservations r
         LEFT JOIN members m ON m.id = r.member_id
         WHERE r.space_id = $1
           AND r.date = $2
           AND r.status = 'confirmada'
           AND r.start_time::interval < ($3 || ' minutes')::interval
           AND r.end_time::interval + ($4 || ' minutes')::interval > ($5 || ' minutes')::interval
         FOR UPDATE OF r`,
        [
          input.spaceId,
          reservationDate,
          newEndMin,
          bufferMinutes,
          newStartMin,
        ]
      );

      const recurringConflicts = recurringLocked.rows.filter((row) => {
        const rowStart = timeToMinutes(row.start_time);
        const rowEnd = timeToMinutes(row.end_time);
        const effectiveEnd = rowEnd + bufferMinutes;
        return newStartMin < effectiveEnd && effectiveEnd > rowStart;
      });

      if (recurringConflicts.length > 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'CONFLICT',
          conflicts: recurringConflicts.map((c) => ({
            id: c.id,
            memberName: c.member_name || 'Membro não encontrado',
            date: reservationDate,
            startTime: c.start_time,
            endTime: c.end_time,
          })),
          failedDate: reservationDate,
          message: `Conflito de horário detectado na data ${reservationDate}`,
        };
      }
    }

    // 7. Inserir reservas
    const createdReservations: CreateReservationResult['reservations'] = [];

    for (const reservationDate of dates) {
      const result = await client.query(
        `INSERT INTO reservations
           (tenant_id, space_id, member_id, team_member_id, date,
            start_time, end_time, notes, is_recurring, recurring_pattern,
            recurring_until, amount, is_paid, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'confirmada')
         RETURNING id, date, start_time, end_time`,
        [
          input.tenantId,
          input.spaceId,
          input.memberId,
          input.teamMemberId || null,
          reservationDate,
          input.startTime,
          input.endTime,
          input.notes || null,
          input.isRecurring || false,
          input.recurringPattern || null,
          input.recurringUntil || null,
          amount || null,
          input.isPaid || false,
        ]
      );

      const row = result.rows[0];
      createdReservations.push({
        id: row.id,
        date: row.date,
        startTime: row.start_time,
        endTime: row.end_time,
      });

      await auditLog({
        action: 'CREATE',
        entity: 'reservation',
        entityId: row.id,
        userId: input.teamMemberId,
        tenantId: input.tenantId,
        changes: {
          spaceId: input.spaceId,
          memberId: input.memberId,
          date: reservationDate,
          startTime: input.startTime,
          endTime: input.endTime,
        },
      });
    }

    await client.query('COMMIT');

    return {
      success: true,
      reservations: createdReservations,
      message: input.isRecurring
        ? `${createdReservations.length} reservas criadas com sucesso`
        : 'Reserva criada com sucesso',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[createReservationAtomic] Error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro interno ao criar reserva',
    };
  } finally {
    client.release();
  }
}

/**
 * Verifica se há entradas na waitlist para um espaço/data/horário
 * e notifica o primeiro da fila
 */
export async function notifyWaitlistOnCancel(params: {
  tenantId: string;
  spaceId: string;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<{ notified: boolean; waitlistEntry?: { id: string; memberId: string; position: number } }> {
  const client = await pool.connect();

  try {
    // Busca primeira entrada da waitlist para este slot
    const waitlistResult = await client.query(
      `SELECT w.id, w.member_id, w.position, m.name as member_name, m.email as member_email
       FROM reservation_waitlist w
       JOIN members m ON m.id = w.member_id
       WHERE w.space_id = $1
         AND w.date = $2
         AND w.status = 'waiting'
         AND w.start_time = $3
         AND w.end_time = $4
         AND w.tenant_id = $5
       ORDER BY w.position ASC
       LIMIT 1
       FOR UPDATE OF w`,
      [params.spaceId, params.date, params.startTime, params.endTime, params.tenantId]
    );

    if (waitlistResult.rows.length === 0) {
      return { notified: false };
    }

    const entry = waitlistResult.rows[0];

    // Atualiza status para notified e define expiração (30 min)
    await client.query(
      `UPDATE reservation_waitlist
       SET status = 'notified', notified_at = NOW(), expires_at = NOW() + INTERVAL '30 minutes'
       WHERE id = $1`,
      [entry.id]
    );

    // Busca nome do espaço para o e-mail
    const spaceResult = await client.query(
      `SELECT name FROM spaces WHERE id = $1`,
      [params.spaceId]
    );
    const spaceName = spaceResult.rows[0]?.name || 'Espaço';

    // Envia notificação via Brevo
    await sendWaitlistNotification({
      memberEmail: entry.member_email,
      memberName: entry.member_name,
      spaceName,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      expiresInMinutes: 30,
    });

    console.log(
      `[waitlist] Notificando membro ${entry.member_name} (${entry.member_email}): ` +
      `vaga disponível em ${spaceName} em ${params.date} ${params.startTime}-${params.endTime}`
    );

    return {
      notified: true,
      waitlistEntry: {
        id: entry.id,
        memberId: entry.member_id,
        position: entry.position,
      },
    };
  } finally {
    client.release();
  }
}