import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const createPaymentSchema = z.object({
  tenantId: z.string().uuid(),
  memberId: z.string().uuid(),
  description: z.string().min(1).max(255),
  amount: z.number().min(0),
  dueDate: z.string(),
  paidDate: z.string().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
  paymentMethod: z.string().optional(),
  receivedBy: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// GET /api/payments - Listar pagamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const memberId = searchParams.get('memberId');
    const status = searchParams.get('status');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
    }

    const conditions: any[] = [eq(payments.tenantId, tenantId)];

    if (memberId) {
      conditions.push(eq(payments.memberId, memberId));
    }

    if (status) {
      conditions.push(eq(payments.status, status as 'pending' | 'paid' | 'overdue' | 'cancelled'));
    }

    const result = await db
      .select()
      .from(payments)
      .where(and(...conditions))
      .orderBy(desc(payments.dueDate));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 });
  }
}

// POST /api/payments - Criar pagamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createPaymentSchema.parse(body);

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 });
  }
}
