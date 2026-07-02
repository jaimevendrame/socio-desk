/**
 * Script para criar um Membro de tenant
 * Uso: npx tsx scripts/create-member.ts
 */
import { db } from '@/lib/db/client';
import { users, accounts, members } from '@/lib/db/schema';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function createMember() {
  const email = 'member@dev.com';
  const password = 'Member123!';
  const name = 'Membro Teste';
  const cpf = '12345678901';

  console.log('👤 Criando Membro...\n');

  // Buscar tenant dev
  const tenant = await db.query.tenants.findFirst({
    where: eq(require('@/lib/db/schema').tenants.slug, 'dev'),
  });

  if (!tenant) {
    console.error('❌ Tenant dev não encontrado');
    return;
  }

  console.log('📍 Usando tenant:', tenant.name);

  // Verificar se já existe
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    console.log('⚠️  Usuário já existe:', email);

    // Verificar se já tem member
    const existingMember = await db.query.members.findFirst({
      where: eq(members.email, email),
    });

    if (existingMember) {
      console.log('✅ Já é membro neste tenant');
      return;
    }

    // Criar member para usuário existente
    await db.insert(members).values({
      id: randomUUID(),
      tenantId: tenant.id,
      userId: existing.id,
      type: 'afiliado',
      status: 'ativo',
      name,
      email,
      cpf,
      birthDate: new Date('1990-01-01'),
    });
  } else {
    // Criar usuário
    const [user] = await db.insert(users).values({
      id: randomUUID(),
      name,
      email,
      emailVerified: true,
    }).returning();

    // Criar conta com senha
    const hash = await hashPassword(password);
    await db.insert(accounts).values({
      id: randomUUID(),
      userId: user.id,
      accountId: randomUUID(),
      providerId: 'credential',
      password: hash,
    });

    // Criar member
    await db.insert(members).values({
      id: randomUUID(),
      tenantId: tenant.id,
      userId: user.id,
      type: 'afiliado',
      status: 'ativo',
      name,
      email,
      cpf,
      birthDate: new Date('1990-01-01'),
    });

    console.log('✅ Usuário criado:', email);
    console.log('✅ Conta criada com senha');
  }

  console.log('✅ Member criado\n');
  console.log('═══════════════════════════════════════');
  console.log('🎉 Membro criado com sucesso!');
  console.log('═══════════════════════════════════════');
  console.log('\n📧 Email:', email);
  console.log('🔑 Senha:', password);
  console.log('👤 Role: membro');
  console.log('🌍 Tenant:', tenant.name);
  console.log('🔗 Acesso: /dashboard/*\n');
}

createMember().catch(console.error).finally(() => process.exit(0));
