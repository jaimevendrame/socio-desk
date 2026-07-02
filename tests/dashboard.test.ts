import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { tenants, spaces, members, reservations, payments } from '@/lib/db/schema';
import { createTenant, clearTestData } from '@/lib/test-helpers';
import { eq, and, sql } from 'drizzle-orm';

describe('DASHBOARD - Portal do Membro', () => {
  let tenantId: string;
  let memberId: string;
  let spaceId: string;

  beforeEach(async () => {
    await clearTestData();
    const tenant = await createTenant({ name: 'Dashboard Test', slug: 'dashboard-test-' + Date.now() });
    tenantId = tenant.id;

    const [space] = await db.insert(spaces).values({
      tenantId,
      name: 'Quadra Dashboard',
      category: 'esportivo',
      bufferMinutes: 15,
      minReservationMinutes: 30,
      maxReservationMinutes: 480,
      maxAdvanceDays: 30,
      openTime: '06:00',
      closeTime: '22:00',
      hasCost: false,
      isActive: true,
    }).returning();
    spaceId = space.id;

    const [member] = await db.insert(members).values({
      tenantId,
      type: 'afiliado',
      name: 'Dashboard Member',
      cpf: '99999999999',
      birthDate: '1985-01-01',
      status: 'ativo',
    }).returning();
    memberId = member.id;
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('5.1 Dashboard Principal', () => {
    it('deve buscar pagamentos pendentes do membro', async () => {
      // Arrange
      await db.insert(payments).values({
        tenantId,
        memberId,
        description: 'Pendente',
        amount: '100.00',
        dueDate: '2026-02-01',
        status: 'pending',
      });

      // Act
      const pending = await db.select().from(payments)
        .where(and(
          eq(payments.memberId, memberId),
          eq(payments.status, 'pending')
        ));

      // Assert
      expect(pending).toHaveLength(1);
      expect(pending[0].amount).toBe('100.00');
    });

    it('deve verificar pagamentos do membro', async () => {
      // Arrange
      await db.insert(payments).values({
        tenantId,
        memberId,
        description: 'Mensalidade',
        amount: '150.00',
        dueDate: '2026-06-01',
        status: 'paid',
        paidDate: '2026-06-01',
      });

      // Act
      const allPayments = await db.select().from(payments)
        .where(eq(payments.memberId, memberId));

      // Assert
      expect(allPayments).toHaveLength(1);
      expect(allPayments[0].status).toBe('paid');
    });
  });

  describe('5.2 Reservas do Membro', () => {
    it('deve criar reserva para o membro', async () => {
      // Act
      const [reservation] = await db.insert(reservations).values({
        tenantId,
        spaceId,
        memberId,
        date: '2026-07-10',
        startTime: '10:00',
        endTime: '11:00',
        status: 'confirmada',
      }).returning();

      // Assert
      expect(reservation.status).toBe('confirmada');
      expect(reservation.memberId).toBe(memberId);
    });

    it('deve cancelar reserva do membro', async () => {
      // Arrange
      const [reservation] = await db.insert(reservations).values({
        tenantId,
        spaceId,
        memberId,
        date: '2026-07-11',
        startTime: '15:00',
        endTime: '16:00',
        status: 'confirmada',
      }).returning();

      // Act
      await db.update(reservations)
        .set({ status: 'cancelada', cancelledAt: new Date() })
        .where(eq(reservations.id, reservation.id));

      const [updated] = await db.select().from(reservations)
        .where(eq(reservations.id, reservation.id));

      // Assert
      expect(updated.status).toBe('cancelada');
    });

    it('deve mostrar detalhes da reserva com espaço', async () => {
      // Arrange
      const [reservation] = await db.insert(reservations).values({
        tenantId,
        spaceId,
        memberId,
        date: '2026-07-12',
        startTime: '11:00',
        endTime: '12:00',
        status: 'confirmada',
      }).returning();

      // Act
      const [result] = await db.select().from(reservations)
        .where(eq(reservations.id, reservation.id));

      // Assert
      expect(result.spaceId).toBe(spaceId);
      expect(result.date).toBe('2026-07-12');
    });
  });

  describe('5.3 Perfil do Membro', () => {
    it('deve buscar dados do membro', async () => {
      // Act
      const [member] = await db.select().from(members)
        .where(eq(members.id, memberId));

      // Assert
      expect(member.name).toBe('Dashboard Member');
      expect(member.status).toBe('ativo');
    });

    it('deve atualizar perfil do membro', async () => {
      // Act
      await db.update(members)
        .set({ phoneMobile: '11988887777', email: 'updated@email.com' })
        .where(eq(members.id, memberId));

      const [updated] = await db.select().from(members)
        .where(eq(members.id, memberId));

      // Assert
      expect(updated.phoneMobile).toBe('11988887777');
      expect(updated.email).toBe('updated@email.com');
    });
  });
});
