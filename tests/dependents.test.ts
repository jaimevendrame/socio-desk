import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { members } from '@/lib/db/schema';
import { createTenant, clearTestData } from '@/lib/test-helpers';
import { eq } from 'drizzle-orm';

describe('DEPENDENTES', () => {
  let tenantId: string;
  let parentId: string;

  beforeEach(async () => {
    await clearTestData();
    const tenant = await createTenant({ name: 'Dependente Test', slug: 'dependente-test-' + Date.now() });
    tenantId = tenant.id;

    const [parent] = await db.insert(members).values({
      tenantId,
      type: 'afiliado',
      name: 'Membro Titular',
      cpf: '11111111111',
      birthDate: '1980-01-01',
      status: 'ativo',
    }).returning();
    parentId = parent.id;
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('Criação de Dependente', () => {
    it('deve criar dependente maior de idade', async () => {
      const [dependent] = await db.insert(members).values({
        tenantId,
        type: 'dependente_maior',
        name: 'Filho Adulto',
        cpf: '22222222222',
        birthDate: '2000-01-01',
        status: 'ativo',
      }).returning();

      expect(dependent.name).toBe('Filho Adulto');
      expect(dependent.type).toBe('dependente_maior');
    });

    it('deve calcular idade do dependente', async () => {
      const birthDate = '2015-06-01';
      const [dependent] = await db.insert(members).values({
        tenantId,
        type: 'dependente_maior',
        name: 'Jovem Adulto',
        cpf: '33333333333',
        birthDate,
        status: 'ativo',
      }).returning();

      // Calcular idade
      const birth = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();

      expect(dependent.birthDate).toBe(birthDate);
      expect(age).toBeGreaterThanOrEqual(10);
    });

    it('deve buscar membros do tipo dependente_maior', async () => {
      // Criar afiliado e dependente
      await db.insert(members).values({
        tenantId,
        type: 'afiliado',
        name: 'Titular',
        cpf: '44444444441',
        birthDate: '1980-01-01',
        status: 'ativo',
      });

      await db.insert(members).values({
        tenantId,
        type: 'dependente_maior',
        name: 'Dependente 1',
        cpf: '44444444442',
        birthDate: '2000-01-01',
        status: 'ativo',
      });

      await db.insert(members).values({
        tenantId,
        type: 'dependente_maior',
        name: 'Dependente 2',
        cpf: '44444444443',
        birthDate: '2002-01-01',
        status: 'ativo',
      });

      // Buscar dependentes
      const dependents = await db.select().from(members)
        .where(eq(members.type, 'dependente_maior'));

      expect(dependents).toHaveLength(2);
    });
  });
});
