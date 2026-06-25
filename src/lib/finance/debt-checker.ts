import { db } from '@/lib/db/client';
import { payments, members, tenantSettings } from '@/lib/db/schema';
import { eq, and, sql, lt, inArray } from 'drizzle-orm';

export interface DebtCheckOptions {
  tenantId: string;
  /** Data de referência para verificar vencimentos (default: hoje) */
  referenceDate?: Date;
  /** Se true, bloqueia automaticamente membros inadimplentes */
  autoBlock?: boolean;
}

export interface MemberDebt {
  memberId: string;
  memberName: string;
  totalDebt: number;
  pendingPayments: number;
  overduePayments: number;
  oldestDueDate: string;
}

export interface DebtCheckResult {
  checked: number;
  markedOverdue: number;
  blockedMembers: number;
  unblockedMembers: number;
  defaulters: MemberDebt[];
  errors: string[];
}

/**
 * Verifica e marca pagamentos vencidos como 'overdue'
 * Também bloqueia/desbloqueia membros conforme configuração do tenant
 */
export async function checkAndUpdateOverduePayments(
  options: DebtCheckOptions
): Promise<DebtCheckResult> {
  const { tenantId, referenceDate = new Date(), autoBlock = true } = options;

  const result: DebtCheckResult = {
    checked: 0,
    markedOverdue: 0,
    blockedMembers: 0,
    unblockedMembers: 0,
    defaulters: [],
    errors: [],
  };

  try {
    // Buscar configurações do tenant
    const [settings] = await db
      .select()
      .from(tenantSettings)
      .where(eq(tenantSettings.tenantId, tenantId));

    const gracePeriodDays = settings?.gracePeriodDays ?? 5;
    const minDebtForBlock = parseFloat(settings?.minDebtForBlock as string || '0.01');
    const isAutoBlockEnabled = settings?.autoBlockEnabled ?? true;

    // Calcular data limite (hoje - grace period)
    const graceLimitDate = new Date(referenceDate);
    graceLimitDate.setDate(graceLimitDate.getDate() - gracePeriodDays);

    // Buscar pagamentos pendentes que devem ser marcados como vencidos
    const pendingPayments = await db
      .select({
        id: payments.id,
        memberId: payments.memberId,
        dueDate: payments.dueDate,
      })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, tenantId),
          eq(payments.status, 'pending'),
          lt(payments.dueDate, graceLimitDate.toISOString().split('T')[0])
        )
      );

    result.checked = pendingPayments.length;

    // Marcar pagamentos como vencidos
    if (pendingPayments.length > 0) {
      const paymentIds = pendingPayments.map(p => p.id);

      await db
        .update(payments)
        .set({ status: 'overdue' })
        .where(
          and(
            eq(payments.tenantId, tenantId),
            inArray(payments.id, paymentIds)
          )
        );

      result.markedOverdue = pendingPayments.length;
    }

    // Se auto-block está desabilitado, parar aqui
    if (!autoBlock || !isAutoBlockEnabled) {
      return result;
    }

    // Buscar membros inadimplentes e seus débitos
    const overdueDebts = await db
      .select({
        memberId: payments.memberId,
        memberName: members.name,
        totalDebt: sql<string>`COALESCE(SUM(${payments.amount}::decimal), 0)`,
        pendingPayments: sql<number>`COUNT(CASE WHEN ${payments.status} = 'pending' THEN 1 END)`,
        overduePayments: sql<number>`COUNT(CASE WHEN ${payments.status} = 'overdue' THEN 1 END)`,
        oldestDueDate: sql<string>`MIN(${payments.dueDate})`,
      })
      .from(payments)
      .leftJoin(members, eq(payments.memberId, members.id))
      .where(
        and(
          eq(payments.tenantId, tenantId),
          sql`${payments.status} IN ('pending', 'overdue')`
        )
      )
      .groupBy(payments.memberId, members.name);

    // Calcular débitos por membro
    const memberDebts: Record<string, MemberDebt> = {};

    for (const debt of overdueDebts) {
      const totalDebt = parseFloat(String(debt.totalDebt));

      memberDebts[debt.memberId] = {
        memberId: debt.memberId,
        memberName: debt.memberName || 'Desconhecido',
        totalDebt,
        pendingPayments: Number(debt.pendingPayments) || 0,
        overduePayments: Number(debt.overduePayments) || 0,
        oldestDueDate: String(debt.oldestDueDate),
      };

      // Se o débito total é maior que o mínimo, bloquear o membro
      if (totalDebt >= minDebtForBlock) {
        const [member] = await db
          .select()
          .from(members)
          .where(eq(members.id, debt.memberId));

        if (member && member.status !== 'inadimplente') {
          await db
            .update(members)
            .set({
              status: 'inadimplente',
              blockedAt: referenceDate,
              blockReason: `Inadimplência: R$ ${totalDebt.toFixed(2)} em débitos`,
              updatedAt: new Date(),
            })
            .where(eq(members.id, debt.memberId));

          result.blockedMembers++;
        }
      }
    }

    result.defaulters = Object.values(memberDebts);

    // Verificar desbloqueio de membros que quitaram débitos
    const allMembersWithDebts = result.defaulters.map(d => d.memberId);

    // Buscar todos os membros ativos do tenant
    const allMembers = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.tenantId, tenantId));

    const membersWithoutDebts = allMembers
      .filter(m => !allMembersWithDebts.includes(m.id))
      .map(m => m.id);

    // Desbloquear membros sem débitos
    for (const memberId of membersWithoutDebts) {
      const [member] = await db
        .select()
        .from(members)
        .where(eq(members.id, memberId));

      if (member && member.status === 'inadimplente') {
        await db
          .update(members)
          .set({
            status: 'ativo',
            blockedAt: null,
            blockReason: null,
            updatedAt: new Date(),
          })
          .where(eq(members.id, memberId));

        result.unblockedMembers++;
      }
    }

    return result;
  } catch (err) {
    result.errors.push(`Erro ao verificar inadimplência: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    return result;
  }
}

/**
 * Obtém resumo de débitos de um membro
 */
export async function getMemberDebtSummary(
  memberId: string
): Promise<{
  totalPending: number;
  totalOverdue: number;
  paymentCount: number;
  oldestDueDate: string | null;
  canReserve: boolean;
}> {
  const debts = await db
    .select({
      status: payments.status,
      amount: payments.amount,
      dueDate: payments.dueDate,
    })
    .from(payments)
    .where(eq(payments.memberId, memberId));

  const totalPending = debts
    .filter(d => d.status === 'pending')
    .reduce((acc, d) => acc + parseFloat(d.amount as string), 0);

  const totalOverdue = debts
    .filter(d => d.status === 'overdue')
    .reduce((acc, d) => acc + parseFloat(d.amount as string), 0);

  const overduePayments = debts.filter(d => d.status === 'overdue');
  const oldestDueDate = overduePayments.length > 0
    ? overduePayments.reduce((oldest, d) =>
        new Date(d.dueDate as string) < new Date(oldest.dueDate as string) ? d : oldest
      ).dueDate as string
    : null;

  return {
    totalPending,
    totalOverdue,
    paymentCount: debts.length,
    oldestDueDate,
    canReserve: totalOverdue === 0 && totalPending === 0,
  };
}
