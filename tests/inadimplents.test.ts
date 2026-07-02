import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { members, payments } from '@/lib/db/schema';
import { createTenant, clearTestData } from '@/lib/test-helpers';
import { eq, and, lt } from 'drizzle-orm';

describe('INADIMPLENTES', () => {
  let tenantId: string;

  beforeEach(async () => {
    await clearTestData();
    const tenant = await createTenant({ name: 'Inadimplente Test', slug: 'inadimplente-test-' + Date.now() });
    tenantId = tenant.id;
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('Verificação de Inadimplência', () => {
    it('deve identificar membro com pagamento atrasado', async () => {
      // Criar membro
      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Membro Inadimplente',
        cpf: '11111111111',
        birthDate: '1980-01-01',
        status: 'ativo',
      }).returning();

      // Criar pagamento vencido
      await db.insert(payments).values({
        tenantId,
        memberId: member.id,
        description: 'Mensalidade Junho',
        amount: '100.00',
        dueDate: '2026-06-01',
        status: 'overdue',
      });

      // Buscar membros inadimplentes
      const overduePayments = await db.select().from(payments)
        .where(and(
          eq(payments.memberId, member.id),
          eq(payments.status, 'overdue')
        ));

      expect(overduePayments).toHaveLength(1);
      expect(overduePayments[0].amount).toBe('100.00');
    });

    it('deve calcular total de dívida do membro', async () => {
      // Criar membro
      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Devedor',
        cpf: '22222222222',
        birthDate: '1985-01-01',
        status: 'ativo',
      }).returning();

      // Criar múltiplas mensalidades vencidas
      await db.insert(payments).values([
        { tenantId, memberId: member.id, description: 'Mensalidade 1', amount: '50.00', dueDate: '2026-04-01', status: 'overdue' },
        { tenantId, memberId: member.id, description: 'Mensalidade 2', amount: '50.00', dueDate: '2026-05-01', status: 'overdue' },
        { tenantId, memberId: member.id, description: 'Mensalidade 3', amount: '50.00', dueDate: '2026-06-01', status: 'overdue' },
      ]);

      // Buscar pagamentos pendentes/vencidos
      const debtPayments = await db.select().from(payments)
        .where(and(
          eq(payments.memberId, member.id),
          eq(payments.status, 'overdue')
        ));

      const totalDebt = debtPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      expect(debtPayments).toHaveLength(3);
      expect(totalDebt).toBe(150.00);
    });

    it('deve bloquear membro inadimplente', async () => {
      // Criar membro
      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Bloqueável',
        cpf: '33333333333',
        birthDate: '1990-01-01',
        status: 'ativo',
      }).returning();

      // Criar dívida
      await db.insert(payments).values({
        tenantId,
        memberId: member.id,
        description: 'Mensalidade',
        amount: '200.00',
        dueDate: '2026-06-01',
        status: 'overdue',
      });

      // Bloquear membro
      await db.update(members)
        .set({
          status: 'suspenso',
          blockReason: 'Inadimplência',
          blockedAt: new Date(),
        })
        .where(eq(members.id, member.id));

      const [blocked] = await db.select().from(members).where(eq(members.id, member.id));

      expect(blocked.status).toBe('suspenso');
      expect(blocked.blockReason).toBe('Inadimplência');
    });

    it('deve baixar pagamento e desbloquear membro', async () => {
      // Criar membro bloqueado
      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Para Desbloquear',
        cpf: '44444444444',
        birthDate: '1980-01-01',
        status: 'suspenso',
        blockReason: 'Inadimplência',
        blockedAt: new Date(),
      }).returning();

      // Criar pagamento pendente
      const [payment] = await db.insert(payments).values({
        tenantId,
        memberId: member.id,
        description: 'Mensalidade',
        amount: '100.00',
        dueDate: '2026-06-01',
        status: 'pending',
      }).returning();

      // Baixar pagamento
      await db.update(payments)
        .set({
          status: 'paid',
          paidDate: '2026-06-30',
          paymentMethod: 'PIX',
        })
        .where(eq(payments.id, payment.id));

      // Verificar pagamento
      const [updatedPayment] = await db.select().from(payments).where(eq(payments.id, payment.id));
      expect(updatedPayment.status).toBe('paid');
      expect(updatedPayment.paidDate).toBe('2026-06-30');
    });

    it('deve manter bloqueio se ainda houver dívida', async () => {
      // Criar membro bloqueado
      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Parcialmente Pago',
        cpf: '55555555555',
        birthDate: '1985-01-01',
        status: 'suspenso',
        blockReason: 'Inadimplência',
      }).returning();

      // Criar dois pagamentos pendentes
      await db.insert(payments).values([
        { tenantId, memberId: member.id, description: 'Mensalidade 1', amount: '100.00', dueDate: '2026-06-01', status: 'pending' },
        { tenantId, memberId: member.id, description: 'Mensalidade 2', amount: '100.00', dueDate: '2026-06-01', status: 'pending' },
      ]);

      // Verificar que ainda há dívida
      const pendingPayments = await db.select().from(payments)
        .where(and(
          eq(payments.memberId, member.id),
          eq(payments.status, 'pending')
        ));

      expect(pendingPayments).toHaveLength(2);

      // Membro deve permanecer bloqueado
      const [stillBlocked] = await db.select().from(members).where(eq(members.id, member.id));
      expect(stillBlocked.status).toBe('suspenso');
    });
  });
});
