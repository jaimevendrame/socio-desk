import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateMonthlySubscriptions } from '@/lib/finance/subscription-generator';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

/**
 * POST /api/cron/generate-subscriptions
 *
 * Endpoint para gerar mensalidades do próximo mês
 * Deve ser chamado no último dia do mês (ex: 23:59 do último dia)
 *
 * Headers necessários:
 * - Authorization: Bearer {CRON_SECRET}
 */
export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 'cron');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)) } }
      );
    }
    // Verificar authorization header
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
        generated: number;
        failed: number;
        errors: string[];
      }>,
      total: {
        tenantsProcessed: 0,
        subscriptionsGenerated: 0,
        subscriptionsFailed: 0,
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
        const result = await withTenantContext(tenant.id, undefined, async () =>
          generateMonthlySubscriptions({ tenantId: tenant.id, month: new Date() })
        );

        results.tenants.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          generated: result.generated,
          failed: result.failed,
          errors: result.errors,
        });

        results.total.tenantsProcessed++;
        results.total.subscriptionsGenerated += result.generated;
        results.total.subscriptionsFailed += result.failed;

        if (result.errors.length > 0) {
          results.errors.push(...result.errors.map(e => `[${tenant.name}] ${e}`));
        }
      } catch (err) {
        results.tenants.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          generated: 0,
          failed: 1,
          errors: [`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`],
        });

        results.total.subscriptionsFailed++;
        results.errors.push(`[${tenant.name}] Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }

    return NextResponse.json({
      success: true,
      executedAt: new Date().toISOString(),
      generatedForMonth: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      ...results,
    });
  } catch (err) {
    console.error('Cron generate-subscriptions error:', err);
    return NextResponse.json(
      { error: 'Erro interno ao gerar mensalidades' },
      { status: 500 }
    );
  }
}
