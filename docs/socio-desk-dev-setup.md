# SPEC — Socio Desk: Ambiente de Desenvolvimento

**Documento:** Setup completo de ambiente local e deploy
**Versão:** 1.0 | **Data:** Junho/2026
**Stack:** Next.js + Drizzle ORM + Better Auth + Postgres + Coolify

---

## 1. Visão Geral da Stack

### Stack Definitive

| Camada | Tecnologia | Alternativa Prod |
|--------|------------|-----------------|
| **Frontend + Backend** | Next.js 14+ (App Router) | Vercel ou Coolify |
| **ORM** | Drizzle ORM | Igual em todos ambientes |
| **Auth** | Better Auth | Igual em todos ambientes |
| **Database** | PostgreSQL 16 | Postgres 16 self-hosted (Coolify) |
| **Storage** | MinIO (local) | Backblaze B2 ou S3-compatible |
| **Deploy** | Coolify | Coolify na VPS |
| **Runtime** | Bun ou Node.js | Igual em todos ambientes |

### Por que não o stack original

| Removido | Motivo |
|----------|--------|
| ~~Supabase Auth~~ | Lock-in; Better Auth é mais flexível e não depende de vendor |
| ~~Supabase Storage~~ | MinIO local + S3-compatible em prod é mais portável |
| ~~Supabase Realtime~~ | SSE polling cobre MVP; Ably/Centrifugo depois se precisar |
| ~~Vercel~~ | Coolify na VPS é mais controlável e barato |

---

## 2. Estrutura de Pastas do Projeto

```
socio-desk/
├── .env.local                    # Varíaveis locais (NÃO commitar)
├── .env.example                  # Template para .env.local
├── .env.production.example       # Template para produção
│
├── docker-compose.yml            # Postgres + MinIO locais
├── docker-compose.production.yml # Produção (Coolify)
│
├── drizzle/                      # Drizzle ORM
│   ├── drizzle.config.ts
│   ├── migrations/                # Migrações geradas
│   └── seed.ts                   # Dados de teste
│
├── prisma/                       # NÃO USAR (ficou só referência)
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Grupo de rotas: login, registro
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   │
│   │   ├── (dashboard)/          # Grupo de rotas: associado
│   │   │   ├── dashboard/
│   │   │   ├── reservas/
│   │   │   └── perfil/
│   │   │
│   │   ├── (office)/             # Grupo de rotas: escritório
│   │   │   ├── escritorio/
│   │   │   ├── escritorio/reservas/
│   │   │   ├── escritorio/associados/
│   │   │   └── escritorio/financeiro/
│   │   │
│   │   ├── (admin)/              # Grupo de rotas: admin tenant
│   │   │   ├── admin/
│   │   │   ├── admin/equipe/
│   │   │   └── admin/config/
│   │   │
│   │   ├── (master)/             # Grupo de rotas: admin master
│   │   │   ├── master/
│   │   │   ├── master/tenants/
│   │   │   └── master/planos/
│   │   │
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/
│   │   │   ├── members/
│   │   │   ├── reservations/
│   │   │   ├── spaces/
│   │   │   ├── payments/
│   │   │   └── webhooks/
│   │   │
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── components/               # Componentes React
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/               # Sidebar, Header, Footer
│   │   ├── reservations/          # Calendário, cards de reserva
│   │   ├── members/              # Forms, listas, detalhes
│   │   └── dashboard/            # Cards de métricas
│   │
│   ├── lib/                      # Biblioteca de código
│   │   ├── db/                   # Drizzle + conexao
│   │   │   ├── index.ts          # Cliente do banco
│   │   │   ├── schema.ts         # Schema completo do banco
│   │   │   └── client.ts         # Singleton do cliente
│   │   │
│   │   ├── auth/                 # Better Auth setup
│   │   │   ├── index.ts          # Instância better-auth
│   │   │   ├── middleware.ts     # Middleware de auth
│   │   │   └── permissions.ts   # RBAC helper
│   │   │
│   │   ├── storage/              # Upload de arquivos
│   │   │   ├── index.ts          # Cliente S3/MinIO
│   │   │   └── upload.ts         # Funções de upload
│   │   │
│   │   ├── tenant/               # Contexto multi-tenant
│   │   │   ├── context.tsx       # React context do tenant
│   │   │   ├── middleware.ts     # Extrai tenant da request
│   │   │   └── rls.ts           # Helper para queries com tenant
│   │   │
│   │   ├── email/                # Envio de e-mails
│   │   │   └── index.ts          # Resend ou similar
│   │   │
│   │   └── utils/                # Funções utilitárias
│   │       ├── cn.ts             # classnames helper
│   │       ├── date.ts           # Formatação de datas
│   │       └── validation.ts     # Zod schemas
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-tenant.ts
│   │   └── use-reservations.ts
│   │
│   └── types/                    # Tipos TypeScript
│       ├── auth.ts
│       ├── member.ts
│       ├── reservation.ts
│       └── api.ts
│
├── tests/                        # Testes
│   ├── e2e/                      # Playwright
│   ├── unit/                     # Vitest
│   └── setup/
│
├── scripts/                      # Scripts utilitários
│   ├── db/
│   │   ├── generate-migration.ts
│   │   ├── push-schema.ts
│   │   └── seed.ts
│   │
│   └── build-docker.sh
│
├── Dockerfile                    # Para produção (Coolify)
├── Dockerfile.dev                # Para desenvolvimento (opcional)
├── .dockerignore
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── drizzle.config.ts
└── vitest.config.ts
```

---

## 3. Docker Compose — Desenvolvimento Local

### 3.1 docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL 16 — banco principal
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

  # MinIO — storage S3-compatible (fotos de membros)
  minio:
    image: minio/minio:latest
    container_name: socio-desk-minio
    environment:
      MINIO_ROOT_USER: minio_admin
      MINIO_ROOT_PASSWORD: minio_password
    ports:
      - "9000:9000"   # API
      - "9001:9001"   # Console web
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Create default MinIO bucket na inicialização
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

# Saída esperada:
# NAME                COMMAND                  SERVICE   STATUS
# socio-desk-db       "docker-entrypoint.s…"   postgres  running (healthy)
# socio-desk-minio    "/usr/bin/docker-ent…"   minio     running (healthy)

# 3. Testar conexão com banco
docker compose exec postgres psql -U dev -d socio_desk -c "SELECT 1;"

# 4. Abrir MinIO Console (opcional, para debug)
# http://localhost:9001
# Login: minio_admin / minio_password
```

---

## 4. Setup do Drizzle ORM

### 4.1 Instalação

```bash
# Dependências do Drizzle
npm install drizzle-orm
npm install -D drizzle-kit @types/pg
npm install pg                     # Driver PostgreSQL

# Driver melhor para Next.js (conexões pooling)
npm install @neondatabase/serverless
```

### 4.2 drizzle.config.ts

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 4.3 Schema do Banco — Modelo Completo

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
  // Identificação
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id), // Nullable: nem todo member tem login
  
  // Tipo e status
  type: memberTypeEnum('type').notNull(),
  status: memberStatusEnum('status').default('ativo').notNull(),
  
  // Dados pessoais
  name: varchar('name', { length: 255 }).notNull(),
  birthDate: date('birth_date').notNull(),
  civilState: varchar('civil_state', { length: 50 }),
  documentType: documentTypeEnum('document_type'),
  documentNumber: varchar('document_number', { length: 50 }),
  cpf: varchar('cpf', { length: 14 }).notNull(), // Formato: 000.000.000-00
  
  // Endereço
  addressStreet: varchar('address_street', { length: 255 }),
  addressNumber: varchar('address_number', { length: 20 }),
  addressComplement: varchar('address_complement', { length: 100 }),
  addressDistrict: varchar('address_district', { length: 100 }),
  addressZipCode: varchar('address_zip_code', { length: 10 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressState: varchar('address_state', { length: 2 }),
  
  // Contato
  phoneHome: varchar('phone_home', { length: 20 }),
  phoneMobile: varchar('phone_mobile', { length: 20 }),
  phoneMessage: varchar('phone_message', { length: 20 }),
  email: varchar('email', { length: 255 }),
  photoUrl: varchar('photo_url', { length: 500 }),
  
  // Dados funcionais (para afiliados)
  workplaceId: uuid('workplace_id').references(() => workplaces.id),
  registrationNumber: varchar('registration_number', { length: 50 }), // Matrícula
  admissionDate: date('admission_date'),
  jobTitle: varchar('job_title', { length: 100 }),
  phoneWork: varchar('phone_work', { length: 20 }),
  
  // Dependente (se type = dependente_maior)
  dependentId: uuid('dependent_id'), // Ref ao registro original em dependents
  parentMemberId: uuid('parent_member_id').references(() => members.id), // Titular
  isBillable: boolean('is_billable').default(false),
  migratedAt: timestamp('migrated_at'),
  
  // Bloqueio
  blockedAt: timestamp('blocked_at'),
  blockReason: text('block_reason'),
  
  // Timestamps
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
  memberId: uuid('member_id').references(() => members.id).notNull(), // Titular
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
  
  // Configurações de reserva
  bufferMinutes: integer('buffer_minutes').default(15).notNull(), // Tempo entre reservas
  minReservationMinutes: integer('min_reservation_minutes').default(30).notNull(),
  maxReservationMinutes: integer('max_reservation_minutes').default(480).notNull(),
  maxAdvanceDays: integer('max_advance_days').default(30).notNull(), // Limite de antecedência
  maxReservationsPerDay: integer('max_reservations_per_day'),
  
  // Horário de funcionamento
  openTime: time('open_time').notNull().default('06:00'),
  closeTime: time('close_time').notNull().default('22:00'),
  
  // Tarificação
  hasCost: boolean('has_cost').default(false).notNull(),
  costAmount: decimal('cost_amount', { precision: 10, scale: 2 }),
  
  // Controle
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
  teamMemberId: uuid('team_member_id').references(() => teamMembers.id), // Se feito pelo escritório
  
  // Data e horário
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  
  // Status
  status: reservationStatusEnum('status').default('pendente').notNull(),
  notes: text('notes'),
  
  // Recorrência
  isRecurring: boolean('is_recurring').default(false).notNull(),
  recurringPattern: varchar('recurring_pattern', { length: 20 }), // 'daily' | 'weekly'
  recurringUntil: date('recurring_until'),
  
  // Pagamento
  amount: decimal('amount', { precision: 10, scale: 2 }),
  isPaid: boolean('is_paid').default(false).notNull(),
  
  // Cancelamento
  cancelledAt: timestamp('cancelled_at'),
  cancelledBy: uuid('cancelled_by').references(() => teamMembers.id)),
  cancelReason: text('cancel_reason'),
  
  // Timestamps
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
  
  // Dados do pagamento
  description: varchar('description', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  dueDate: date('due_date').notNull(),
  paidDate: date('paid_date'),
  status: paymentStatusEnum('status').default('pending').notNull(),
  
  // Forma de pagamento
  paymentMethod: varchar('payment_method', { length: 50 }), // 'dinheiro' | 'pix' | 'boleto' | 'transferencia'
  
  // Baixa
  receivedBy: uuid('received_by').references(() => teamMembers.id),
  receivedAt: timestamp('received_at'),
  
  // Notas
  notes: text('notes'),
  
  // Timestamps
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
  
  // Notificações
  emailNotificationsEnabled: boolean('email_notifications_enabled').default(true).notNull(),
  whatsappNotificationsEnabled: boolean('whatsapp_notifications_enabled').default(false).notNull(),
  
  // Financeiro
  gracePeriodDays: integer('grace_period_days').default(5).notNull(),
  minDebtForBlock: decimal('min_debt_for_block', { precision: 10, scale: 2 }).default('0.01').notNull(),
  autoBlockEnabled: boolean('auto_block_enabled').default(true).notNull(),
  
  // Reserva
  defaultBufferMinutes: integer('default_buffer_minutes').default(15).notNull(),
  
  // Logo e marca
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
  
  action: varchar('action', { length: 100 }).notNull(), // 'create', 'update', 'delete', 'login', etc
  entity: varchar('entity', { length: 100 }).notNull(), // 'member', 'reservation', 'space', etc
  entityId: uuid('entity_id'),
  
  changes: jsonb('changes').default({}).notNull(), // { before: {}, after: {} }
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

### 4.4 Conexão com o Banco

```typescript
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Em desenvolvimento local, usamos pg (pool)
// Em produção com Neon, usamos neon-http
const isLocal = process.env.DATABASE_URL?.includes('localhost');

let db;

if (isLocal) {
  // Local: usa driver pg com pooling
  import('pg').then(({ Pool }) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
  });
} else {
  // Produção: Neon ou outro PostgreSQL compatível
  const sql = neon(process.env.DATABASE_URL!);
  db = drizzle(sql, { schema });
}

export { db };
export * from './schema';
```

```typescript
// src/lib/db/client.ts
// Singleton para uso em API routes e server components
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

### 4.5 Scripts de Migração

```json
// package.json — scripts relevantes
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx scripts/db/seed.ts",
    "db:reset": "npm run db:push -- --force && npm run db:seed"
  }
}
```

```bash
# Fluxo de trabalho típico
npm run db:generate     # Gera migração do schema
npm run db:migrate       # Aplica migração no banco
npm run db:studio        # Abre Drizzle Studio (UI do banco)
npm run db:push          # Push direto (desenvolvimento, ignora migrações)
```

---

## 5. Setup do Better Auth

### 5.1 Instalação

```bash
npm install better-auth
npm install drizzle-orm
```

### 5.2 Configuração

```typescript
// src/lib/auth/index.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { sendEmail } from '@/lib/email';

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
    requireEmailVerification: false, // MVP: ativar depois
    sendEmailVerification: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
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
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24,      // Atualiza a cada 24h
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutos
    },
  },
  
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
});

export type Session = typeof auth.$Infer.Session;
```

### 5.3 Middleware de Proteção de Rotas

```typescript
// src/middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas (não precisam de auth)
const publicRoutes = ['/login', '/register', '/forgot-password', '/api/auth'];

// Rotas que requerem role específico
const roleRoutes: Record<string, string[]> = {
  '/escritorio': ['admin', 'team'],
  '/admin': ['admin'],
  '/master': ['admin_master'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rotas públicas passam
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Verifica sessão
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Verifica role para rotas protegidas
  for (const [basePath, roles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(basePath)) {
      const userRole = session.user.role || 'member';
      
      if (!roles.includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }
  
  // Injeta tenant_id na request para uso posterior
  const tenantId = await getTenantFromUser(session.user.id);
  
  const response = NextResponse.next();
  response.headers.set('x-user-id', session.user.id);
  response.headers.set('x-user-role', session.user.role || 'member');
  response.headers.set('x-tenant-id', tenantId || '');
  
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 5.4 Helper de Permissões

```typescript
// src/lib/auth/permissions.ts
type Role = 'admin_master' | 'admin' | 'team' | 'member';

type Permission =
  | 'members:read'
  | 'members:write'
  | 'members:delete'
  | 'reservations:read'
  | 'reservations:write'
  | 'reservations:cancel'
  | 'spaces:read'
  | 'spaces:write'
  | 'payments:read'
  | 'payments:write'
  | 'reports:read'
  | 'team:manage'
  | 'tenant:manage'
  | 'master:all';

const rolePermissions: Record<Role, Permission[]> = {
  admin_master: ['master:all'],
  admin: [
    'members:read', 'members:write', 'members:delete',
    'reservations:read', 'reservations:write', 'reservations:cancel',
    'spaces:read', 'spaces:write',
    'payments:read', 'payments:write',
    'reports:read',
    'team:manage',
  ],
  team: [
    'members:read', 'members:write',
    'reservations:read', 'reservations:write', 'reservations:cancel',
    'spaces:read',
    'payments:read', 'payments:write',
  ],
  member: [
    'reservations:read', 'reservations:write',
    'members:read', // só próprio perfil
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  if (!permissions) return false;
  
  // Admin master tem acesso a tudo do tenant
  if (permissions.includes('master:all')) return true;
  
  return permissions.includes(permission);
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Unauthorized: missing permission ${permission}`);
  }
}
```

---

## 6. Variáveis de Ambiente

### 6.1 .env.example (Desenvolvimento)

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
# E-MAIL (Resend ou outro)
# ===========================================
EMAIL_PROVIDER="resend"
RESEND_API_KEY=""
EMAIL_FROM="noreply@sociodesk.com.br"

# ===========================================
# APP
# ===========================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Socio Desk"

# ===========================================
# TENANT
# ===========================================
# Para desenvolvimento, usa subdomain fixo
DEFAULT_TENANT_SLUG="dev"
```

### 6.2 Como gerar AUTH_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Ou com Node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 6.3 .gitignore

```
# Environment
.env
.env.local
.env.*.local

# Database
*.db
*.db-journal

# MinIO data
minio/

# Drizzle
drizzle/migrations/*.sql

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db
```

---

## 7. Scripts de Desenvolvimento

### 7.1 package.json — Scripts Completos

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
    "db:check": "drizzle-kit check",
    
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:restart": "docker compose restart",
    "docker:logs": "docker compose logs -f",
    
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "drizzle-orm": "^0.30.0",
    "better-auth": "^1.0.0",
    "pg": "^8.11.0",
    "@aws-sdk/client-s3": "^3.500.0",
    "zod": "^3.22.0",
    "date-fns": "^3.3.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.350.0",
    "@radix-ui/react-*": "^1.0.0",
    "resend": "^3.2.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/pg": "^8.11.0",
    "drizzle-kit": "^0.20.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "vitest": "^1.3.0",
    "@playwright/test": "^1.41.0",
    "tsx": "^4.7.0",
    "storybook": "^8.0.0",
    "@storybook/react": "^8.0.0"
  }
}
```

### 7.2 Script de Seed (Dados de Teste)

```typescript
// scripts/db/seed.ts
import { db } from '@/lib/db/client';
import { tenants, plans, members, spaces, workplaces, reservations } from '@/lib/db/schema';
import { hashPassword } from 'better-auth';

async function seed() {
  console.log('🌱 Starting seed...');
  
  // 1. Cria plano padrão
  const [plan] = await db.insert(plans).values({
    name: 'Profissional',
    tier: 'profissional',
    maxMembers: 500,
    priceMonthly: '99.00',
    priceYearly: '990.00',
    features: ['whatsapp', 'relatorios_avancados', 'multiplos_admin'],
  }).returning();
  
  // 2. Cria tenant de desenvolvimento
  const [tenant] = await db.insert(tenants).values({
    name: 'Clube Exemplo (Dev)',
    slug: 'dev',
    planId: plan.id,
    isActive: true,
  }).returning();
  
  // 3. Cria locais de trabalho
  const [prefeitura] = await db.insert(workplaces).values({
    tenantId: tenant.id,
    name: 'Prefeitura Municipal',
  }).returning();
  
  const [camara] = await db.insert(workplaces).values({
    tenantId: tenant.id,
    name: 'Câmara Municipal',
  }).returning();
  
  // 4. Cria espaços
  await db.insert(spaces).values([
    {
      tenantId: tenant.id,
      name: 'Quadra Poliesportiva',
      description: 'Quadra coberta para futsal, vôlei e basquete',
      category: 'esportivo',
      openTime: '06:00',
      closeTime: '22:00',
      bufferMinutes: 15,
    },
    {
      tenantId: tenant.id,
      name: 'Salão de Festas',
      description: 'Salão para eventos e confraternizações',
      category: 'social',
      openTime: '08:00',
      closeTime: '23:00',
      bufferMinutes: 30,
      hasCost: true,
      costAmount: '500.00',
    },
    {
      tenantId: tenant.id,
      name: 'Mesa de Sinuca',
      description: 'Mesa profissional com tacos e bolas',
      category: 'equipamento',
      openTime: '08:00',
      closeTime: '22:00',
    },
  ]);
  
  // 5. Cria membros de exemplo
  const [user] = await db.insert(members).values({
    tenantId: tenant.id,
    type: 'afiliado',
    name: 'João Silva',
    cpf: '123.456.789-00',
    birthDate: '1985-03-15',
    civilState: 'casado',
    documentType: 'cpf',
    documentNumber: '12345678900',
    email: 'joao.silva@email.com',
    phoneMobile: '(11) 99999-8888',
    addressStreet: 'Rua das Flores',
    addressNumber: '123',
    addressDistrict: 'Centro',
    addressCity: 'São Paulo',
    addressState: 'SP',
    addressZipCode: '01001-000',
    workplaceId: prefeitura.id,
    registrationNumber: '12345',
    admissionDate: '2010-01-15',
    jobTitle: 'Assistente Administrativo',
  }).returning();
  
  console.log('✅ Seed completed!');
  console.log(`   Tenant: ${tenant.slug}`);
  console.log(`   Members created: 1`);
}

seed().catch(console.error);
```

---

## 8. Deploy com Coolify

### 8.1 Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Instala dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build

# Produção
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
// next.config.js — habilita standalone output
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

module.exports = nextConfig;
```

### 8.2 docker-compose.production.yml

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
    backup:
      enabled: true
      schedule: "0 2 * * *"  # Backup diário às 2h
      destination: /backups

volumes:
  postgres_prod_data:
```

### 8.3 Configuração no Coolify

```
1. Conectar VPS ao Coolify
   └── Settings → Servers → Add Server

2. Criar novo projeto
   └── Projects → New Project → "Socio Desk"

3. Adicionar aplicação
   └── Applications → Add → Git Repository
       ├── Repository: https://github.com/seu-user/socio-desk
       ├── Branch: main
       └── Build Pack: Dockerfile

4. Configurar variáveis de ambiente
   └── Environment Variables
       ├── DATABASE_URL=postgresql://user:pass@host:5432/socio_desk
       ├── AUTH_SECRET=<gerar>
       ├── S3_*=dados do Backblaze/S3
       └── NEXT_PUBLIC_APP_URL=https://seudominio.com

5. Configurar domínio
   └── Domains → Add Domain
       └── Domain: socio-desk.seudominio.com
       └── HTTPS: Enabled (Let's Encrypt)

6. Configurar PostgreSQL (pode ser outro servidor)
   └── Ou instalar via Coolify:
       └── Databases → Add → PostgreSQL

7. Deploy!
   └── Deploy → Watching logs
```

---

## 9. Checklist de Setup

### Dia 1 — Setup Inicial

- [ ] Clonar repo (quando existir)
- [ ] Instalar Docker Desktop
- [ ] Criar `.env.local` a partir do `.env.example`
- [ ] `docker compose up -d`
- [ ] `npm install`
- [ ] `npm run db:push`
- [ ] `npm run db:seed`
- [ ] `npm run dev`
- [ ] Abrir http://localhost:3000
- [ ] Testar login

### Setup do Editor

- [ ] VS Code extensions:
  - [ ] ESLint
  - [ ] Prettier
  - [ ] Tailwind CSS IntelliSense
  - [ ] Drizzle (se existir)
  - [ ] PostgreSQL (Beekeeper Studio, DBeaver, ou extensão)
- [ ] Configurar formatOnSave

### Pré-Deploy Coolify

- [ ] Configurar VPS com Ubuntu 22.04
- [ ] Instalar Coolify na VPS
- [ ] Conectar repo GitHub
- [ ] Criar database PostgreSQL
- [ ] Configurar S3/Backblaze
- [ ] Configurar variáveis de produção
- [ ] Deploy inicial
- [ ] Validar HTTPS
- [ ] Testar fluxo completo

---

## 10. Troubleshooting Comum

### Postgres não conecta

```bash
# Verificar se está rodando
docker compose ps

# Ver logs
docker compose logs postgres

# Testar conexão manual
docker compose exec postgres psql -U dev -d socio_desk
```

### Drizzle "relation does not exist"

```bash
# Push schema novamente
npm run db:push

# Se改了 schema, gerar migração
npm run db:generate
npm run db:migrate
```

### MinIO não aceita uploads

```bash
# Verificar se bucket foi criado
docker compose logs minio-setup

# Criar bucket manualmente
docker compose exec minio mc alias set local http://localhost:9000 minio_admin minio_password
docker compose exec minio mc mb local/socio-desk-photos
docker compose exec minio mc anonymous set download local/socio-desk-photos
```

### Better Auth erros de sessão

```bash
# Limpar cookies do navegador
# Verificar AUTH_SECRET no .env.local
# Verificar se DATABASE_URL está correto
```

---

## 11. Histórico de Versões

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 23/06/2026 | Versão inicial |
