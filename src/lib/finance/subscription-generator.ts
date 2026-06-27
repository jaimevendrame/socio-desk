import { db } from '@/lib/db/client';
import { payments, members } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { format, startOfMonth } from 'date-fns';

export interface GenerateSubscriptionsOptions {
  tenantId: string;
  month?: Date;
}

export interface SubscriptionResult {
  generated: number;
  failed: number;
  errors: string[];
}

/**
 * Gera mensalidades para todos os membros ativos de um tenant
 * para o mês especificado
 */
export async function generateMonthlySubscriptions(
  options: GenerateSubscriptionsOptions
): Promise<SubscriptionResult> {
  const { tenantId, month = startOfMonth(new Date()) } = options;

  const result: SubscriptionResult = {
    generated: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Valores padrão para mensalidade
    const defaultAmount = '50.00';
    const defaultDescription = `Mensalidade ${format(month, 'MMMM/yyyy', { locale: require('date-fns/locale/pt-BR') })}`;
    const dueDay = 10; // Dia 10 de cada mês

    // Buscar membros ativos do tenant
    const activeMembers = await db
      .select({
        id: members.id,
        name: members.name,
        email: members.email,
        isBillable: members.isBillable,
      })
      .from(members)
      .where(
        and(
          eq(members.tenantId, tenantId),
          eq(members.status, 'ativo')
        )
      );

    // Para cada membro, criar mensalidade se não existir
    for (const member of activeMembers) {
      try {
        const monthStr = format(month, 'yyyy-MM');
        const dueDate = format(new Date(month.getFullYear(), month.getMonth(), dueDay), 'yyyy-MM-dd');

        // Verificar se já existe mensalidade para este membro neste mês
        const [existing] = await db
          .select({ id: payments.id })
          .from(payments)
          .where(
            and(
              eq(payments.memberId, member.id),
              eq(payments.tenantId, tenantId),
              sql`TO_CHAR(${payments.dueDate}, 'YYYY-MM') = ${monthStr}`
            )
          );

        if (existing) {
          // Já existe, pular
          continue;
        }

        // Criar a mensalidade
        await db.insert(payments).values({
          tenantId,
          memberId: member.id,
          description: `${defaultDescription} - ${member.name}`,
          amount: member.isBillable ? defaultAmount : '0.00',
          dueDate,
          status: 'pending',
        });

        result.generated++;
      } catch (err) {
        result.failed++;
        result.errors.push(`Erro ao criar mensalidade para ${member.name}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }

    return result;
  } catch (err) {
    result.errors.push(`Erro ao gerar mensalidades: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    return result;
  }
}