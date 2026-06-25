import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, members } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

const statusLabels: Record<string, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  overdue: 'Atrasado',
  cancelled: 'Cancelado',
};

const paymentMethodLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  transferencia: 'Transferência Bancária',
  boleto: 'Boleto',
};

/**
 * GET /api/reports/financial
 *
 * Relatório financeiro exportável em CSV
 *
 * Query params:
 * - tenantId (required)
 * - startDate (optional, formato: YYYY-MM-DD)
 * - endDate (optional, formato: YYYY-MM-DD)
 * - status (optional: pending, paid, overdue, cancelled)
 * - format (optional: json, csv - default: json)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const format = searchParams.get('format') || 'json';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId é obrigatório' },
        { status: 400 }
      );
    }

    const conditions: any[] = [eq(payments.tenantId, tenantId)];

    if (status) {
      conditions.push(eq(payments.status, status as 'pending' | 'paid' | 'overdue' | 'cancelled'));
    }

    if (startDate) {
      conditions.push(gte(payments.dueDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(payments.dueDate, endDate));
    }

    // Buscar pagamentos
    const result = await db
      .select({
        id: payments.id,
        memberId: payments.memberId,
        memberName: members.name,
        memberCpf: members.cpf,
        description: payments.description,
        amount: payments.amount,
        dueDate: payments.dueDate,
        paidDate: payments.paidDate,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        notes: payments.notes,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .leftJoin(members, eq(payments.memberId, members.id))
      .where(and(...conditions))
      .orderBy(desc(payments.dueDate));

    // Calcular estatísticas
    const stats = {
      totalAmount: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      totalCancelled: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
      cancelledCount: 0,
      defaultersCount: 0,
    };

    const defaultersSet = new Set<string>();

    for (const payment of result) {
      const amount = parseFloat(payment.amount as string);

      switch (payment.status) {
        case 'paid':
          stats.totalPaid += amount;
          stats.paidCount++;
          break;
        case 'pending':
          stats.totalPending += amount;
          stats.pendingCount++;
          break;
        case 'overdue':
          stats.totalOverdue += amount;
          stats.overdueCount++;
          defaultersSet.add(payment.memberId);
          break;
        case 'cancelled':
          stats.totalCancelled += amount;
          stats.cancelledCount++;
          break;
      }
    }

    stats.totalAmount = stats.totalPaid + stats.totalPending + stats.totalOverdue;
    stats.defaultersCount = defaultersSet.size;

    // Se formato é CSV, gerar e retornar
    if (format === 'csv') {
      const headers = [
        'ID',
        'Associado',
        'CPF',
        'Descrição',
        'Valor',
        'Data Vencimento',
        'Data Pagamento',
        'Status',
        'Forma Pagamento',
        'Observações',
        'Data Criação',
      ];

      const rows = result.map((payment) => [
        payment.id,
        payment.memberName || '',
        payment.memberCpf || '',
        payment.description,
        parseFloat(payment.amount as string).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        new Date(payment.dueDate as string).toLocaleDateString('pt-BR'),
        payment.paidDate ? new Date(payment.paidDate as string).toLocaleDateString('pt-BR') : '',
        statusLabels[payment.status] || payment.status,
        paymentMethodLabels[payment.paymentMethod || ''] || payment.paymentMethod || '',
        payment.notes || '',
        new Date(payment.createdAt).toLocaleDateString('pt-BR'),
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Retornar JSON
    return NextResponse.json({
      data: result,
      stats,
      filters: {
        tenantId,
        startDate,
        endDate,
        status,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating financial report:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório financeiro' },
      { status: 500 }
    );
  }
}
