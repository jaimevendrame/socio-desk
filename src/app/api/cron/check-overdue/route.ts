import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkAndUpdateOverduePayments } from '@/lib/finance/debt-checker';
import { generateMonthlySubscriptions } from '@/lib/finance/subscription-generator';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

/**
 * POST /api/cron/check-overdue
 *
 * Endpoint para verificar e atualizar pagamentos vencidos
 * Deve ser chamado via cron job (ex: às 06:00 diariamente)
 *
 * Headers necessários:
 * - Authorization: Bearer {CRON_SECRET}
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar authorization header (exemplo de proteção básica)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = {
      tenants: [] as Array<{
        tenantId: string;
        tenantName: string;
        checked: number;
        markedOverdue: number;
        blockedMembers: number;
        unblockedMembers: number;
        defaultersCount: number;
      }>,
      total: {
        tenantsProcessed: 0,
        paymentsMarkedOverdue: 0,
        membersBlocked: 0,
        membersUnblocked: 0,
      },
      errors: [] as string[],
    };

    // Buscar todos os tenants ativos
    const activeTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
      })
      .from(tenants)
      .where(eq(tenants.isActive, true));

    // Processar cada tenant
    for (const tenant of activeTenants) {
      try {
        const result = await checkAndUpdateOverduePayments({
          tenantId: tenant.id,
          referenceDate: new Date(),
          autoBlock: true,
        });

        results.tenants.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          checked: result.checked,
          markedOverdue: result.markedOverdue,
          blockedMembers: result.blockedMembers,
          unblockedMembers: result.unblockedMembers,
          defaultersCount: result.defaulters.length,
        });

        results.total.tenantsProcessed++;
        results.total.paymentsMarkedOverdue += result.markedOverdue;
        results.total.membersBlocked += result.blockedMembers;
        results.total.membersUnblocked += result.unblockedMembers;

        if (result.errors.length > 0) {
          results.errors.push(...result.errors.map(e => `[${tenant.name}] ${e}`));
        }
      } catch (err) {
        results.errors.push(`[${tenant.name}] Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }

    return NextResponse.json({
      success: true,
      executedAt: new Date().toISOString(),
      ...results,
    });
  } catch (err) {
    console.error('Cron check-overdue error:', err);
    return NextResponse.json(
      { error: 'Erro interno ao processar verificações' },
      { status: 500 }
    );
  }
}
