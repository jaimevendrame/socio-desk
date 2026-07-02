import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, members } from '@/lib/db/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { createPaymentSchema } from '@/lib/payments/schema';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

const listPaymentsSchema = z.object({
  tenantId: z.string().uuid(),
  memberId: z.string().uuid().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// GET /api/payments - Listar pagamentos com estatísticas
export async function GET(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 'api');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)) } }
      );
    }
    const sessionData = await getSessionWithTenant(request.headers);
    const sessionTenantId = sessionData?.user.tenantId;

    // Security: Use ONLY tenantId from session, never from query/body
    const resolvedTenantId = sessionTenantId;

    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const userId = sessionData?.user.id;

    return withTenantContext(resolvedTenantId, userId, async () => {
      const conditions: any[] = [eq(payments.tenantId, resolvedTenantId)];

      if (memberId) {
        conditions.push(eq(payments.memberId, memberId));
      }

      if (status) {
        conditions.push(eq(payments.status, status as 'pending' | 'paid' | 'overdue' | 'cancelled'));
      }

      if (startDate) {
        conditions.push(gte(payments.dueDate, startDate));
      }

      if (endDate) {
        conditions.push(lte(payments.dueDate, endDate));
      }

      const result = await db
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
        .where(and(...conditions))
        .orderBy(desc(payments.dueDate))
        .limit(limit)
        .offset((page - 1) * limit);

      const statsResult = await db
        .select({
          totalPaid: sql<string>`COALESCE(SUM(CASE WHEN ${payments.status} = 'paid' THEN ${payments.amount}::decimal ELSE 0 END), 0)`,
          totalPending: sql<string>`COALESCE(SUM(CASE WHEN ${payments.status} = 'pending' THEN ${payments.amount}::decimal ELSE 0 END), 0)`,
          totalOverdue: sql<string>`COALESCE(SUM(CASE WHEN ${payments.status} = 'overdue' THEN ${payments.amount}::decimal ELSE 0 END), 0)`,
          totalAmount: sql<string>`COALESCE(SUM(${payments.amount}::decimal), 0)`,
          paidCount: sql<string>`COUNT(CASE WHEN ${payments.status} = 'paid' THEN 1 END)`,
          pendingCount: sql<string>`COUNT(CASE WHEN ${payments.status} = 'pending' THEN 1 END)`,
          overdueCount: sql<string>`COUNT(CASE WHEN ${payments.status} = 'overdue' THEN 1 END)`,
          cancelledCount: sql<string>`COUNT(CASE WHEN ${payments.status} = 'cancelled' THEN 1 END)`,
          totalCount: sql<string>`COUNT(*)`,
        })
        .from(payments)
        .where(and(...conditions));

      const stats = statsResult[0];

      const defaultersResult = await db
        .select({
          count: sql<string>`COUNT(DISTINCT ${payments.memberId})`,
        })
        .from(payments)
        .where(and(eq(payments.tenantId, resolvedTenantId), sql`${payments.status} IN ('overdue', 'pending')`));

      return NextResponse.json({
        data: result,
        stats: {
          totalReceived: parseFloat(stats.totalPaid as string) || 0,
          totalPending: parseFloat(stats.totalPending as string) || 0,
          totalOverdue: parseFloat(stats.totalOverdue as string) || 0,
          totalAmount: parseFloat(stats.totalAmount as string) || 0,
          counts: {
            paid: parseInt(stats.paidCount as string) || 0,
            pending: parseInt(stats.pendingCount as string) || 0,
            overdue: parseInt(stats.overdueCount as string) || 0,
            cancelled: parseInt(stats.cancelledCount as string) || 0,
            total: parseInt(stats.totalCount as string) || 0,
          },
          paymentRate: parseInt(stats.totalCount as string) > 0
            ? (parseInt(stats.paidCount as string) / parseInt(stats.totalCount as string)) * 100
            : 0,
          defaultersCount: parseInt(defaultersResult[0]?.count as string) || 0,
        },
        pagination: {
          page,
          limit,
          total: parseInt(stats.totalCount as string) || 0,
          totalPages: Math.ceil(parseInt(stats.totalCount as string) || 0 / limit),
        },
      });
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 });
  }
}

// POST /api/payments - Criar pagamento
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
    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 400 });
    }

    const body = await request.json();
    const validated = createPaymentSchema.parse(body);

    // Security: Always use tenantId from session, ignore any in body
    return withTenantContext(tenantId, userId, async () => {
      const [newPayment] = await db
        .insert(payments)
        .values({
          tenantId: validated.tenantId,
          memberId: validated.memberId,
          description: validated.description,
          amount: validated.amount.toString(),
          dueDate: validated.dueDate,
          paidDate: validated.paidDate,
          status: validated.status,
          paymentMethod: validated.paymentMethod,
          receivedBy: validated.receivedBy,
          notes: validated.notes,
          receivedAt: validated.status === 'paid' ? new Date() : undefined,
        })
        .returning();

      return NextResponse.json(newPayment, { status: 201 });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 });
  }
}
