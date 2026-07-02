import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { plans, tenants, teamMembers, users, spaces, members, reservations, payments, reservationWaitlist, dependents } from '@/lib/db/schema';
import { createTenant, clearTestData } from '@/lib/test-helpers';
import { eq, and } from 'drizzle-orm';

describe('ESCRITÓRIO - Dados Operacionais', () => {
  let tenantId: string;

  beforeEach(async () => {
    await clearTestData();
    const tenant = await createTenant({ name: 'Escritório Test', slug: 'escritorio-test' });
    tenantId = tenant.id;
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('3.1 Espaços', () => {
    it('deve listar espaços', async () => {
      // Arrange
      await db.insert(spaces).values([
        { tenantId, name: 'Quadra A', category: 'esportivo', bufferMinutes: 15, minReservationMinutes: 30, maxReservationMinutes: 480, maxAdvanceDays: 30, openTime: '06:00', closeTime: '22:00', hasCost: false, isActive: true },
        { tenantId, name: 'Salão B', category: 'social', bufferMinutes: 15, minReservationMinutes: 60, maxReservationMinutes: 240, maxAdvanceDays: 30, openTime: '08:00', closeTime: '23:00', hasCost: true, costAmount: '100.00', isActive: true },
      ]);

      // Act
      const result = await db.select().from(spaces).where(eq(spaces.tenantId, tenantId));

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(s => s.name).sort()).toEqual(['Quadra A', 'Salão B']);
    });

    it('deve criar espaço', async () => {
      // Act
      const [space] = await db.insert(spaces).values({
        tenantId,
        name: 'Nova Quadra',
        category: 'esportivo',
        description: 'Quadra de tênis coberta',
        bufferMinutes: 15,
        minReservationMinutes: 60,
        maxReservationMinutes: 120,
        maxAdvanceDays: 15,
        openTime: '07:00',
        closeTime: '21:00',
        hasCost: true,
        costAmount: '50.00',
        isActive: true,
      }).returning();

      // Assert
      expect(space.name).toBe('Nova Quadra');
      expect(space.category).toBe('esportivo');
      expect(space.hasCost).toBe(true);
      expect(space.costAmount).toBe('50.00');
    });

    it('deve editar espaço', async () => {
      // Arrange
      const [space] = await db.insert(spaces).values({
        tenantId,
        name: 'Original',
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

      // Act
      await db.update(spaces)
        .set({ name: 'Atualizado', hasCost: true, costAmount: '75.00' })
        .where(eq(spaces.id, space.id));

      const [updated] = await db.select().from(spaces).where(eq(spaces.id, space.id));

      // Assert
      expect(updated.name).toBe('Atualizado');
      expect(updated.hasCost).toBe(true);
      expect(updated.costAmount).toBe('75.00');
    });
  });

  describe('3.2 Associados', () => {
    it('deve listar associados', async () => {
      // Arrange
      await db.insert(members).values([
        { tenantId, type: 'afiliado', name: 'João Silva', cpf: '11111111111', birthDate: '1980-05-15', status: 'ativo' },
        { tenantId, type: 'afiliado', name: 'Maria Santos', cpf: '22222222222', birthDate: '1990-08-20', status: 'ativo' },
      ]);

      // Act
      const result = await db.select().from(members).where(eq(members.tenantId, tenantId));

      // Assert
      expect(result).toHaveLength(2);
    });

    it('deve cadastrar novo associado', async () => {
      // Act
      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Carlos Oliveira',
        cpf: '33333333333',
        birthDate: '1985-03-10',
        email: 'carlos@email.com',
        phoneMobile: '11999999999',
        status: 'ativo',
      }).returning();

      // Assert
      expect(member.name).toBe('Carlos Oliveira');
      expect(member.type).toBe('afiliado');
      expect(member.status).toBe('ativo');
    });

    it('não deve permitir CPF duplicado no mesmo tenant', async () => {
      // Arrange
      await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Primeiro',
        cpf: '44444444444',
        birthDate: '1980-01-01',
      });

      // Act & Assert
      await expect(
        db.insert(members).values({
          tenantId,
          type: 'afiliado',
          name: 'Segundo',
          cpf: '44444444444', // Mesmo CPF
          birthDate: '1990-01-01',
        })
      ).rejects.toThrow();
    });

    it('deve criar dependente para associado', async () => {
      // Arrange
      const [parent] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Pai Teste',
        cpf: '55555555555',
        birthDate: '1975-06-15',
      }).returning();

      // Act
      const [dependent] = await db.insert(dependents).values({
        memberId: parent.id,
        type: 'filho',
        name: 'Filho Teste',
        birthDate: '2010-03-20',
        documentType: 'cpf',
        documentNumber: '66666666666',
        status: 'ativo',
      }).returning();

      // Assert
      expect(dependent.name).toBe('Filho Teste');
      expect(dependent.type).toBe('filho');
      expect(dependent.status).toBe('ativo');
    });
  });

  describe('3.3 Reservas', () => {
    it('deve criar reserva', async () => {
      // Arrange
      const [space] = await db.insert(spaces).values({
        tenantId,
        name: 'Quadra Teste',
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

      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Reserva Member',
        cpf: '77777777777',
        birthDate: '1985-01-01',
      }).returning();

      // Act
      const [reservation] = await db.insert(reservations).values({
        tenantId,
        spaceId: space.id,
        memberId: member.id,
        date: '2026-07-01',
        startTime: '10:00',
        endTime: '11:00',
        status: 'confirmada',
      }).returning();

      // Assert
      expect(reservation.status).toBe('confirmada');
      expect(reservation.date).toBe('2026-07-01');
    });

    it('deve detectar conflito de reserva', async () => {
      // Arrange
      const [space] = await db.insert(spaces).values({
        tenantId,
        name: 'Quadra Conflito',
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

      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Conflito Member',
        cpf: '88888888888',
        birthDate: '1985-01-01',
      }).returning();

      // Reserva existente das 10h às 11h
      await db.insert(reservations).values({
        tenantId,
        spaceId: space.id,
        memberId: member.id,
        date: '2026-07-02',
        startTime: '10:00',
        endTime: '11:00',
        status: 'confirmada',
      });

      // Act: buscar conflitos
      const existingReservations = await db.select().from(reservations)
        .where(and(
          eq(reservations.spaceId, space.id),
          eq(reservations.date, '2026-07-02'),
          eq(reservations.status, 'confirmada')
        ));

      // Assert: conflito existe
      expect(existingReservations).toHaveLength(1);
      expect(existingReservations[0].startTime).toBe('10:00:00');
      expect(existingReservations[0].endTime).toBe('11:00:00');
    });

    it('deve cancelar reserva', async () => {
      // Arrange
      const [space] = await db.insert(spaces).values({
        tenantId,
        name: 'Quadra Cancelar',
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

      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Cancelar Member',
        cpf: '99999999999',
        birthDate: '1985-01-01',
      }).returning();

      const [reservation] = await db.insert(reservations).values({
        tenantId,
        spaceId: space.id,
        memberId: member.id,
        date: '2026-07-03',
        startTime: '14:00',
        endTime: '15:00',
        status: 'confirmada',
      }).returning();

      // Act
      await db.update(reservations)
        .set({ status: 'cancelada', cancelledAt: new Date() })
        .where(eq(reservations.id, reservation.id));

      const [updated] = await db.select().from(reservations).where(eq(reservations.id, reservation.id));

      // Assert
      expect(updated.status).toBe('cancelada');
      expect(updated.cancelledAt).not.toBeNull();
    });
  });

  describe('3.4 Fila de Espera', () => {
    it('deve adicionar à fila de espera', async () => {
      // Arrange
      const [space] = await db.insert(spaces).values({
        tenantId,
        name: 'Quadra Fila',
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

      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Fila Member',
        cpf: '10101010101',
        birthDate: '1985-01-01',
      }).returning();

      // Act
      const [waitlist] = await db.insert(reservationWaitlist).values({
        tenantId,
        spaceId: space.id,
        memberId: member.id,
        date: '2026-07-04',
        startTime: '10:00',
        endTime: '11:00',
        position: 1,
        status: 'waiting',
      }).returning();

      // Assert
      expect(waitlist.position).toBe(1);
      expect(waitlist.status).toBe('waiting');
    });

    it('deve listar fila de espera', async () => {
      // Arrange
      const [space] = await db.insert(spaces).values({
        tenantId,
        name: 'Quadra Lista Fila',
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

      const [member1] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Fila 1',
        cpf: '11111111112',
        birthDate: '1985-01-01',
      }).returning();

      const [member2] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Fila 2',
        cpf: '11111111113',
        birthDate: '1986-01-01',
      }).returning();

      await db.insert(reservationWaitlist).values([
        { tenantId, spaceId: space.id, memberId: member1.id, date: '2026-07-05', startTime: '10:00', endTime: '11:00', position: 1, status: 'waiting' },
        { tenantId, spaceId: space.id, memberId: member2.id, date: '2026-07-05', startTime: '10:00', endTime: '11:00', position: 2, status: 'waiting' },
      ]);

      // Act
      const result = await db.select().from(reservationWaitlist)
        .where(and(
          eq(reservationWaitlist.spaceId, space.id),
          eq(reservationWaitlist.date, '2026-07-05')
        ))
        .orderBy(reservationWaitlist.position);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].position).toBe(1);
      expect(result[1].position).toBe(2);
    });
  });

  describe('3.5 Financeiro', () => {
    it('deve registrar pagamento', async () => {
      // Arrange
      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Pagamento Member',
        cpf: '12121212121',
        birthDate: '1985-01-01',
      }).returning();

      // Act
      const [payment] = await db.insert(payments).values({
        tenantId,
        memberId: member.id,
        description: 'Mensalidade Janeiro',
        amount: '150.00',
        dueDate: '2026-02-01',
        status: 'pending',
      }).returning();

      // Assert
      expect(payment.status).toBe('pending');
      expect(payment.amount).toBe('150.00');
    });

    it('deve baixar pagamento', async () => {
      // Arrange
      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Baixar Member',
        cpf: '13131313131',
        birthDate: '1985-01-01',
      }).returning();

      const [payment] = await db.insert(payments).values({
        tenantId,
        memberId: member.id,
        description: 'Mensalidade',
        amount: '100.00',
        dueDate: '2026-01-01',
        status: 'pending',
      }).returning();

      // Act
      await db.update(payments)
        .set({
          status: 'paid',
          paidDate: '2026-01-15',
          paymentMethod: 'PIX',
        })
        .where(eq(payments.id, payment.id));

      const [updated] = await db.select().from(payments).where(eq(payments.id, payment.id));

      // Assert
      expect(updated.status).toBe('paid');
      expect(updated.paidDate).toBe('2026-01-15');
      expect(updated.paymentMethod).toBe('PIX');
    });

    it('deve calcular total em aberto', async () => {
      // Arrange
      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Debito Member',
        cpf: '14141414141',
        birthDate: '1985-01-01',
      }).returning();

      await db.insert(payments).values([
        { tenantId, memberId: member.id, description: 'Pago', amount: '50.00', dueDate: '2026-01-01', status: 'paid', paidDate: '2026-01-05' },
        { tenantId, memberId: member.id, description: 'Pendente', amount: '100.00', dueDate: '2026-02-01', status: 'pending' },
        { tenantId, memberId: member.id, description: 'Vencido', amount: '75.00', dueDate: '2026-01-01', status: 'overdue' },
      ]);

      // Act
      const pendingPayments = await db.select().from(payments)
        .where(and(
          eq(payments.memberId, member.id),
          eq(payments.status, 'pending')
        ));

      const overduePayments = await db.select().from(payments)
        .where(and(
          eq(payments.memberId, member.id),
          eq(payments.status, 'overdue')
        ));

      const totalDebt = [...pendingPayments, ...overduePayments]
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      // Assert
      expect(pendingPayments).toHaveLength(1);
      expect(overduePayments).toHaveLength(1);
      expect(totalDebt).toBe(175.00);
    });
  });
});
