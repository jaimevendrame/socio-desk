import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { plans, tenants, auditLogs } from '@/lib/db/schema';
import { createPlan, createTenant, clearTestData } from '@/lib/test-helpers';
import { eq } from 'drizzle-orm';

describe('MASTER - Base do Sistema', () => {
  beforeEach(async () => {
    await clearTestData();
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('1.1 Tenants', () => {
    it('deve listar tenants', async () => {
      // Arrange
      await createTenant({ name: 'Test Tenant', slug: 'test-tenant' });

      // Act
      const result = await db.select().from(tenants).orderBy(tenants.name);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Tenant');
      expect(result[0].slug).toBe('test-tenant');
    });

    it('deve buscar tenant por slug', async () => {
      // Arrange
      await createTenant({ name: 'Dev Tenant', slug: 'dev' });

      // Act
      const [result] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, 'dev'));

      // Assert
      expect(result.slug).toBe('dev');
    });

    it('deve criar novo tenant', async () => {
      // Arrange
      const newTenant = {
        name: 'Novo Tenant',
        slug: 'novo-tenant',
        isActive: true,
        settings: {},
      };

      // Act
      const [result] = await db.insert(tenants).values(newTenant).returning();

      // Assert
      expect(result.name).toBe('Novo Tenant');
      expect(result.slug).toBe('novo-tenant');
      expect(result.isActive).toBe(true);
    });

    it('não deve permitir slug duplicado', async () => {
      // Arrange
      await createTenant({ name: 'Tenant 1', slug: 'dup' });

      // Act & Assert
      await expect(
        db.insert(tenants).values({ name: 'Tenant 2', slug: 'dup' }).returning()
      ).rejects.toThrow();
    });
  });

  describe('1.2 Planos', () => {
    it('deve listar planos', async () => {
      // Arrange
      await createPlan({
        name: 'Básico',
        tier: 'basico',
        maxMembers: 10,
        priceMonthly: 100,
        priceYearly: 1000,
      });

      // Act
      const result = await db.select().from(plans);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Básico');
    });

    it('deve criar múltiplos planos', async () => {
      // Arrange
      await createPlan({
        name: 'Básico',
        tier: 'basico',
        maxMembers: 10,
        priceMonthly: 100,
        priceYearly: 1000,
      });
      await createPlan({
        name: 'Profissional',
        tier: 'profissional',
        maxMembers: 50,
        priceMonthly: 200,
        priceYearly: 2000,
      });

      // Act
      const result = await db.select().from(plans);

      // Assert
      expect(result).toHaveLength(2);
    });

    it('deve editar plano', async () => {
      // Arrange
      const plan = await createPlan({
        name: 'Básico',
        tier: 'basico',
        maxMembers: 10,
        priceMonthly: 100,
        priceYearly: 1000,
      });

      // Act
      await db.update(plans)
        .set({ name: 'Básico Premium', priceMonthly: 150 })
        .where(eq(plans.id, plan.id));

      const [updated] = await db.select().from(plans).where(eq(plans.id, plan.id));

      // Assert
      expect(updated.name).toBe('Básico Premium');
      expect(updated.priceMonthly).toBe('150.00');
    });
  });

  describe('1.3 Logs', () => {
    it('deve registrar log', async () => {
      // Arrange
      const tenant = await createTenant({ name: 'Log Test', slug: 'log-test' });

      // Act
      const [log] = await db.insert(auditLogs).values({
        tenantId: tenant.id,
        action: 'CREATE',
        entity: 'tenant',
        entityId: tenant.id,
        changes: { name: 'Log Test' },
      }).returning();

      // Assert
      expect(log.action).toBe('CREATE');
      expect(log.entity).toBe('tenant');
    });

    it('deve filtrar logs por ação', async () => {
      // Arrange
      const tenant = await createTenant({ name: 'Filter Test', slug: 'filter-test' });
      await db.insert(auditLogs).values([
        { tenantId: tenant.id, action: 'CREATE', entity: 'tenant', changes: {} },
        { tenantId: tenant.id, action: 'UPDATE', entity: 'plan', changes: {} },
      ]);

      // Act
      const result = await db.select().from(auditLogs)
        .where(eq(auditLogs.action, 'CREATE'));

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('CREATE');
    });
  });
});
