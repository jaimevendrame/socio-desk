import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { plans, tenants, teamMembers, users, tenantSettings, spaces, members } from '@/lib/db/schema';
import { createPlan, createTenant, clearTestData } from '@/lib/test-helpers';
import { eq } from 'drizzle-orm';

describe('ADMIN - Gestão do Sistema', () => {
  let tenantId: string;
  let userId: string;

  beforeEach(async () => {
    await clearTestData();

    // Setup: criar tenant e usuário para testes
    const tenant = await createTenant({ name: 'Admin Test', slug: 'admin-test' });
    tenantId = tenant.id;

    const user = await db.insert(users).values({
      name: 'Admin User',
      email: 'admin@test.com',
    }).returning().then(([r]) => r);
    userId = user.id;
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('2.1 Equipe', () => {
    it('deve listar membros da equipe', async () => {
      // Arrange
      await db.insert(teamMembers).values({
        tenantId,
        userId,
        name: 'John Doe',
        email: 'john@test.com',
        role: 'admin',
      });

      // Act
      const result = await db.select().from(teamMembers)
        .where(eq(teamMembers.tenantId, tenantId));

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
      expect(result[0].role).toBe('admin');
    });

    it('deve criar membro da equipe', async () => {
      // Arrange
      const newUser = await db.insert(users).values({
        name: 'Jane Doe',
        email: 'jane@test.com',
      }).returning().then(([r]) => r);

      // Act
      const [member] = await db.insert(teamMembers).values({
        tenantId,
        userId: newUser.id,
        name: 'Jane Doe',
        email: 'jane@test.com',
        role: 'team',
      }).returning();

      // Assert
      expect(member.name).toBe('Jane Doe');
      expect(member.role).toBe('team');
      expect(member.isActive).toBe(true);
    });

    it('deve editar membro da equipe', async () => {
      // Arrange
      const [member] = await db.insert(teamMembers).values({
        tenantId,
        userId,
        name: 'Original Name',
        email: 'original@test.com',
        role: 'team',
      }).returning();

      // Act
      await db.update(teamMembers)
        .set({ name: 'Updated Name', role: 'admin' })
        .where(eq(teamMembers.id, member.id));

      const [updated] = await db.select().from(teamMembers)
        .where(eq(teamMembers.id, member.id));

      // Assert
      expect(updated.name).toBe('Updated Name');
      expect(updated.role).toBe('admin');
    });

    it('deve buscar membro da equipe por email', async () => {
      // Arrange
      await db.insert(teamMembers).values({
        tenantId,
        userId,
        name: 'First',
        email: 'findme@test.com',
        role: 'team',
      });

      // Act
      const result = await db.select().from(teamMembers)
        .where(eq(teamMembers.email, 'findme@test.com'));

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('findme@test.com');
    });

    it('deve desativar membro da equipe', async () => {
      // Arrange
      const [member] = await db.insert(teamMembers).values({
        tenantId,
        userId,
        name: 'To Deactivate',
        email: 'deactivate@test.com',
        role: 'team',
        isActive: true,
      }).returning();

      // Act
      await db.update(teamMembers)
        .set({ isActive: false })
        .where(eq(teamMembers.id, member.id));

      const [updated] = await db.select().from(teamMembers)
        .where(eq(teamMembers.id, member.id));

      // Assert
      expect(updated.isActive).toBe(false);
    });
  });

  describe('2.2 Configurações', () => {
    it('deve criar configurações padrão do tenant', async () => {
      // Act
      const [settings] = await db.insert(tenantSettings).values({
        tenantId,
        gracePeriodDays: 5,
        minDebtForBlock: '0.01',
        autoBlockEnabled: true,
        defaultBufferMinutes: 15,
      }).returning();

      // Assert
      expect(settings.tenantId).toBe(tenantId);
      expect(settings.gracePeriodDays).toBe(5);
      expect(settings.autoBlockEnabled).toBe(true);
    });

    it('deve buscar configurações do tenant', async () => {
      // Arrange
      await db.insert(tenantSettings).values({
        tenantId,
        gracePeriodDays: 10,
        minDebtForBlock: '5.00',
      });

      // Act
      const [settings] = await db.select().from(tenantSettings)
        .where(eq(tenantSettings.tenantId, tenantId));

      // Assert
      expect(settings.gracePeriodDays).toBe(10);
      expect(settings.minDebtForBlock).toBe('5.00');
    });

    it('deve atualizar configurações do tenant', async () => {
      // Arrange
      await db.insert(tenantSettings).values({
        tenantId,
        gracePeriodDays: 5,
      });

      // Act
      await db.update(tenantSettings)
        .set({ gracePeriodDays: 15, minDebtForBlock: '10.00' })
        .where(eq(tenantSettings.tenantId, tenantId));

      const [updated] = await db.select().from(tenantSettings)
        .where(eq(tenantSettings.tenantId, tenantId));

      // Assert
      expect(updated.gracePeriodDays).toBe(15);
      expect(updated.minDebtForBlock).toBe('10.00');
    });

    it('deve permitir only um registro de configurações por tenant', async () => {
      // Arrange
      await db.insert(tenantSettings).values({
        tenantId,
        gracePeriodDays: 5,
      });

      // Act & Assert
      await expect(
        db.insert(tenantSettings).values({
          tenantId,
          gracePeriodDays: 10,
        })
      ).rejects.toThrow();
    });
  });

  describe('2.3 Relatórios', () => {
    it('deve criar espaço para relatório', async () => {
      // Arrange
      const [space] = await db.insert(spaces).values({
        tenantId,
        name: 'Quadra A',
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

      // Assert
      expect(space.name).toBe('Quadra A');
      expect(space.category).toBe('esportivo');
    });

    it('deve criar membro para relatório', async () => {
      // Arrange
      const [member] = await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Relatório Member',
        cpf: '12345678901',
        birthDate: '1990-01-01',
      }).returning();

      // Assert
      expect(member.name).toBe('Relatório Member');
      expect(member.type).toBe('afiliado');
      expect(member.status).toBe('ativo');
    });

    it('deve listar membros ativos', async () => {
      // Arrange
      await db.insert(members).values([
        { tenantId, type: 'afiliado', name: 'Ativo 1', cpf: '11111111111', birthDate: '1990-01-01', status: 'ativo' },
        { tenantId, type: 'afiliado', name: 'Ativo 2', cpf: '22222222222', birthDate: '1991-01-01', status: 'ativo' },
        { tenantId, type: 'afiliado', name: 'Inativo', cpf: '33333333333', birthDate: '1992-01-01', status: 'suspenso' },
      ]);

      // Act
      const result = await db.select().from(members)
        .where(eq(members.tenantId, tenantId));

      // Assert
      expect(result).toHaveLength(3);
      const active = result.filter(m => m.status === 'ativo');
      expect(active).toHaveLength(2);
    });
  });
});
