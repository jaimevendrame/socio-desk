// Seed script - Creates mock data for development
import { db } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { hashPassword } from 'better-auth/crypto';
import type { InferSelectModel } from 'drizzle-orm';

// Type aliases for better readability
type Tenant = InferSelectModel<typeof schema.tenants>;
type Plan = InferSelectModel<typeof schema.plans>;
type Workplace = InferSelectModel<typeof schema.workplaces>;
type Space = InferSelectModel<typeof schema.spaces>;
type User = InferSelectModel<typeof schema.users>;
type Member = InferSelectModel<typeof schema.members>;

async function seed() {
  console.log('🌱 Starting seed...');

  // Create default tenant
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug: 'dev',
      name: 'Clube Exemplo Desenvolvimento',
      isActive: true,
      settings: {
        theme: 'light',
        timezone: 'America/Sao_Paulo',
      },
    })
    .returning() as [Tenant, never];

  console.log('✅ Created tenant:', tenant.name);

  // Create default plan
  const [plan] = await db
    .insert(schema.plans)
    .values({
      name: 'Profissional',
      tier: 'profissional',
      maxMembers: 500,
      priceMonthly: '99.00',
      priceYearly: '990.00',
      features: ['reservas', 'financeiro', 'relatorios', 'equipe'],
      isActive: true,
    })
    .returning() as [Plan, never];

  console.log('✅ Created plan:', plan.name);

  // Update tenant with plan
  await db
    .update(schema.tenants)
    .set({ planId: plan.id })
    .where(eq(schema.tenants.id, tenant.id));

  // Create tenant settings
  await db.insert(schema.tenantSettings).values({
    tenantId: tenant.id,
    emailNotificationsEnabled: true,
    whatsappNotificationsEnabled: false,
    gracePeriodDays: 5,
    minDebtForBlock: '0.01',
    autoBlockEnabled: true,
    defaultBufferMinutes: 15,
    primaryColor: '#1976D2',
  });

  console.log('✅ Created tenant settings');

  // Create workplaces
  const workplaces = await db
    .insert(schema.workplaces)
    .values([
      { tenantId: tenant.id, name: 'Secretaria de Educação', isActive: true },
      { tenantId: tenant.id, name: 'Prefeitura Municipal', isActive: true },
      { tenantId: tenant.id, name: 'Hospital Regional', isActive: true },
      { tenantId: tenant.id, name: 'Instituto Federal', isActive: true },
    ])
    .returning() as Workplace[];

  console.log('✅ Created workplaces');

  // Create spaces
  const spaces = await db
    .insert(schema.spaces)
    .values([
      {
        tenantId: tenant.id,
        name: 'Quadra Poliesportiva A',
        description: 'Quadra coberta para futsal, vôlei e basquete',
        category: 'esportivo',
        bufferMinutes: 15,
        minReservationMinutes: 60,
        maxReservationMinutes: 240,
        maxAdvanceDays: 30,
        openTime: '06:00',
        closeTime: '22:00',
        hasCost: true,
        costAmount: '50.00',
        isActive: true,
      },
      {
        tenantId: tenant.id,
        name: 'Quadra de Tênis',
        description: '2 quadras de tênis com iluminação',
        category: 'esportivo',
        bufferMinutes: 15,
        minReservationMinutes: 60,
        maxReservationMinutes: 120,
        maxAdvanceDays: 15,
        openTime: '06:00',
        closeTime: '22:00',
        hasCost: true,
        costAmount: '30.00',
        isActive: true,
      },
      {
        tenantId: tenant.id,
        name: 'Salão de Festas',
        description: 'Salão para eventos com capacidade para 150 pessoas',
        category: 'social',
        bufferMinutes: 30,
        minReservationMinutes: 180,
        maxReservationMinutes: 480,
        maxAdvanceDays: 90,
        openTime: '08:00',
        closeTime: '23:00',
        hasCost: true,
        costAmount: '300.00',
        isActive: true,
      },
      {
        tenantId: tenant.id,
        name: 'Sala de Jogos',
        description: 'Sinuca, pebolim e tavla',
        category: 'social',
        bufferMinutes: 0,
        minReservationMinutes: 30,
        maxReservationMinutes: 180,
        maxAdvanceDays: 7,
        openTime: '08:00',
        closeTime: '22:00',
        hasCost: false,
        isActive: true,
      },
      {
        tenantId: tenant.id,
        name: 'Churrasqueira 1',
        description: 'Churrasqueira com área verde',
        category: 'social',
        bufferMinutes: 30,
        minReservationMinutes: 180,
        maxReservationMinutes: 360,
        maxAdvanceDays: 30,
        openTime: '09:00',
        closeTime: '22:00',
        hasCost: true,
        costAmount: '80.00',
        isActive: true,
      },
      {
        tenantId: tenant.id,
        name: 'Piscina',
        description: 'Piscina semiolímpica com raia',
        category: 'esportivo',
        bufferMinutes: 15,
        minReservationMinutes: 60,
        maxReservationMinutes: 240,
        maxAdvanceDays: 30,
        openTime: '06:00',
        closeTime: '20:00',
        hasCost: true,
        costAmount: '25.00',
        isActive: true,
      },
    ])
    .returning() as Space[];

  console.log('✅ Created spaces');

  // Create demo user
  const passwordHash = await hashPassword('demo123');

  const [demoUser] = await db
    .insert(schema.users)
    .values({
      name: 'João Silva',
      email: 'joao@demo.com',
      emailVerified: true,
    })
    .returning() as [User, never];

  // Create account for demo user
  await db.insert(schema.accounts).values({
    id: 'demo-account',
    userId: demoUser.id,
    accountId: 'demo',
    providerId: 'credential',
    password: passwordHash,
  });

  console.log('✅ Created demo user: joao@demo.com / demo123');

  // Create team member for demo user
  await db.insert(schema.teamMembers).values({
    tenantId: tenant.id,
    userId: demoUser.id,
    role: 'admin',
    name: 'João Silva',
    email: 'joao@demo.com',
    isActive: true,
  });

  // Create member for demo user
  await db.insert(schema.members).values({
    tenantId: tenant.id,
    userId: demoUser.id,
    type: 'afiliado',
    status: 'ativo',
    name: 'João Silva',
    birthDate: '1990-05-10',
    civilState: 'solteiro',
    cpf: '000.000.000-00',
    email: 'joao@demo.com',
    phoneMobile: '(11) 99999-0000',
    admissionDate: '2024-01-01',
    jobTitle: 'Administrador',
  });
  const membersData = [
    {
      tenantId: tenant.id,
      userId: null,
      type: 'afiliado' as const,
      status: 'ativo' as const,
      name: 'Maria Oliveira',
      birthDate: '1985-03-15',
      civilState: 'casada',
      cpf: '123.456.789-00',
      email: 'maria.oliveira@email.com',
      phoneMobile: '(11) 98765-4321',
      workplaceId: workplaces[0].id,
      admissionDate: '2020-01-15',
      jobTitle: 'Professora',
    },
    {
      tenantId: tenant.id,
      userId: null,
      type: 'afiliado' as const,
      status: 'ativo' as const,
      name: 'Carlos Santos',
      birthDate: '1990-07-22',
      civilState: 'solteiro',
      cpf: '987.654.321-00',
      email: 'carlos.santos@email.com',
      phoneMobile: '(11) 91234-5678',
      workplaceId: workplaces[1].id,
      admissionDate: '2019-06-01',
      jobTitle: 'Analista',
    },
    {
      tenantId: tenant.id,
      userId: null,
      type: 'afiliado' as const,
      status: 'inadimplente' as const,
      name: 'Ana Costa',
      birthDate: '1988-11-30',
      civilState: 'casada',
      cpf: '456.789.123-00',
      email: 'ana.costa@email.com',
      phoneMobile: '(11) 99876-5432',
      workplaceId: workplaces[2].id,
      admissionDate: '2021-03-10',
      jobTitle: 'Enfermeira',
    },
    {
      tenantId: tenant.id,
      userId: null,
      type: 'convidado' as const,
      status: 'ativo' as const,
      name: 'Pedro Mendes',
      birthDate: '1992-04-18',
      civilState: 'solteiro',
      cpf: '321.654.987-00',
      email: 'pedro.mendes@email.com',
      phoneMobile: '(11) 95555-1234',
      admissionDate: '2022-08-20',
      jobTitle: 'Autônomo',
    },
    {
      tenantId: tenant.id,
      userId: null,
      type: 'afiliado' as const,
      status: 'ativo' as const,
      name: 'Juliana Ferreira',
      birthDate: '1995-09-05',
      civilState: 'solteira',
      cpf: '654.321.789-00',
      email: 'juliana.ferreira@email.com',
      phoneMobile: '(11) 94444-5678',
      workplaceId: workplaces[3].id,
      admissionDate: '2023-01-05',
      jobTitle: 'Técnica de Laboratório',
    },
  ];

  const members = await db.insert(schema.members).values(membersData).returning() as Member[];

  console.log('✅ Created members');

  // Create dependents for first member
  await db.insert(schema.dependents).values([
    {
      memberId: members[0].id,
      type: 'conjuge' as const,
      name: 'Roberto Oliveira',
      birthDate: '1983-08-20',
      status: 'ativo' as const,
    },
    {
      memberId: members[0].id,
      type: 'filho' as const,
      name: 'Lucas Oliveira',
      birthDate: '2010-12-10',
      status: 'ativo' as const,
    },
    {
      memberId: members[0].id,
      type: 'filho' as const,
      name: 'Sofia Oliveira',
      birthDate: '2015-05-25',
      status: 'ativo' as const,
    },
  ]);

  console.log('✅ Created dependents');

  // Create reservations
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const reservationsData = [
    {
      tenantId: tenant.id,
      spaceId: spaces[0].id, // Quadra A
      memberId: members[0].id,
      date: tomorrow.toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '16:00',
      status: 'confirmada' as const,
      notes: 'Jogo de vôlei com amigos',
      isRecurring: false,
      isPaid: false,
      amount: '50.00',
    },
    {
      tenantId: tenant.id,
      spaceId: spaces[1].id, // Tênis
      memberId: members[1].id,
      date: tomorrow.toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '10:00',
      status: 'confirmada' as const,
      isRecurring: true,
      recurringPattern: 'weekly',
      recurringUntil: nextWeek.toISOString().split('T')[0],
      isPaid: true,
      amount: '30.00',
    },
    {
      tenantId: tenant.id,
      spaceId: spaces[2].id, // Salão
      memberId: members[3].id,
      date: nextWeek.toISOString().split('T')[0],
      startTime: '19:00',
      endTime: '23:00',
      status: 'pendente' as const,
      notes: 'Aniversário de 30 anos',
      isRecurring: false,
      isPaid: false,
      amount: '300.00',
    },
    {
      tenantId: tenant.id,
      spaceId: spaces[4].id, // Churrasqueira
      memberId: members[4].id,
      date: nextWeek.toISOString().split('T')[0],
      startTime: '12:00',
      endTime: '18:00',
      status: 'confirmada' as const,
      isRecurring: false,
      isPaid: true,
      amount: '80.00',
    },
  ];

  await db.insert(schema.reservations).values(reservationsData);

  console.log('✅ Created reservations');

  // Create payments
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const paymentsData = [
    // Current month - paid
    {
      tenantId: tenant.id,
      memberId: members[0].id,
      description: 'Mensalidade Junho 2026',
      amount: '80.00',
      dueDate: currentMonth.toISOString().split('T')[0],
      paidDate: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().split('T')[0],
      status: 'paid' as const,
      paymentMethod: 'PIX',
    },
    // Current month - pending
    {
      tenantId: tenant.id,
      memberId: members[1].id,
      description: 'Mensalidade Junho 2026',
      amount: '80.00',
      dueDate: currentMonth.toISOString().split('T')[0],
      status: 'pending' as const,
    },
    // Current month - overdue
    {
      tenantId: tenant.id,
      memberId: members[2].id,
      description: 'Mensalidade Junho 2026',
      amount: '80.00',
      dueDate: currentMonth.toISOString().split('T')[0],
      status: 'overdue' as const,
    },
    // Last month - paid
    {
      tenantId: tenant.id,
      memberId: members[3].id,
      description: 'Mensalidade Maio 2026',
      amount: '120.00',
      dueDate: lastMonth.toISOString().split('T')[0],
      paidDate: new Date(today.getFullYear(), today.getMonth() - 1, 10).toISOString().split('T')[0],
      status: 'paid' as const,
      paymentMethod: 'Dinheiro',
    },
    // Next month - pending
    {
      tenantId: tenant.id,
      memberId: members[4].id,
      description: 'Mensalidade Julho 2026',
      amount: '80.00',
      dueDate: nextMonth.toISOString().split('T')[0],
      status: 'pending' as const,
    },
  ];

  await db.insert(schema.payments).values(paymentsData);

  console.log('✅ Created payments');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\nDemo credentials:');
  console.log('  Email: joao@demo.com');
  console.log('  Password: demo123');
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
