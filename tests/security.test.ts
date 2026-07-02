import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { tenants, spaces, members, teamMembers, users } from '@/lib/db/schema';
import { createTenant, clearTestData } from '@/lib/test-helpers';
import { eq } from 'drizzle-orm';

describe('SEGURANÇA', () => {
  beforeEach(async () => {
    await clearTestData();
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('6.1 Tenant Isolation', () => {
    it('deve criar espaços isolados por tenant', async () => {
      // Arrange
      const t1 = await createTenant({ name: 'Tenant A', slug: 'tenant-a-' + Date.now() });
      const t2 = await createTenant({ name: 'Tenant B', slug: 'tenant-b-' + Date.now() });

      await db.insert(spaces).values({
        tenantId: t1.id,
        name: 'Espaço A',
        category: 'esportivo',
        bufferMinutes: 15,
        minReservationMinutes: 30,
        maxReservationMinutes: 480,
        maxAdvanceDays: 30,
        openTime: '06:00',
        closeTime: '22:00',
        hasCost: false,
        isActive: true,
      });

      await db.insert(spaces).values({
        tenantId: t2.id,
        name: 'Espaço B',
        category: 'esportivo',
        bufferMinutes: 15,
        minReservationMinutes: 30,
        maxReservationMinutes: 480,
        maxAdvanceDays: 30,
        openTime: '06:00',
        closeTime: '22:00',
        hasCost: false,
        isActive: true,
      });

      // Act
      const spacesInA = await db.select().from(spaces).where(eq(spaces.tenantId, t1.id));
      const spacesInB = await db.select().from(spaces).where(eq(spaces.tenantId, t2.id));

      // Assert
      expect(spacesInA).toHaveLength(1);
      expect(spacesInA[0].name).toBe('Espaço A');
      expect(spacesInB).toHaveLength(1);
      expect(spacesInB[0].name).toBe('Espaço B');
      expect(spacesInA[0].id).not.toBe(spacesInB[0].id);
    });

    it('deve criar membros isolados por tenant', async () => {
      // Arrange
      const t1 = await createTenant({ name: 'Tenant A', slug: 'tenant-a-' + Date.now() });
      const t2 = await createTenant({ name: 'Tenant B', slug: 'tenant-b-' + Date.now() });

      await db.insert(members).values({
        tenantId: t1.id,
        type: 'afiliado',
        name: 'Membro A',
        cpf: '11111111111',
        birthDate: '1980-01-01',
      });

      await db.insert(members).values({
        tenantId: t2.id,
        type: 'afiliado',
        name: 'Membro B',
        cpf: '22222222222',
        birthDate: '1985-01-01',
      });

      // Act
      const membersInA = await db.select().from(members).where(eq(members.tenantId, t1.id));
      const membersInB = await db.select().from(members).where(eq(members.tenantId, t2.id));

      // Assert
      expect(membersInA).toHaveLength(1);
      expect(membersInA[0].name).toBe('Membro A');
      expect(membersInB).toHaveLength(1);
      expect(membersInB[0].name).toBe('Membro B');
    });

    it('deve bloquear membro quando configurado', async () => {
      // Arrange
      const t1 = await createTenant({ name: 'Block Test', slug: 'block-' + Date.now() });

      const [member] = await db.insert(members).values({
        tenantId: t1.id,
        type: 'afiliado',
        name: 'Bloqueado',
        cpf: '44444444444',
        birthDate: '1980-01-01',
        status: 'ativo',
      }).returning();

      // Act: bloquear
      await db.update(members)
        .set({
          status: 'suspenso',
          blockReason: 'Inadimplência',
          blockedAt: new Date(),
        })
        .where(eq(members.id, member.id));

      const [blocked] = await db.select().from(members).where(eq(members.id, member.id));

      // Assert
      expect(blocked.status).toBe('suspenso');
      expect(blocked.blockReason).toBe('Inadimplência');
    });
  });

  describe('6.2 Autorização por Role', () => {
    it('deve criar admin_master com acesso total', async () => {
      // Arrange
      const t1 = await createTenant({ name: 'Role Test', slug: 'role-' + Date.now() });

      const [user] = await db.insert(users).values({
        name: 'Master Admin',
        email: `master-${Date.now()}@test.com`,
      }).returning();

      // Act
      const [admin] = await db.insert(teamMembers).values({
        tenantId: t1.id,
        userId: user.id,
        name: 'Master Admin',
        email: user.email!,
        role: 'admin_master',
      }).returning();

      // Assert
      expect(admin.role).toBe('admin_master');
    });

    it('deve criar member (membro simples)', async () => {
      // Arrange
      const t1 = await createTenant({ name: 'Member Test', slug: 'member-' + Date.now() });

      const [user] = await db.insert(users).values({
        name: 'Regular Member',
        email: `member-${Date.now()}@test.com`,
      }).returning();

      // Act
      const [member] = await db.insert(teamMembers).values({
        tenantId: t1.id,
        userId: user.id,
        name: 'Regular Member',
        email: user.email!,
        role: 'member',
      }).returning();

      // Assert
      expect(member.role).toBe('member');
    });
  });

  describe('6.3 Validações de Segurança', () => {
    it('deve validar CPF único por tenant', async () => {
      // Arrange
      const t1 = await createTenant({ name: 'CPF Test', slug: 'cpf-' + Date.now() });

      await db.insert(members).values({
        tenantId: t1.id,
        type: 'afiliado',
        name: 'Primeiro',
        cpf: '55555555555',
        birthDate: '1980-01-01',
      });

      // Act & Assert
      await expect(
        db.insert(members).values({
          tenantId: t1.id,
          type: 'afiliado',
          name: 'Segundo',
          cpf: '55555555555',
          birthDate: '1990-01-01',
        })
      ).rejects.toThrow();
    });
  });
});
