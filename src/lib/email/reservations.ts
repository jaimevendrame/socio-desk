import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReservationEmailParams {
  memberEmail: string;
  memberName: string;
  reservation: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  spaceName: string;
  isRecurring?: boolean;
  totalReservations?: number;
}

/**
 * Envia e-mail de confirmação de reserva via Brevo (Sendinblue)
 */
export async function sendReservationConfirmation(params: ReservationEmailParams): Promise<boolean> {
  const { memberEmail, memberName, reservation, spaceName, isRecurring, totalReservations } = params;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[EMAIL] Brevo API key not configured');
    return false;
  }

  const formattedDate = format(parseISO(reservation.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1976D2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #666; font-size: 14px; }
        .value { font-weight: bold; color: #333; }
        .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; }
        .status-confirmada { background: #E3F2FD; color: #1976D2; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .recurring-badge { background: #FFF3E0; color: #E65100; padding: 10px 20px; border-radius: 8px; margin-top: 15px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Reserva Confirmada</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${memberName}</strong>!</p>
          <p>Sua reserva foi confirmada com sucesso. Aqui estão os detalhes:</p>

          <div class="info-box">
            <div class="info-row">
              <span class="label">📅 Data</span>
              <span class="value">${formattedDate}</span>
            </div>
            <div class="info-row">
              <span class="label">🕐 Horário</span>
              <span class="value">${reservation.startTime} às ${reservation.endTime}</span>
            </div>
            <div class="info-row">
              <span class="label">📍 Espaço</span>
              <span class="value">${spaceName}</span>
            </div>
            <div class="info-row">
              <span class="label">📊 Status</span>
              <span class="status status-confirmada">Confirmada</span>
            </div>
          </div>

          ${isRecurring && totalReservations ? `
            <div class="recurring-badge">
              🔄 Esta é uma reserva recorrente (${totalReservations} reservas no total)
            </div>
          ` : ''}

          <p style="margin-top: 20px;">
            <strong>Lembretes:</strong>
            <ul>
              <li>Acesse o espaço 5 minutos antes do horário agendado</li>
              <li>Cancele com antecedência se não puder comparecer</li>
              <li>Respeite o horário de término para outros associados</li>
            </ul>
          </p>

          <p>Caso precise cancelar ou remarcar, acesse seu painel de reservas.</p>
        </div>
        <div class="footer">
          <p>Este é um e-mail automático do Socio Desk.</p>
          <p>Não responda esta mensagem.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: 'Socio Desk',
          email: process.env.EMAIL_FROM || 'noreply@sociodesk.com.br',
        },
        to: [{ email: memberEmail, name: memberName }],
        subject: `Reserva Confirmada - ${spaceName} (${formattedDate})`,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EMAIL] Failed to send:', error);
      return false;
    }

    console.log('[EMAIL] Confirmation sent to:', memberEmail);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    return false;
  }
}

/**
 * Envia e-mail de cancelamento de reserva
 */
export async function sendReservationCancellation(params: {
  memberEmail: string;
  memberName: string;
  spaceName: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}): Promise<boolean> {
  const { memberEmail, memberName, spaceName, date, startTime, endTime, reason } = params;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[EMAIL] Brevo API key not configured');
    return false;
  }

  const formattedDate = format(parseISO(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Reserva Cancelada</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${memberName}</strong>!</p>
          <p>Sua reserva foi cancelada:</p>

          <div class="info-box">
            <p><strong>Espaço:</strong> ${spaceName}</p>
            <p><strong>Data:</strong> ${formattedDate}</p>
            <p><strong>Horário:</strong> ${startTime} às ${endTime}</p>
            ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
          </div>

          <p>Caso não tenha solicitado o cancelamento, entre em contato conosco.</p>
        </div>
        <div class="footer">
          <p>Este é um e-mail automático do Socio Desk.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: 'Socio Desk',
          email: process.env.EMAIL_FROM || 'noreply@sociodesk.com.br',
        },
        to: [{ email: memberEmail, name: memberName }],
        subject: `Reserva Cancelada - ${spaceName}`,
        htmlContent,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[EMAIL] Error sending cancellation:', error);
    return false;
  }
}

/**
 * Envia e-mail通知 de fila de espera — vaga disponível
 */
export async function sendWaitlistNotification(params: {
  memberEmail: string;
  memberName: string;
  spaceName: string;
  date: string;
  startTime: string;
  endTime: string;
  expiresInMinutes?: number;
}): Promise<boolean> {
  const { memberEmail, memberName, spaceName, date, startTime, endTime, expiresInMinutes = 30 } = params;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[EMAIL] Brevo API key not configured');
    return false;
  }

  const formattedDate = format(parseISO(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; font-size: 14px; }
        .value { font-weight: bold; color: #333; }
        .urgent-box { background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .urgent-time { font-size: 36px; font-weight: bold; color: #D97706; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Vaga Disponível!</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${memberName}</strong>!</p>
          <p>Boas notícias! Uma vaga acabou de ser liberada no horário que você esperava.</p>

          <div class="info-box">
            <div class="info-row">
              <span class="label">📅 Data</span>
              <span class="value">${formattedDate}</span>
            </div>
            <div class="info-row">
              <span class="label">🕐 Horário</span>
              <span class="value">${startTime} às ${endTime}</span>
            </div>
            <div class="info-row">
              <span class="label">📍 Espaço</span>
              <span class="value">${spaceName}</span>
            </div>
          </div>

          <div class="urgent-box">
            <p style="font-size: 16px; color: #92400E; margin-bottom: 10px;">
              ⏰ Esta vaga expira em:
            </p>
            <div class="urgent-time">${expiresInMinutes} minutos</div>
            <p style="font-size: 14px; color: #92400E; margin-top: 10px;">
              Corra para confirmar sua reserva pelo portal!
            </p>
          </div>

          <p>Acesse seu painel de reservas para confirmar antes que expire.</p>
        </div>
        <div class="footer">
          <p>Este é um e-mail automático do Socio Desk.</p>
          <p>Você está recebendo esta mensagem porque entrou na fila de espera.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: 'Socio Desk',
          email: process.env.EMAIL_FROM || 'noreply@sociodesk.com.br',
        },
        to: [{ email: memberEmail, name: memberName }],
        subject: `🔔 Vaga disponível - ${spaceName} (${formattedDate})`,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EMAIL] Failed to send waitlist notification:', error);
      return false;
    }

    console.log('[EMAIL] Waitlist notification sent to:', memberEmail);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending waitlist notification:', error);
    return false;
  }
}

/**
 * Envia lembrete de reserva (24h antes)
 */
export async function sendReservationReminder(params: {
  memberEmail: string;
  memberName: string;
  spaceName: string;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<boolean> {
  const { memberEmail, memberName, spaceName, date, startTime, endTime } = params;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[EMAIL] Brevo API key not configured');
    return false;
  }

  const formattedDate = format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .reminder-box { background: #FEF3C7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .time-big { font-size: 48px; font-weight: bold; color: #D97706; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Lembrete de Reserva</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${memberName}</strong>!</p>
          <p>Sua reserva é <strong>amanhã</strong>:</p>

          <div class="reminder-box">
            <div>📍 <strong>${spaceName}</strong></div>
            <div>📅 ${formattedDate}</div>
            <div class="time-big">${startTime}</div>
          </div>

          <p>Não se esqueça de chegar com antecedência!</p>
        </div>
        <div class="footer">
          <p>Este é um e-mail automático do Socio Desk.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: 'Socio Desk',
          email: process.env.EMAIL_FROM || 'noreply@sociodesk.com.br',
        },
        to: [{ email: memberEmail, name: memberName }],
        subject: `Lembrete: Reserva amanhã - ${spaceName}`,
        htmlContent,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[EMAIL] Error sending reminder:', error);
    return false;
  }
}
