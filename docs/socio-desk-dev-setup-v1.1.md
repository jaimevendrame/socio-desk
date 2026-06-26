# ⚠️ ARQUIVO DESATUALIZADO — DUPLICADO

**⚠️ ESTE ARQUIVO ESTÁ DUPLICADO E DESATUALIZADO.**

O conteúdo correto e atualizado está em: **`docs/socio-desk-dev-setup.md`**

Por favor, use `docs/socio-desk-dev-setup.md` como referência.

---

## Resumo das Diferenças

| Item | dev-setup-v1.1.md | dev-setup.md (atual) |
|------|-------------------|----------------------|
| Next.js | 14+ | 16.2.9 |
| React | 18.x | 19.2.4 |
| Status | Desatualizado | Atualizado |

---

*Este arquivo será removido em uma futura limpeza de documentação.*

### Stack Definitive

| Camada | Tecnologia | Alternativa Prod |
|--------|------------|-----------------|
| **Frontend + Backend** | Next.js 14+ (App Router) | Coolify na VPS |
| **ORM** | Drizzle ORM | Igual em todos ambientes |
| **Auth** | Better Auth | Igual em todos ambientes |
| **Database** | PostgreSQL 16 | Postgres 16 self-hosted (Coolify) |
| **E-mail** | Brevo (Sendinblue) | Igual em todos ambientes |
| **Storage** | MinIO (local) | Backblaze B2 ou S3-compatible |
| **UI Components** | shadcn/ui + Radix UI | Igual em todos ambientes |
| **Gráficos** | Recharts | Igual em todos ambientes |
| **Drag & Drop** | @dnd-kit (opcional) | Igual em todos ambientes |
| **Ícones** | Lucide React | Igual em todos ambientes |
| **Deploy** | Coolify | Coolify na VPS |

### Stack Alternativa Removida

| Removido | Motivo |
|----------|--------|
| ~~Supabase Auth~~ | Lock-in; Better Auth é mais flexível |
| ~~Supabase Storage~~ | MinIO local + S3-compatible em prod |
| ~~Supabase Realtime~~ | SSE polling cobre MVP |
| ~~Vercel~~ | Coolify na VPS é mais controlável |
| ~~Resend~~ | Trocado por Brevo (mais adequado para SaaS brasileiro) |

---

## 2. Estrutura de Pastas do Projeto

```
socio-desk/
├── .env.local
├── .env.example
├── .env.production.example
│
├── docker-compose.yml
├── docker-compose.production.yml
│
├── drizzle/
│   ├── drizzle.config.ts
│   ├── migrations/
│   └── seed.ts
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── (office)/
│   │   ├── (admin)/
│   │   ├── (master)/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── layout/                 # Sidebar, Header, Footer
│   │   ├── reservations/           # Calendário, cards de reserva
│   │   ├── members/               # Forms, listas, detalhes
│   │   ├── dashboard/             # Cards de métricas
│   │   └── charts/                # Componentes Recharts
│   │
│   ├── lib/
│   │   ├── db/
│   │   ├── auth/
│   │   ├── storage/
│   │   ├── tenant/
│   │   ├── email/                  # Brevo integration
│   │   └── utils/
│   │
│   ├── hooks/
│   └── types/
│
├── tests/
├── scripts/
├── public/
│   └── legal/                     # Termos, LGPD
│
├── Dockerfile
├── Dockerfile.dev
├── .dockerignore
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── drizzle.config.ts
├── components.json
└── vitest.config.ts
```

---

## 3. Docker Compose — Desenvolvimento Local

### 3.1 docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: socio-desk-db
    environment:
      POSTGRES_DB: socio_desk
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev -d socio_desk"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    container_name: socio-desk-minio
    environment:
      MINIO_ROOT_USER: minio_admin
      MINIO_ROOT_PASSWORD: minio_password
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  minio-setup:
    image: minio/mc:latest
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 minio_admin minio_password;
      mc mb local/socio-desk-photos --ignore-existing;
      mc anonymous set download local/socio-desk-photos;
      exit 0;
      "
    restart: "no"

volumes:
  postgres_data:
    driver: local
  minio_data:
    driver: local

networks:
  default:
    name: socio-desk-network
```

### 3.2 Comandos de Setup

```bash
# Na raiz do projeto

# 1. Subir os serviços
docker compose up -d

# 2. Verificar se subiram
docker compose ps

# 3. Testar conexão com banco
docker compose exec postgres psql -U dev -d socio_desk -c "SELECT 1;"

# 4. Abrir MinIO Console (opcional)
# http://localhost:9001
# Login: minio_admin / minio_password
```

---

## 4. Drizzle ORM — Schema do Banco

### 4.1 Schema Completo

```typescript
// src/lib/db/schema.ts

import { pgTable, uuid, varchar, text, timestamp, date, time, boolean, integer, decimal, jsonb, pgEnum, foreignKey, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const memberTypeEnum = pgEnum('member_type', ['afiliado', 'convidado', 'dependente_maior']);
export const dependentTypeEnum = pgEnum('dependent_type', ['conjuge', 'filho', 'enteado', 'pais', 'irmao', 'outro']);
export const dependentStatusEnum = pgEnum('dependent_status', ['ativo', 'inativo', 'migrado']);
export const memberStatusEnum = pgEnum('member_status', ['ativo', 'inadimplente', 'suspenso', 'cancelado']);
export const reservationStatusEnum = pgEnum('reservation_status', ['pendente', 'confirmada', 'cancelada', 'concluida']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'overdue', 'cancelled']);
export const userRoleEnum = pgEnum('user_role', ['admin_master', 'admin', 'team', 'member']);
export const planTierEnum = pgEnum('plan_tier', ['basico', 'profissional', 'enterprise']);
export const spaceCategoryEnum = pgEnum('space_category', ['esportivo', 'social', 'equipamento']);
export const documentTypeEnum = pgEnum('document_type', ['rg', 'cpf', 'passaporte']);

// ============================================
// TENANT
// ============================================

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 63 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  planId: uuid('plan_id').references(() => plans.id),
  customDomain: varchar('custom_domain', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  settings: jsonb('settings').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('idx_tenants_slug').on(table.slug),
}));

// ============================================
// PLANOS
// ============================================

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  tier: planTierEnum('tier').notNull(),
  maxMembers: integer('max_members').notNull(),
  priceMonthly: decimal('price_monthly', { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal('price_yearly', { precision: 10, scale: 2 }).notNull(),
  features: jsonb('features').default([]).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// MEMBROS DA EQUIPE (admin, team)
// ============================================

export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: userRoleEnum('role').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantUserIdx: unique('idx_team_member_tenant_user').on(table.tenantId, table.userId),
  tenantIdx: index('idx_team_members_tenant').on(table.tenantId),
}));

// ============================================
// ASSOCIADOS (MEMBERS)
// ============================================

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  type: memberTypeEnum('type').notNull(),
  status: memberStatusEnum('status').default('ativo').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  birthDate: date('birth_date').notNull(),
  civilState: varchar('civil_state', { length: 50 }),
  documentType: documentTypeEnum('document_type'),
  documentNumber: varchar('document_number', { length: 50 }),
  cpf: varchar('cpf', { length: 14 }).notNull(),
  addressStreet: varchar('address_street', { length: 255 }),
  addressNumber: varchar('address_number', { length: 20 }),
  addressComplement: varchar('address_complement', { length: 100 }),
  addressDistrict: varchar('address_district', { length: 100 }),
  addressZipCode: varchar('address_zip_code', { length: 10 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressState: varchar('address_state', { length: 2 }),
  phoneHome: varchar('phone_home', { length: 20 }),
  phoneMobile: varchar('phone_mobile', { length: 20 }),
  phoneMessage: varchar('phone_message', { length: 20 }),
  email: varchar('email', { length: 255 }),
  photoUrl: varchar('photo_url', { length: 500 }),
  workplaceId: uuid('workplace_id').references(() => workplaces.id),
  registrationNumber: varchar('registration_number', { length: 50 }),
  admissionDate: date('admission_date'),
  jobTitle: varchar('job_title', { length: 100 }),
  phoneWork: varchar('phone_work', { length: 20 }),
  dependentId: uuid('dependent_id'),
  parentMemberId: uuid('parent_member_id').references(() => members.id),
  isBillable: boolean('is_billable').default(false),
  migratedAt: timestamp('migrated_at'),
  blockedAt: timestamp('blocked_at'),
  blockReason: text('block_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_members_tenant').on(table.tenantId),
  cpfTenantIdx: unique('idx_members_cpf_tenant').on(table.tenantId, table.cpf),
  userIdx: index('idx_members_user').on(table.userId),
}));

// ============================================
// DEPENDENTES
// ============================================

export const dependents = pgTable('dependents', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  type: dependentTypeEnum('type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  birthDate: date('birth_date').notNull(),
  documentType: documentTypeEnum('document_type'),
  documentNumber: varchar('document_number', { length: 50 }),
  photoUrl: varchar('photo_url', { length: 500 }),
  status: dependentStatusEnum('status').default('ativo').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  memberIdx: index('idx_dependents_member').on(table.memberId),
  memberDocIdx: unique('idx_dependents_member_doc').on(table.memberId, table.documentType, table.documentNumber),
}));

// ============================================
// LOCAIS DE TRABALHO
// ============================================

export const workplaces = pgTable('workplaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_workplaces_tenant').on(table.tenantId),
}));

// ============================================
// ESPAÇOS
// ============================================

export const spaces = pgTable('spaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: spaceCategoryEnum('category').notNull(),
  photoUrl: varchar('photo_url', { length: 500 }),
  bufferMinutes: integer('buffer_minutes').default(15).notNull(),
  minReservationMinutes: integer('min_reservation_minutes').default(30).notNull(),
  maxReservationMinutes: integer('max_reservation_minutes').default(480).notNull(),
  maxAdvanceDays: integer('max_advance_days').default(30).notNull(),
  maxReservationsPerDay: integer('max_reservations_per_day'),
  openTime: time('open_time').notNull().default('06:00'),
  closeTime: time('close_time').notNull().default('22:00'),
  hasCost: boolean('has_cost').default(false).notNull(),
  costAmount: decimal('cost_amount', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_spaces_tenant').on(table.tenantId),
}));

// ============================================
// RESERVAS
// ============================================

export const reservations = pgTable('reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  spaceId: uuid('space_id').references(() => spaces.id).notNull(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  teamMemberId: uuid('team_member_id').references(() => teamMembers.id),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  status: reservationStatusEnum('status').default('pendente').notNull(),
  notes: text('notes'),
  isRecurring: boolean('is_recurring').default(false).notNull(),
  recurringPattern: varchar('recurring_pattern', { length: 20 }),
  recurringUntil: date('recurring_until'),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  isPaid: boolean('is_paid').default(false).notNull(),
  cancelledAt: timestamp('cancelled_at'),
  cancelledBy: uuid('cancelled_by').references(() => teamMembers.id),
  cancelReason: text('cancel_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_reservations_tenant').on(table.tenantId),
  spaceDateIdx: index('idx_reservations_space_date').on(table.spaceId, table.date),
  memberIdx: index('idx_reservations_member').on(table.memberId),
  dateIdx: index('idx_reservations_date').on(table.date),
}));

// ============================================
// PAGAMENTOS / MENSALIDADES
// ============================================

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  dueDate: date('due_date').notNull(),
  paidDate: date('paid_date'),
  status: paymentStatusEnum('status').default('pending').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  receivedBy: uuid('received_by').references(() => teamMembers.id),
  receivedAt: timestamp('received_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_payments_tenant').on(table.tenantId),
  memberIdx: index('idx_payments_member').on(table.memberId),
  dueDateIdx: index('idx_payments_due_date').on(table.dueDate),
}));

// ============================================
// CONFIGURAÇÕES DO TENANT
// ============================================

export const tenantSettings = pgTable('tenant_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull().unique(),
  emailNotificationsEnabled: boolean('email_notifications_enabled').default(true).notNull(),
  whatsappNotificationsEnabled: boolean('whatsapp_notifications_enabled').default(false).notNull(),
  gracePeriodDays: integer('grace_period_days').default(5).notNull(),
  minDebtForBlock: decimal('min_debt_for_block', { precision: 10, scale: 2 }).default('0.01').notNull(),
  autoBlockEnabled: boolean('auto_block_enabled').default(true).notNull(),
  defaultBufferMinutes: integer('default_buffer_minutes').default(15).notNull(),
  logoUrl: varchar('logo_url', { length: 500 }),
  primaryColor: varchar('primary_color', { length: 7 }).default('#1976D2'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// USERS (Better Auth)
// ============================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique().notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: varchar('image', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  ipAddress: varchar('ip_address', { length: 100 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verifications = pgTable('verifications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// LOG DE AUDITORIA
// ============================================

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  userId: uuid('user_id').references(() => users.id),
  teamMemberId: uuid('team_member_id').references(() => teamMembers.id),
  action: varchar('action', { length: 100 }).notNull(),
  entity: varchar('entity', { length: 100 }).notNull(),
  entityId: uuid('entity_id'),
  changes: jsonb('changes').default({}).notNull(),
  ipAddress: varchar('ip_address', { length: 100 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_audit_logs_tenant').on(table.tenantId),
  userIdx: index('idx_audit_logs_user').on(table.userId),
  createdAtIdx: index('idx_audit_logs_created').on(table.createdAt),
}));

// ============================================
// RELATIONS
// ============================================

export const tenantsRelations = relations(tenants, ({ many, one }) => ({
  members: many(members),
  teamMembers: many(teamMembers),
  spaces: many(spaces),
  reservations: many(reservations),
  payments: many(payments),
  workplaces: many(workplaces),
  settings: one(tenantSettings),
  plan: one(plans, { fields: [tenants.planId], references: [plans.id] }),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  tenant: one(tenants, { fields: [members.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [members.userId], references: [users.id] }),
  workplace: one(workplaces, { fields: [members.workplaceId], references: [workplaces.id] }),
  parent: one(members, { fields: [members.parentMemberId], references: [members.id], relationName: 'parentChild' }),
  dependents: many(dependents, { relationName: 'parentChild' }),
  reservations: many(reservations),
  payments: many(payments),
  teamRole: one(teamMembers),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  tenant: one(tenants, { fields: [reservations.tenantId], references: [tenants.id] }),
  space: one(spaces, { fields: [reservations.spaceId], references: [spaces.id] }),
  member: one(members, { fields: [reservations.memberId], references: [members.id] }),
  createdBy: one(teamMembers, { fields: [reservations.teamMemberId], references: [teamMembers.id] }),
}));
```

### 4.2 Conexão com o Banco

```typescript
// src/lib/db/client.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

function createPool() {
  if (!globalForDb.pool) {
    globalForDb.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return globalForDb.pool;
}

export const db = drizzle(createPool(), { schema });
```

---

## 5. Better Auth — Configuração

```typescript
// src/lib/auth/index.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendEmailVerification: async ({ user, url }) => {
      const { sendEmail } = await import('@/lib/email');
      await sendEmail({
        to: user.email!,
        subject: 'Confirme seu e-mail - Socio Desk',
        html: `<p>Clique para confirmar: <a href="${url}">${url}</a></p>`,
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  advanced: {
    generateId: () => crypto.randomUUID(),
  },
});

export type Session = typeof auth.$Infer.Session;
```

---

## 6. Brevo — Configuração de E-mail

### 6.1 Instalação

```bash
npm install sib-api-v3-sdk
```

### 6.2 Client

```typescript
// src/lib/email/index.ts
import { TransactionalEmailsApi, SendSmtpEmail } from 'sib-api-v3-sdk';

// Inicializa o cliente
const apiInstance = new TransactionalEmailsApi();

// Configura API key (pode ser setada via env ou no constructor)
apiInstance.setApiKey(
  TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    name: string;
    url: string;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const sendSmtpEmail = new SendSmtpEmail();
  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.html;
  sendSmtpEmail.textContent = options.text || options.html.replace(/<[^>]*>/g, '');

  // To pode ser array de objetos com nome
  if (Array.isArray(options.to)) {
    sendSmtpEmail.to = options.to.map((email) => ({
      email: email.includes('@') ? email : email,
      name: !email.includes('@') ? email : undefined,
    }));
  } else {
    sendSmtpEmail.to = [{ email: options.to }];
  }

  sendSmtpEmail.sender = {
    email: process.env.EMAIL_FROM!,
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Socio Desk',
  };

  if (options.replyTo) {
    sendSmtpEmail.replyTo = { email: options.replyTo };
  }

  if (options.attachments) {
    sendSmtpEmail.attachment = options.attachments.map((att) => ({
      url: att.url,
      name: att.name,
    }));
  }

  await apiInstance.sendTransacEmail(sendSmtpEmail);
}

// ============================================
// TEMPLATES DE E-MAIL
// ============================================

export const emailTemplates = {
  reservationConfirmation: (data: {
    memberName: string;
    spaceName: string;
    date: string;
    time: string;
    tenantName: string;
  }) => ({
    subject: `Reserva confirmada - ${data.spaceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976D2;">Reserva Confirmada</h2>
        <p>Olá, ${data.memberName}!</p>
        <p>Sua reserva foi confirmada:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Espaço:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.spaceName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Data:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Horário:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.time}</td>
          </tr>
        </table>
        <p>Atenciosamente,<br>${data.tenantName}</p>
      </div>
    `,
  }),

  paymentReminder: (data: {
    memberName: string;
    amount: string;
    dueDate: string;
    tenantName: string;
  }) => ({
    subject: `Lembrete de pagamento - Vencimento em ${data.dueDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9800;">Lembrete de Pagamento</h2>
        <p>Olá, ${data.memberName}!</p>
        <p>Você tem uma mensalidade pendente:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Valor:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.amount}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Vencimento:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.dueDate}</td>
          </tr>
        </table>
        <p style="color: #d32f2f;"><strong>Após o vencimento, seu acesso às reservas será bloqueado.</strong></p>
        <p>Atenciosamente,<br>${data.tenantName}</p>
      </div>
    `,
  }),

  accountBlocked: (data: {
    memberName: string;
    reason: string;
    tenantName: string;
  }) => ({
    subject: 'Conta bloqueada - Regularize sua situação',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Conta Bloqueada</h2>
        <p>Olá, ${data.memberName}!</p>
        <p>Sua conta foi bloqueada temporariamente:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Motivo:</strong> ${data.reason}</p>
        </div>
        <p>Para desbloquear, regularize sua situação no escritório da associação.</p>
        <p>Atenciosamente,<br>${data.tenantName}</p>
      </div>
    `,
  }),
};
```

### 6.3 Por que Brevo (não Resend)

| Critério | Brevo | Resend |
|----------|-------|--------|
| Plano gratuito | 300 emails/dia (9.000/mês) | 3.000 emails/mês |
| SMS | Incluso no plano pago | Não |
| WhatsApp API | Integrado | Não |
| Interface | Em português | Inglês |
| Servidores | Brasil | EUA |
| Templates | Drag-and-drop | Código |
| Custo brasileiro | Mais competitivo | Padrão internacional |

---

## 7. Recharts — Componentes de Gráficos

### 7.1 Instalação

```bash
npm install recharts
```

### 7.2 Componentes

```typescript
// src/components/charts/reservation-stats.tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#1976D2', '#4CAF50', '#FF9800', '#F44336'];

// Gráfico de barras: Reservas por dia da semana
export function ReservationsByDayChart({ data }: { data: Array<{ day: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#1976D2" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Gráfico de pizza: Distribuição por espaço
export function SpaceDistributionChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Gráfico de linha: Tendência de ocupação
export function OccupancyTrendChart({ data }: { data: Array<{ date: string; rate: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} unit="%" />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="#1976D2"
          strokeWidth={2}
          dot={{ fill: '#1976D2' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Card de métrica simples
export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-sm mt-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? '+' : ''}{trend.value}% vs. semana anterior
            </p>
          )}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}
```

### 7.3 Uso no Dashboard

```typescript
// src/app/(office)/escritorio/page.tsx
'use client';

import { MetricCard } from '@/components/charts/reservation-stats';
import { ReservationsByDayChart, SpaceDistributionChart, OccupancyTrendChart } from '@/components/charts/reservation-stats';
import { Calendar, Users, AlertTriangle, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const reservationsData = [
    { day: 'Seg', count: 12 },
    { day: 'Ter', count: 8 },
    { day: 'Qua', count: 15 },
    { day: 'Qui', count: 10 },
    { day: 'Sex', count: 18 },
    { day: 'Sáb', count: 25 },
    { day: 'Dom', count: 8 },
  ];

  const spaceData = [
    { name: 'Quadra', value: 45 },
    { name: 'Salão', value: 30 },
    { name: 'Sinuca', value: 15 },
    { name: 'Outros', value: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Reservas Hoje"
          value={23}
          icon={<Calendar className="w-6 h-6" />}
        />
        <MetricCard
          title="Associados Ativos"
          value={487}
          subtitle="de 500"
          icon={<Users className="w-6 h-6" />}
        />
        <MetricCard
          title="Taxa Ocupação"
          value="78%"
          trend={{ value: 5, positive: true }}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <MetricCard
          title="Inadimplentes"
          value={12}
          subtitle="R$ 2.450 pendente"
          icon={<AlertTriangle className="w-6 h-6" />}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Reservas por Dia</h3>
          <ReservationsByDayChart data={reservationsData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Uso por Espaço</h3>
          <SpaceDistributionChart data={spaceData} />
        </div>
      </div>
    </div>
  );
}
```

---

## 8. @dnd-kit — Drag and Drop (Opcional)

### 8.1 Quando usar

| Cenário | Usar @dnd-kit? | Alternativa |
|---------|----------------|-------------|
| Calendário de reservas com drag para remarcar | Sim | — |
| Lista de associados ordenável | Não (MVP) | shadcn Table com sort |
| Kanban de status de reservas | Não (MVP) | Cards empilhados |
| Upload de fotos com drag | Não | Input file padrão |

### 8.2 Instalação (descomentar se necessário)

```bash
# Descomentar se o MVP precisar de drag-and-drop no calendário
# npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 8.3 Exemplo: Calendário de Reservas

```typescript
// src/components/reservations/reservation-calendar-dnd.tsx
// ATENÇÃO: Este código é um rascunho. Descomentar dependências antes de usar.

/*
'use client';

import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { useState } from 'react';

interface ReservationItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  color: string;
}

export function ReservationCalendar() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Lógica de reordenar/remarcar
      console.log(`Mover reserva ${active.id} para slot ${over.id}`);
    }

    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-8 gap-2">
        {slots.map((slot) => (
          <TimeSlot key={slot.id} id={slot.id}>
            {slot.reservation && <ReservationCard reservation={slot.reservation} />}
          </TimeSlot>
        ))}
      </div>

      <DragOverlay>
        {activeId ? <ReservationCard reservation={getReservation(activeId)} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
*/
```

---

## 9. Variáveis de Ambiente

### 9.1 .env.example (Desenvolvimento)

```bash
# ===========================================
# DATABASE
# ===========================================
DATABASE_URL="postgresql://dev:dev_password@localhost:5432/socio_desk"

# ===========================================
# AUTH
# ===========================================
AUTH_SECRET="gerar-com-openssl-rand-base64-32"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ===========================================
# STORAGE (MinIO local)
# ===========================================
S3_ENDPOINT="http://localhost:9000"
S3_REGION="us-east-1"
S3_ACCESS_KEY="minio_admin"
S3_SECRET_KEY="minio_password"
S3_BUCKET="socio-desk-photos"
S3_PUBLIC_URL="http://localhost:9000/socio-desk-photos"

# ===========================================
# E-MAIL (Brevo)
# ===========================================
BREVO_API_KEY=""
EMAIL_FROM="noreply@sociodesk.com.br"
NEXT_PUBLIC_APP_NAME="Socio Desk"

# ===========================================
# APP
# ===========================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ===========================================
# TENANT
# ===========================================
DEFAULT_TENANT_SLUG="dev"
```

### 9.2 .env.production.example

```bash
# ===========================================
# DATABASE (Produção)
# ===========================================
DATABASE_URL="postgresql://user:pass@seu-vps:5432/socio_desk"

# ===========================================
# AUTH
# ===========================================
AUTH_SECRET="<gerar-com-openssl-rand-base64-32>"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ===========================================
# STORAGE (Backblaze B2 ou S3)
# ===========================================
S3_ENDPOINT="https://s3.us-east-005.backblazeb2.com"
S3_REGION="us-east-005"
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_BUCKET="socio-desk-photos"
S3_PUBLIC_URL="https://f001.backblazeb2.com/file/socio-desk-photos"

# ===========================================
# E-MAIL (Brevo)
# ===========================================
BREVO_API_KEY=""
EMAIL_FROM="noreply@seudominio.com.br"

# ===========================================
# APP
# ===========================================
NEXT_PUBLIC_APP_URL="https://seudominio.com.br"
NEXT_PUBLIC_APP_NAME="Socio Desk"
```

### 9.3 Como gerar AUTH_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 9.4 .gitignore

```
.env
.env.local
.env.*.local

*.db
*.db-journal

minio/

drizzle/migrations/*.sql

*.log
npm-debug.log*

.DS_Store
Thumbs.db
```

---

## 10. package.json — Dependências Completas

```json
{
  "name": "socio-desk",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",

    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx scripts/db/seed.ts",
    "db:reset": "drizzle-kit push --force && tsx scripts/db/seed.ts",

    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:restart": "docker compose restart",
    "docker:logs": "docker compose logs -f",

    "test": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  },

  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",

    "drizzle-orm": "^0.30.0",
    "better-auth": "^1.0.0",
    "pg": "^8.11.0",

    "@aws-sdk/client-s3": "^3.500.0",
    "sib-api-v3-sdk": "^10.0.0",

    "recharts": "^2.12.0",

    "zod": "^3.22.0",
    "date-fns": "^3.3.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "class-variance-authority": "^0.7.0",

    "lucide-react": "^0.350.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-table": "^1.0.2",
    "tailwindcss-animate": "^1.0.7",

    "@hookform/resolvers": "^3.3.0",
    "react-hook-form": "^7.50.0",

    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  },

  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/pg": "^8.11.0",

    "drizzle-kit": "^0.20.0",

    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",

    "vitest": "^1.3.0",
    "@playwright/test": "^1.41.0",
    "tsx": "^4.7.0",

    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.0"
  }
}
```

### 9.5 Instalação das Dependências UI (shadcn/ui)

```bash
# 1. Inicializar shadcn/ui
npx shadcn-ui@latest init

# 2. Adicionar componentes necessários
npx shadcn-ui@latest add button card input label select
npx shadcn-ui@latest add table dialog dropdown-menu toast
npx shadcn-ui@latest add avatar checkbox form tabs
npx shadcn-ui@latest add badge calendar command popover
npx shadcn-ui@latest add sheet skeleton switch

# 3. Componentes opcionais (descomentar se usar dnd-kit)
# npx shadcn-ui@latest add sortable
```

---

## 11. Deploy com Coolify

### 11.1 Dockerfile

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

```javascript
// next.config.js
const nextConfig = {
  output: 'standalone',
};

module.exports = nextConfig;
```

### 11.2 docker-compose.production.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: socio-desk-app
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      AUTH_SECRET: ${AUTH_SECRET}
      BREVO_API_KEY: ${BREVO_API_KEY}
      EMAIL_FROM: ${EMAIL_FROM}
      S3_ENDPOINT: ${S3_ENDPOINT}
      S3_ACCESS_KEY: ${S3_ACCESS_KEY}
      S3_SECRET_KEY: ${S3_SECRET_KEY}
      S3_BUCKET: ${S3_BUCKET}
      S3_PUBLIC_URL: ${S3_PUBLIC_URL}
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:16-alpine
    container_name: socio-desk-db-prod
    restart: always
    environment:
      POSTGRES_DB: socio_desk
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d socio_desk"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_prod_data:
```

---

## 12. Checklist de Setup

### Dia 1

- [ ] Instalar Docker Desktop
- [ ] Criar `.env.local`
- [ ] `docker compose up -d`
- [ ] `npm install`
- [ ] `npx shadcn-ui@latest init`
- [ ] `npm run db:push`
- [ ] `npm run db:seed`
- [ ] `npm run dev`
- [ ] Testar login em http://localhost:3000

### VS Code — Extensões Recomendadas

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- PostgreSQL (vscode-sql-postgresql)
- Drizzle (se disponível)
- Error Lens
- Thunder Client (alternativa ao Postman)

---

## 14. Claude Code — Templates e Agents

### 14.1 O que são

Claude Code Templates são scaffolds pré-configurados que geram estrutura de projeto com opinions integradas. Agents são assistentes especializados para tarefas específicas dentro do fluxo de desenvolvimento.

**Importante:** Esses templates servem como **referência e inspiração**, não como verdade absoluta. O Socio Desk tem contexto específico (multi-tenant, LGPD brasileiro, domínio de associações recreivas) que pode divergir dos templates genéricos.

### 14.2 Templates Disponíveis

| Template | Comando | O que gera | Usar no Socio Desk? |
|----------|---------|-----------|---------------------|
| Micro SaaS Launcher | `npx claude-code-templates@latest --skill business-marketing/micro-saas-launcher` | Scaffold SaaS com billing, auth, landing page | **Referência** — adaptar estrutura de pastas e patterns |
| Frontend Design | `npx claude-code-templates@latest --skill creative-design/frontend-design` | Design system, componentes, tokens | **Referência** — já temos tokens no standards.md |
| Security Audit | `npx claude-code-templates@latest --skill security/security-audit` | Checklist, scripts de audit, headers | **Incorporar** — adicionar ao nosso checklist |

### 14.3 Agents Disponíveis

| Agent | Comando | Uso |
|-------|---------|-----|
| Code Reviewer | `npx claude-code-templates@latest --agent development-tools/code-reviewer` | Review automatizado de PRs |
| Explore | `npx claude-code-templates@latest --agent development-tools/explore` | Análise de código existente |
| Plan | `npx claude-code-templates@latest --agent development-tools/plan` | Planejamento arquitetural |

### 14.4 Instalação do Claude Code CLI

```bash
# 1. Instalar Claude Code CLI globalmente
npm install -g @anthropic-ai/claude-code

# 2. Verificar instalação
claude --version

# 3. Listar templates disponíveis
claude templates list

# 4. Listar agents disponíveis
claude agents list
```

### 14.5 Instalação da Extensão VS Code

```bash
# Opção 1: Via terminal
code --install-extension anthropic.claude-code

# Opção 2: Pesquisar "Claude" na marketplace do VS Code
# Extensão: Claude for Code
```

### 14.6 Uso durante desenvolvimento

```bash
# Baixar scaffold de Micro SaaS para referência
# (gera em uma pasta separada, não sobrescreve o projeto)
npx claude-code-templates@latest --skill business-marketing/micro-saas-launcher

# Baixar scaffold de Frontend Design para referência
npx claude-code-templates@latest --skill creative-design/frontend-design

# Baixar scaffold de Security Audit para referência
npx claude-code-templates@latest --skill security/security-audit

# Iniciar Code Review Agent (modo interativo)
npx claude-code-templates@latest --agent development-tools/code-reviewer
```

### 14.7 Fluxo de Trabalho Recomendado

```
ANTES DE COPIAR DO TEMPLATE:
┌─────────────────────────────────────────────────────────────┐
│  1. Execute o template para gerar scaffold em pasta temporária │
│  2. Analise as decisões de design do template                │
│  3. Compare com nossos documentos (PRD, SPEC, standards)      │
│  4. Adapte o que faz sentido para o contexto do Socio Desk   │
│  5. Descarte o que não se aplica                             │
└─────────────────────────────────────────────────────────────┘

CHECKLIST DE ADAPTAÇÃO:

Design System:
[ ] Tokens de cor — comparar com os nossos em standards.md
[ ] Componentes — verificar se shadcn/ui cobre
[ ] Tipografia — Inter já está nos nossos tokens
[ ] Responsividade — já temos breakpoints definidos

Segurança:
[ ] Headers CSP — comparar com nosso middleware
[ ] Rate limiting — temos implementação?
[ ] Validação de input — Zod já cobre
[ ] Logs — temos logger estruturado

Code Review:
[ ] Checklist de PR — temos em standards.md
[ ] Critérios de merge — temos em standards.md
[ ] Conventional commits — temos padrão definido

Micro SaaS Patterns:
[ ] Billing — MVP não tem, Fase 3
[ ] Landing page — fora do escopo MVP
[ ] Onboarding — temos spec complementar
[ ] Auth — Better Auth já configurado
```

### 14.8 Quando NÃO usar os templates

| Situação | Motivo |
|----------|--------|
| Estrutura de pastas | Já definida em dev-setup.md |
| Design system | Já definido em standards.md |
| Schema de banco | Já definido em dev-setup.md |
| Auth | Better Auth já configurado |
| Multi-tenant | Já especificado na spec complementar |
| LGPD | Já coberto na spec complementar |

### 14.9 Integração com VS Code

Após instalar a extensão, você terá:

- **Inline suggestions** — Claude sugere código inline
- **Terminal integrado** — Execute templates sem sair do VS Code
- **Chat lateral** — Converse com Claude sobre seu código
- **Code Review** — Peça review de arquivos selecionados

```
atalhos úteis (após instalar extensão):
- Ctrl+Shift+M: Abrir chat com Claude
- Ctrl+Shift+L: Selection for Claude
- Ctrl+Shift+K: Editar com Claude
```

---

## 15. Plano de Execução em Milestones

### 15.1 Visão Geral

O desenvolvimento do MVP é dividido em **6 milestones**, cada uma com sua branch dedicada, entregas específicas e commit final. Esta estrutura permite:

- **Feedback rápido** — Interface visual já na M2 (mesmo sem backend)
- **Rollback seguro** — Cada milestone é independente
- **Validação incremental** — Teste por milestone, não no final
- **Motivação** — Celebração a cada merge

### 15.2 Estrutura de Branches

```
main
├── m1-foundation          (setup + DB + Auth + Layout)
├── m2-interface-core     (UI com mock data)
├── m3-backend-essentials  (Spaces + Members)
├── m4-reservations       (Reservas + Conflitos)
├── m5-financeiro         (Pagamentos + Dashboard)
└── m6-polish-deploy      (Email + Security + Deploy)
```

### 15.3 Resumo por Milestone

| Milestone | Branch | Duração | Objetivo |
|-----------|--------|---------|----------|
| **M1** | `m1-foundation` | 1-2 sem | Infraestrutura funcional |
| **M2** | `m2-interface-core` | 2 sem | UI completa com mock data |
| **M3** | `m3-backend-essentials` | 2 sem | Espaços e Membros funcionais |
| **M4** | `m4-reservations` | 2-3 sem | Sistema de reservas (core) |
| **M5** | `m5-financeiro` | 1-2 sem | Financeiro e relatórios |
| **M6** | `m6-polish-deploy` | 1-2 sem | Pronto para produção |

**Total estimado: 9-13 semanas (2-3 meses)**

---

### 15.4 M1 — Foundation

**Branch:** `m1-foundation`
**Duração:** 1-2 semanas
**Objetivo:** Infraestrutura funcionando (pode rodar localmente)

#### Entregas

```
[ ] Projeto Next.js 14 com App Router
[ ] Docker Compose (Postgres + MinIO)
[ ] Drizzle ORM configurado com schema completo
[ ] Better Auth configurado (email/password)
[ ] Layout base (sidebar, header, footer)
[ ] Auth pages (login, register, forgot-password)
[ ] Middleware de proteção de rotas
[ ] Design tokens configurados (colors, typography)
[ ] .env.local configurado
[ ] Script de seed com dados de exemplo
[ ] README.md com instruções de setup
```

#### Commit Final

```bash
git add .
git commit -m "chore(m1): foundation completo - setup, DB, auth, layout base"
git checkout main
git merge m1-foundation
git branch -d m1-foundation
```

---

### 15.5 M2 — Interface Core

**Branch:** `m2-interface-core`
**Duração:** 2 semanas
**Objetivo:** Toda a UI do MVP com dados mockados (funcional visualmente)

#### Entregas

```
[ ] shadcn/ui instalado e configurado
[ ] Componentes base (Button, Card, Input, Table, Dialog, etc)
[ ] Páginas do Associado
    [ ] /dashboard
    [ ] /reservar
    [ ] /reservas
    [ ] /perfil
[ ] Páginas do Escritório
    [ ] /escritorio (dashboard)
    [ ] /escritorio/associados
    [ ] /escritorio/associados/novo
    [ ] /escritorio/reservas
    [ ] /escritorio/reservas/nova
    [ ] /escritorio/espacos
    [ ] /escritorio/financeiro
[ ] Páginas do Admin
    [ ] /admin
    [ ] /admin/config
    [ ] /admin/equipe
    [ ] /admin/relatorios
[ ] Páginas do Master
    [ ] /master
    [ ] /master/tenants
    [ ] /master/planos
[ ] Mock data para todas as páginas
[ ] Calendário visual de reservas (sem backend)
[ ] Forms com validação Zod (mock submit)
[ ] Recharts configurado com dados estáticos
[ ] Metric cards com mock data
```

#### Commit Final

```bash
git add .
git commit -m "feat(m2): interface core completa com mock data"
git checkout main
git merge m2-interface-core
git branch -d m2-interface-core
```

---

### 15.6 M3 — Backend Essentials

**Branch:** `m3-backend-essentials`
**Duração:** 2 semanas
**Objetivo:** Espaços e Membros funcionais (conecta M2 ao backend)

#### Entregas

```
[ ] API Routes: Spaces
    [ ] GET /api/spaces (lista)
    [ ] POST /api/spaces (cria)
    [ ] GET /api/spaces/[id] (detalhe)
    [ ] PATCH /api/spaces/[id] (edita)
    [ ] DELETE /api/spaces/[id] (remove)
[ ] API Routes: Members
    [ ] GET /api/members (lista com filtros)
    [ ] POST /api/members (cria)
    [ ] GET /api/members/[id] (detalhe)
    [ ] PATCH /api/members/[id] (edita)
    [ ] DELETE /api/members/[id] (remove)
[ ] Upload de fotos
    [ ] Cliente S3 configurado (MinIO)
    [ ] Compressão client-side (400x400, 80%)
    [ ] Validação de tipo e tamanho
    [ ] API /api/upload/photo
[ ] Integração com M2
    [ ] Páginas de espaços conectadas ao backend
    [ ] Páginas de membros conectadas ao backend
[ ] Dependentes
    [ ] Cadastro de dependentes (menor/maior)
    [ ] Ciclo de vida: menor → maior
[ ] Busca avançada
    [ ] Por CPF, nome, matrícula, local de trabalho
[ ] Importação
    [ ] Importação CSV de membros
    [ ] Validação de duplicatas
[ ] Audit log
    [ ] Log de create/update/delete
```

#### Commit Final

```bash
git add .
git commit -m "feat(m3): spaces e members funcionais com upload de fotos"
git checkout main
git merge m3-backend-essentials
git branch -d m3-backend-essentials
```

---

### 15.7 M4 — Reservations Core

**Branch:** `m4-reservations`
**Duração:** 2-3 semanas
**Dificuldade:** ALTA — é o core do sistema

#### Entregas

```
[ ] API Routes: Reservations
    [ ] GET /api/reservations
    [ ] POST /api/reservations
    [ ] GET /api/reservations/[id]
    [ ] PATCH /api/reservations/[id]
    [ ] DELETE /api/reservations/[id]
[ ] Detecção de Conflitos
    [ ] Algoritmo: R1.start < R2.end AND R1.end > R2.start
    [ ] Buffer de 15 min (configurável por espaço)
    [ ] API /api/reservations/check-conflict
[ ] Race Condition
    [ ] Row-level locking (FOR UPDATE)
    [ ] Transação atômica check-and-insert
[ ] Disponibilidade
    [ ] GET /api/spaces/[id]/availability?date=YYYY-MM-DD
    [ ] Retorna horários livres
[ ] Calendário Integrado
    [ ] Backend conecta com frontend M2
    [ ] Visualização dia/semana/mês
[ ] Reserva pelo Associado
    [ ] Fluxo completo de autoatendimento
    [ ] Validação de bloqueio inadimplente
[ ] Reserva pelo Escritório
    [ ] Reserva em nome de membro
    [ ] Busca de membro antes de reservar
[ ] Cancelamento
    [ ] Com reason (motivo)
    [ ] Log de quem cancelou
[ ] Notificações (início)
    [ ] Confirmação de reserva via e-mail (Brevo)
```

#### Commit Final

```bash
git add .
git commit -m "feat(m4): sistema de reservas com detecção de conflitos"
git checkout main
git merge m4-reservations
git branch -d m4-reservations
```

---

### 15.8 M5 — Financeiro

**Branch:** `m5-financeiro`
**Duração:** 1-2 semanas
**Objetivo:** Módulo financeiro completo

#### Entregas

```
[ ] API Routes: Payments
    [ ] GET /api/payments
    [ ] POST /api/payments
    [ ] PATCH /api/payments/[id]
    [ ] POST /api/payments/[id]/mark-paid
[ ] Baixa Manual
    [ ] Registro de pagamento
    [ ] Forma de pagamento (dinheiro, PIX, boleto)
    [ ] Quem recebeu (team member)
[ ] Inadimplência
    [ ] Cron job diário (check-overdue-payments)
    [ ] Regra: grace_period_days após vencimento
    [ ] Bloqueio automático de membros inadimplentes
[ ] Desbloqueio
    [ ] Ao marcar como pago
    [ ] Recalcula saldo pendente
    [ ] Desbloqueia se saldo = 0
[ ] Dashboards Reais
    [ ] Dados de ocupação em tempo real
    [ ] Gráficos Recharts com dados do banco
[ ] Relatórios
    [ ] Ocupação por espaço
    [ ] Uso por associado
    [ ] Taxa de inadimplência
    [ ] Exportação PDF/Excel
[ ] Fila de Espera
    [ ] POST /api/reservations/waitlist
    [ ] Notificação quando vaga liberada
```

#### Commit Final

```bash
git add .
git commit -m "feat(m5): financeiro, inadimplência e relatórios completos"
git checkout main
git merge m5-financeiro
git branch -d m5-financeiro
```

---

### 15.9 M6 — Polish & Deploy

**Branch:** `m6-polish-deploy`
**Duração:** 1-2 semanas
**Objetivo:** Pronto para produção

#### Entregas

```
[ ] E-mail (completar)
    [ ] Template: confirmação de reserva
    [ ] Template: lembrete de pagamento
    [ ] Template: conta bloqueada
    [ ] Template: conta desbloqueada
[ ] Segurança
    [ ] Headers CSP, HSTS, X-Frame-Options
    [ ] Rate limiting em APIs críticas
    [ ] Validação final de inputs
    [ ] Sanitização de dados
[ ] Documentação
    [ ] OpenAPI/Swagger das APIs
    [ ] README.md atualizado
    [ ] Termos de uso
    [ ] Política de privacidade
[ ] Deploy
    [ ] Dockerfile production-ready
    [ ] docker-compose.production.yml
    [ ] Configuração Coolify
    [ ] Backblaze B2 em produção
    [ ] Brevo em produção
[ ] Testes
    [ ] Playwright: fluxo crítico (login → reservar)
    [ ] Checklist de segurança validado
    [ ] Pentest de RLS
[ ] Homologação
    [ ] Teste de carga básico
    [ ] Validação de performance
    [ ] UAT com cliente (se possível)
```

#### Commit Final

```bash
git add .
git commit -m "chore(m6): polish completo - pronto para produção"
git checkout main
git merge m6-polish-deploy
git tag -a v1.0.0 -m "MVP completo - Socio Desk v1.0.0"
git branch -d m6-polish-deploy
```

---

### 15.10 Timeline Visual

```
Semanas:  1-2   3-4   5-6   7-9   10-11  12-13
          ───── ───── ───── ───── ───── ─────
M1        ████████
M2              ██████████
M3                    ██████████
M4                          █████████████
M5                                ████████
M6                                      ██████████

Total: 9-13 semanas (2-3 meses)
```

---

### 15.11 Fluxo de Trabalho por Milestone

```bash
# 1. Startar da main atualizada
git checkout main
git pull origin main

# 2. Criar branch da milestone
git checkout -b mX-nome-da-milestone

# 3. Trabalhar normalmente (commits parciais)
git add .
git commit -m "feat(mX): descrição do que fez"

# 4. Finalizar milestone
git add .
git commit -m "chore(mX): milestone completa"

# 5. Push da branch
git push origin mX-nome-da-milestone

# 6. Criar PR no GitHub/GitLab
#    Review opcional se tiver equipe

# 7. Merge na main
git checkout main
git merge mX-nome-da-milestone
git push origin main

# 8. Limpar branch local
git branch -d mX-nome-da-milestone

# 9. Continuar para próxima milestone
```

---

### 15.12 Critérios para Avançar de Milestone

```
ANTES DE FAZER MERGE:

[ ] Todos os testes passando
[ ] Lint passando (npm run lint)
[ ] TypeScript sem erros (npm run typecheck)
[ ] Builds localmente (npm run build)
[ ] Features testadas manualmente
[ ] Não há regressions (testou features anteriores)
[ ] Documentação atualizada se necessário
[ ] Commit final com pattern "chore(mX):" ou "feat(mX):"
```

---

## 16. Histórico de Versões

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 23/06/2026 | Versão inicial |
| 1.1 | 23/06/2026 | Adicionado Brevo, Recharts; @dnd-kit como opcional; shadcn/ui detalhado |
| 1.2 | 23/06/2026 | Adicionado seção 14: Claude Code templates e agents |
| 1.3 | 23/06/2026 | Adicionado seção 15: Plano de execução em 6 milestones |
