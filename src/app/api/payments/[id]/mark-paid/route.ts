import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, members, tenantSettings } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { markPaidSchema } from '@/lib/payments/schema';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const markPaidBodySchema = z.object({
  paymentMethod: z.enum(['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto']),
  notes: z.string().optional(),
  receivedBy: z.string().uuid().optional(),
});

// POST /api/payments/[id]/mark-paid - Registrar baixa de pagamento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = checkRateLimit(request, 'write');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)) } }
      );
    }
    const { id } = paramsSchema.parse(await params);
    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 401 });
    }

    const body = await request.json();
    const validated = markPaidBodySchema.parse(body);

    return withTenantContext(tenantId, userId, async () => {
      const [payment] = await db.select().from(payments).where(eq(payments.id, id));

      if (!payment) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
      if (payment.status === 'paid') return NextResponse.json({ error: 'Pagamento já está quitado' }, { status: 400 });
      if (payment.status === 'cancelled') return NextResponse.json({ error: 'Pagamento cancelado não pode ser baixado' }, { status: 400 });

      const [updatedPayment] = await db
        .update(payments)
        .set({ status: 'paid', paidDate: new Date().toISOString().split('T')[0], paymentMethod: validated.paymentMethod, receivedBy: validated.receivedBy, receivedAt: new Date(), notes: validated.notes || payment.notes, updatedAt: new Date() })
        .where(eq(payments.id, id))
        .returning();

      const remainingDebts = await db.select({ count: sql<number>`COUNT(*)`, total: sql<string>`COALESCE(SUM(${payments.amount}::decimal), 0)` }).from(payments).where(and(eq(payments.memberId, payment.memberId), eq(payments.tenantId, payment.tenantId), sql`${payments.status} IN ('pending', 'overdue')`));

      const hasRemainingDebts = Number(remainingDebts[0].count) > 0;

      if (!hasRemainingDebts) {
        const [member] = await db.select().from(members).where(eq(members.id, payment.memberId));
        if (member && member.blockedAt) {
          await db.update(members).set({ status: 'ativo', blockedAt: null, blockReason: null, updatedAt: new Date() }).where(eq(members.id, payment.memberId));
        }
      }

      return NextResponse.json({ payment: updatedPayment, memberStatusUpdated: !hasRemainingDebts });
    });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.format() }, { status: 400 });
    console.error('Error marking payment as paid:', error);
    return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 });
  }
}
