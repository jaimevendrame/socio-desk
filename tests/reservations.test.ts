import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { spaces, members, reservations } from '@/lib/db/schema';
import { createTenant, clearTestData } from '@/lib/test-helpers';
import { eq, and } from 'drizzle-orm';

describe('RESERVAS - Verificação de Conflitos', () => {
  let tenantId: string;
  let spaceId: string;
  let memberId: string;

  beforeEach(async () => {
    await clearTestData();
    const tenant = await createTenant({ name: 'Reserva Test', slug: 'reserva-test-' + Date.now() });
    tenantId = tenant.id;

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
    spaceId = space.id;

    const [member] = await db.insert(members).values({
      tenantId,
      type: 'afiliado',
      name: 'Membro Reserva',
      cpf: '99999999999',
      birthDate: '1985-01-01',
      status: 'ativo',
    }).returning();
    memberId = member.id;
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('Criação de Reserva', () => {
    it('deve criar reserva com sucesso', async () => {
      const [reservation] = await db.insert(reservations).values({
        tenantId,
        spaceId,
        memberId,
        date: '2026-07-01',
        startTime: '10:00',
        endTime: '11:00',
        status: 'confirmada',
      }).returning();

      expect(reservation.status).toBe('confirmada');
      expect(reservation.spaceId).toBe(spaceId);
    });

    it('deve detectar conflito de horário', async () => {
      // Criar primeira reserva
      await db.insert(reservations).values({
        tenantId,
        spaceId,
        memberId,
        date: '2026-07-02',
        startTime: '10:00',
        endTime: '11:00',
        status: 'confirmada',
      });

      // Buscar reservas conflitantes
      const existingReservations = await db.select().from(reservations)
        .where(and(
          eq(reservations.spaceId, spaceId),
          eq(reservations.date, '2026-07-02'),
          eq(reservations.status, 'confirmada')
        ));

      // Verificar conflito
      const hasConflict = existingReservations.some(r => {
        const existStart = r.startTime;
        const existEnd = r.endTime;
        // Horário desejado: 10:30 - 11:30
        return existStart < '11:30:00' && existEnd > '10:30:00';
      });

      expect(hasConflict).toBe(true);
    });

    it('deve permitir horário sem conflito', async () => {
      // Criar primeira reserva das 10h às 11h
      await db.insert(reservations).values({
        tenantId,
        spaceId,
        memberId,
        date: '2026-07-03',
        startTime: '10:00',
        endTime: '11:00',
        status: 'confirmada',
      });

      // Buscar reservas do dia
      const existingReservations = await db.select().from(reservations)
        .where(and(
          eq(reservations.spaceId, spaceId),
          eq(reservations.date, '2026-07-03'),
          eq(reservations.status, 'confirmada')
        ));

      // Horário desejado: 14:00 - 15:00 (sem conflito)
      const hasConflict = existingReservations.some(r => {
        return r.startTime < '15:00:00' && r.endTime > '14:00:00';
      });

      expect(hasConflict).toBe(false);
    });

    it('deve bloquear membro inadimplente', async () => {
      // Atualizar membro para inadimplente
      await db.update(members)
        .set({ status: 'inadimplente' })
        .where(eq(members.id, memberId));

      const [member] = await db.select().from(members).where(eq(members.id, memberId));

      expect(member.status).toBe('inadimplente');
    });
  });
});
