import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, members } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  transferencia: 'Transferência',
  boleto: 'Boleto',
};

/**
 * GET /api/reports/financial/export-pdf
 *
 * Relatório financeiro exportável em PDF
 *
 * Query params:
 * - tenantId (required)
 * - startDate (optional)
 * - endDate (optional)
 * - status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 'api');
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    let tenantId = searchParams.get('tenantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    const sessionData = await getSessionWithTenant(request.headers);
    const sessionTenantId = sessionData?.user.tenantId;
    const resolvedTenantId = tenantId || sessionTenantId;

    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
    }

    const userId = sessionData?.user.id;

    return withTenantContext(resolvedTenantId, userId, async () => {
      const conditions: any[] = [eq(payments.tenantId, resolvedTenantId)];

      if (status) {
        conditions.push(eq(payments.status, status as 'pending' | 'paid' | 'overdue' | 'cancelled'));
      }
      if (startDate) conditions.push(gte(payments.dueDate, startDate));
      if (endDate) conditions.push(lte(payments.dueDate, endDate));

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
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0,
        defaultersCount: 0,
      };
      const defaultersSet = new Set<string>();

      for (const payment of result) {
        const amount = parseFloat(payment.amount as string);
        switch (payment.status) {
          case 'paid': stats.totalPaid += amount; stats.paidCount++; break;
          case 'pending': stats.totalPending += amount; stats.pendingCount++; break;
          case 'overdue': stats.totalOverdue += amount; stats.overdueCount++; defaultersSet.add(payment.memberId); break;
        }
      }
      stats.totalAmount = stats.totalPaid + stats.totalPending + stats.totalOverdue;
      stats.defaultersCount = defaultersSet.size;

      // Gerar PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const today = new Date().toLocaleDateString('pt-BR');

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório Financeiro', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${today}`, pageWidth / 2, 28, { align: 'center' });

      if (startDate || endDate) {
        const period = `Período: ${startDate || 'início'} até ${endDate || 'hoje'}`;
        doc.text(period, pageWidth / 2, 34, { align: 'center' });
      }

      // Estatísticas resumidas
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Financeiro', 14, 48);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryY = 56;
      const summaryData = [
        ['Total Recebido', `R$ ${stats.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Total Pendente', `R$ ${stats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Total Inadimplente', `R$ ${stats.totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Valor Total', `R$ ${stats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Associados Inadimplentes', String(stats.defaultersCount)],
      ];

      let y = summaryY;
      summaryData.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, 14, y);
        y += 6;
      });

      // Tabela de inadimplentes (se houver)
      if (result.some(p => p.status === 'overdue')) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Associados Inadimplentes', 14, y + 8);

        const defaulters = result
          .filter(p => p.status === 'overdue')
          .reduce((acc, p) => {
            const existing = acc.find(d => d.memberId === p.memberId);
            if (existing) {
              existing.totalAmount += parseFloat(p.amount as string);
            } else {
              acc.push({
                memberId: p.memberId,
                memberName: p.memberName || 'Membro',
                cpf: p.memberCpf || '',
                totalAmount: parseFloat(p.amount as string),
              });
            }
            return acc;
          }, [] as { memberId: string; memberName: string; cpf: string; totalAmount: number }[]);

        autoTable(doc, {
          startY: y + 14,
          head: [['Associado', 'CPF', 'Valor Devido']],
          body: defaulters.map(d => [d.memberName, d.cpf, `R$ ${d.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]),
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38] },
          footStyles: { fillColor: [220, 38, 38] },
          didParseCell: (data) => {
            if (data.section === 'foot' && data.column.index === 1) {
              const total = defaulters.reduce((acc, d) => acc + d.totalAmount, 0);
              data.cell.text = [`Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`];
            }
          },
        });
      }

      // Tabela de pagamentos detalhada
      const tableStartY = (doc as any).lastAutoTable?.finalY + 15 || 130;
      if (tableStartY > 250) {
        doc.addPage();
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhamento de Pagamentos', 14, tableStartY);

      autoTable(doc, {
        startY: tableStartY + 6,
        head: [['Associado', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Pagamento']],
        body: result.slice(0, 100).map(p => [
          p.memberName || 'Membro',
          p.description,
          `R$ ${parseFloat(p.amount as string).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          new Date(p.dueDate as string).toLocaleDateString('pt-BR'),
          statusLabels[p.status] || p.status,
          p.paidDate ? new Date(p.paidDate as string).toLocaleDateString('pt-BR') : '-',
        ]),
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 22 },
          4: { cellWidth: 20 },
          5: { cellWidth: 22 },
        },
      });

      // Footer em todas as páginas
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Socio Desk - Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Gerar PDF como buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      });
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório PDF' }, { status: 500 });
  }
}