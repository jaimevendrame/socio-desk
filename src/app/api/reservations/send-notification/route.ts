import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { reservations, members, spaces } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth, type SessionUser } from '@/lib/auth/permissions';
import { sendReservationConfirmation, sendReservationCancellation, sendReservationReminder } from '@/lib/email/reservations';
import { auditLog } from '@/lib/logging';

// Demo tenant ID - TODO: get from session when auth is ready
const DEMO_TENANT_ID = '1bdd8429-6dce-42ea-bf5b-6dc39a7a5490';

const notificationSchema = z.object({
  reservationId: z.string().uuid('ID da reserva inválido'),
  type: z.enum(['confirmation', 'cancellation', 'reminder']),
  reason: z.string().optional(),
});

/**
 * POST /api/reservations/send-notification
 * Envia notificações por e-mail
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const user = session.user as SessionUser;
    const tenantId = user.tenantId || DEMO_TENANT_ID;

    const body = await request.json();
    const data = notificationSchema.parse(body);

    // Busca a reserva com joins
    const reservation = await db
      .select({
        id: reservations.id,
        spaceId: reservations.spaceId,
        memberId: reservations.memberId,
        date: reservations.date,
        startTime: reservations.startTime,
        endTime: reservations.endTime,
        status: reservations.status,
        notes: reservations.notes,
        member: {
          name: members.name,
          email: members.email,
        },
        space: {
          name: spaces.name,
        },
      })
      .from(reservations)
      .leftJoin(members, eq(reservations.memberId, members.id))
      .leftJoin(spaces, eq(reservations.spaceId, spaces.id))
      .where(
        and(
          eq(reservations.id, data.reservationId),
          eq(reservations.tenantId, tenantId)
        )
      );

    if (!reservation || reservation.length === 0) {
      return NextResponse.json(
        { error: 'Reserva não encontrada' },
        { status: 404 }
      );
    }

    const [resData] = reservation;

    if (!resData.member?.email) {
      return NextResponse.json(
        { error: 'Membro não tem e-mail cadastrado' },
        { status: 400 }
      );
    }

    const spaceName = resData.space?.name || 'Espaço';
    const memberEmail = resData.member.email;
    const memberName = resData.member.name;

    let sent = false;
    let message = '';

    switch (data.type) {
      case 'confirmation':
        sent = await sendReservationConfirmation({
          memberEmail,
          memberName,
          reservation: {
            id: resData.id,
            date: resData.date,
            startTime: resData.startTime,
            endTime: resData.endTime,
            status: resData.status,
          },
          spaceName,
        });
        message = 'E-mail de confirmação enviado';
        break;

      case 'cancellation':
        sent = await sendReservationCancellation({
          memberEmail,
          memberName,
          spaceName,
          date: resData.date,
          startTime: resData.startTime,
          endTime: resData.endTime,
          reason: data.reason,
        });
        message = 'E-mail de cancelamento enviado';
        break;

      case 'reminder':
        // Verifica se a reserva é amanhã
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const reservationDate = new Date(resData.date);

        if (reservationDate.toDateString() !== tomorrow.toDateString()) {
          return NextResponse.json(
            { error: 'Lembrete só pode ser enviado para reservas do dia seguinte' },
            { status: 400 }
          );
        }

        sent = await sendReservationReminder({
          memberEmail,
          memberName,
          spaceName,
          date: resData.date,
          startTime: resData.startTime,
          endTime: resData.endTime,
        });
        message = 'Lembrete enviado';
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de notificação inválido' },
          { status: 400 }
        );
    }

    // Audit log
    await auditLog({
      action: 'SEND_NOTIFICATION',
      entity: 'reservation',
      entityId: resData.id,
      userId: user.id,
      tenantId,
      changes: {
        type: data.type,
        sent: sent,
      },
    });

    if (!sent) {
      return NextResponse.json(
        {
          message,
          warning: 'Falha ao enviar e-mail (verifique configuração do Brevo)',
        },
        { status: 202 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.format() },
        { status: 400 }
      );
    }

    console.error('[API] send-notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
