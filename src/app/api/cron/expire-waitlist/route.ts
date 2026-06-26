import { NextRequest, NextResponse } from 'next/server';
import { createPool } from '@/lib/db/client';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * POST /api/cron/expire-waitlist
 *
 * Processa waitlist expiradas:
 * 1. Entradas 'notified' com expires_at < NOW() → expira e notifica próximo
 * 2. Marca como 'expired' e avança para o próximo da fila
 *
 * Deve rodar a cada 1-5 minutos via scheduler
 *
 * Headers necessários:
 * - Authorization: Bearer {CRON_SECRET}
 */
export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 'cron');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = createPool();
    const client = await pool.connect();

    try {
      // Busca entradas expiradas (notificadas mas não confirmadas a tempo)
      const expiredResult = await client.query(
        `SELECT w.id, w.space_id, w.member_id, w.date, w.start_time, w.end_time,
                w.position, m.name as member_name, m.email as member_email, s.name as space_name
         FROM reservation_waitlist w
         JOIN members m ON m.id = w.member_id
         JOIN spaces s ON s.id = w.space_id
         WHERE w.status = 'notified'
           AND w.expires_at < NOW()
         ORDER BY w.space_id, w.date, w.start_time, w.end_time, w.position
         FOR UPDATE OF w`
      );

      const results = {
        processed: 0,
        expired: 0,
        promoted: 0,
        errors: [] as string[],
      };

      // Agrupa por slot (space + date + time) para processar em ordem
      const slots = new Map<string, typeof expiredResult.rows>();

      for (const row of expiredResult.rows) {
        const key = `${row.space_id}|${row.date}|${row.start_time}|${row.end_time}`;
        if (!slots.has(key)) slots.set(key, []);
        slots.get(key)!.push(row);
      }

      for (const [slotKey, entries] of slots) {
        results.processed++;

        // Marca todos do slot como expired
        const ids = entries.map(e => e.id);
        await client.query(
          `UPDATE reservation_waitlist SET status = 'expired' WHERE id = ANY($1)`,
          [ids]
        );
        results.expired += ids.length;

        // Identifica o próximo da fila para este slot (status = waiting)
        const [spaceId, date, startTime, endTime] = slotKey.split('|');

        const nextResult = await client.query(
          `SELECT w.id, w.member_id, w.position, m.name as member_name, m.email as member_email
           FROM reservation_waitlist w
           JOIN members m ON m.id = w.member_id
           WHERE w.space_id = $1 AND w.date = $2
             AND w.start_time = $3 AND w.end_time = $4
             AND w.status = 'waiting'
           ORDER BY w.position ASC
           LIMIT 1
           FOR UPDATE OF w`,
          [spaceId, date, startTime, endTime]
        );

        if (nextResult.rows.length > 0) {
          const next = nextResult.rows[0];
          await client.query(
            `UPDATE reservation_waitlist
             SET status = 'notified', notified_at = NOW(), expires_at = NOW() + INTERVAL '30 minutes'
             WHERE id = $1`,
            [next.id]
          );

          // Envia notificação para o próximo
          try {
            const { sendWaitlistNotification } = await import('@/lib/email/reservations');
            await sendWaitlistNotification({
              memberEmail: next.member_email,
              memberName: next.member_name,
              spaceName: entries[0].space_name,
              date,
              startTime,
              endTime,
              expiresInMinutes: 30,
            });
          } catch (emailErr) {
            results.errors.push(`Falha ao enviar e-mail para ${next.member_email}: ${emailErr instanceof Error ? emailErr.message : String(emailErr)}`);
          }

          results.promoted++;
        }
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        executedAt: new Date().toISOString(),
        ...results,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[cron] expire-waitlist error:', err);
    return NextResponse.json(
      { error: 'Erro interno ao processar expiração da waitlist' },
      { status: 500 }
    );
  }
}