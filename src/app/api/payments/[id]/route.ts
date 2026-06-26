import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, members } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { updatePaymentSchema } from '@/lib/payments/schema';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const updateBodySchema = z.object({
  description: z.string().min(1).max(255).optional(),
  amount: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  paidDate: z.string().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/payments/[id] - Buscar pagamento específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = checkRateLimit(request, 'api');
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

    return withTenantContext(tenantId, userId, async () => {
      const [payment] = await db
        .select({
          id: payments.id,
          tenantId: payments.tenantId,
          memberId: payments.memberId,
          memberName: members.name,
          memberEmail: members.email,
          description: payments.description,
          amount: payments.amount,
          dueDate: payments.dueDate,
          paidDate: payments.paidDate,
          status: payments.status,
          paymentMethod: payments.paymentMethod,
          receivedBy: payments.receivedBy,
          receivedAt: payments.receivedAt,
          notes: payments.notes,
          createdAt: payments.createdAt,
          updatedAt: payments.updatedAt,
        })
        .from(payments)
        .leftJoin(members, eq(payments.memberId, members.id))
        .where(eq(payments.id, id));

      if (!payment) {
        return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ payment });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Erro ao buscar pagamento' }, { status: 500 });
  }
}

// PATCH /api/payments/[id] - Atualizar pagamento
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = checkRateLimit(request, 'api');
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
    const validated = updateBodySchema.parse(body);

    if (validated.status === 'paid') {
      return NextResponse.json(
        { error: 'Use /api/payments/[id]/mark-paid para registrar pagamento' },
        { status: 400 }
      );
    }

    return withTenantContext(tenantId, userId, async () => {
      const [existing] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, id));

      if (!existing) {
        return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.amount !== undefined) updateData.amount = validated.amount.toString();
      if (validated.dueDate !== undefined) updateData.dueDate = validated.dueDate;
      if (validated.paidDate !== undefined) updateData.paidDate = validated.paidDate;
      if (validated.status !== undefined) updateData.status = validated.status;
      if (validated.paymentMethod !== undefined) updateData.paymentMethod = validated.paymentMethod;
      if (validated.notes !== undefined) updateData.notes = validated.notes;

      const [updated] = await db
        .update(payments)
        .set(updateData)
        .where(eq(payments.id, id))
        .returning();

      return NextResponse.json({ payment: updated });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 });
  }
}

// DELETE /api/payments/[id] - Cancelar pagamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = checkRateLimit(request, 'api');
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

    return withTenantContext(tenantId, userId, async () => {
      const [existing] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, id));

      if (!existing) {
        return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
      }

      if (existing.status === 'paid') {
        return NextResponse.json({ error: 'Não é possível cancelar um pagamento já quitado' }, { status: 400 });
      }

      const [cancelled] = await db
        .update(payments)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(payments.id, id))
        .returning();

      return NextResponse.json({ payment: cancelled });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error cancelling payment:', error);
    return NextResponse.json({ error: 'Erro ao cancelar pagamento' }, { status: 500 });
  }
}
