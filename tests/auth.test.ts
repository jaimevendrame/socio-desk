import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { users, sessions, accounts, tenants, teamMembers } from '@/lib/db/schema';
import { createTenant, clearTestData } from '@/lib/test-helpers';
import { eq } from 'drizzle-orm';

describe('AUTENTICAÇÃO', () => {
  beforeEach(async () => {
    await clearTestData();
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('4.1 Registro de Novo Usuário', () => {
    it('deve criar usuário', async () => {
      // Act
      const [user] = await db.insert(users).values({
        name: 'Novo Usuario',
        email: `novo-${Date.now()}@email.com`,
        emailVerified: false,
      }).returning();

      // Assert
      expect(user.email).toBeDefined();
      expect(user.emailVerified).toBe(false);
    });

    it('deve criar múltiplos usuários', async () => {
      // Arrange & Act
      await db.insert(users).values({
        name: 'User 1',
        email: `user1-${Date.now()}@email.com`,
      });

      await db.insert(users).values({
        name: 'User 2',
        email: `user2-${Date.now()}@email.com`,
      });

      const result = await db.select().from(users);

      // Assert
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('4.2 Sessão', () => {
    it('deve criar teamMember vinculado ao usuário e tenant', async () => {
      // Arrange
      const tenant = await createTenant({ name: 'Auth Test', slug: 'auth-test-' + Date.now() });

      const [user] = await db.insert(users).values({
        name: 'Team User',
        email: `team-${Date.now()}@email.com`,
      }).returning();

      // Act
      const [member] = await db.insert(teamMembers).values({
        tenantId: tenant.id,
        userId: user.id,
        name: 'Team User',
        email: user.email!,
        role: 'member',
      }).returning();

      // Assert
      expect(member.userId).toBe(user.id);
      expect(member.tenantId).toBe(tenant.id);
      expect(member.role).toBe('member');
    });

    it('deve buscar teamMember por tenant', async () => {
      // Arrange
      const tenant = await createTenant({ name: 'Search Test', slug: 'search-' + Date.now() });

      const [user] = await db.insert(users).values({
        name: 'Search User',
        email: `search-${Date.now()}@email.com`,
      }).returning();

      await db.insert(teamMembers).values({
        tenantId: tenant.id,
        userId: user.id,
        name: 'Search User',
        email: user.email!,
        role: 'admin',
      });

      // Act
      const result = await db.select().from(teamMembers)
        .where(eq(teamMembers.tenantId, tenant.id));

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('admin');
    });
  });
});
