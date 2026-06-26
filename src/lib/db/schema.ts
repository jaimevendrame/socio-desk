// Socio Desk - Complete Database Schema
// Based on: socio-desk-dev-setup-v1.1.md

import { pgTable, uuid, varchar, text, timestamp, date, time, boolean, integer, decimal, jsonb, pgEnum, index, unique } from 'drizzle-orm/pg-core';
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
// PLANOS (independent)
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
// USERS (Better Auth - independent)
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
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
// TENANT (depends on plans)
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
// LOCAIS DE TRABALHO (depends on tenants)
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
// TEAM MEMBERS (depends on tenants, users)
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
// MEMBERS (depends on tenants, users, workplaces)
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
  workplaceId: uuid('workplace_id'),
  registrationNumber: varchar('registration_number', { length: 50 }),
  admissionDate: date('admission_date'),
  jobTitle: varchar('job_title', { length: 100 }),
  phoneWork: varchar('phone_work', { length: 20 }),
  dependentId: uuid('dependent_id'),
  parentMemberId: uuid('parent_member_id'),
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
// DEPENDENTS (depends on members)
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
// SPACES (depends on tenants)
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
// RESERVATIONS (depends on tenants, spaces, members, teamMembers)
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
  cancelledBy: uuid('cancelled_by'),
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
// PAYMENTS (depends on tenants, members, teamMembers)
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
  receivedBy: uuid('received_by'),
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
// TENANT SETTINGS (depends on tenants)
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
// AUDIT LOG (depends on tenants, users, teamMembers)
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
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  tenant: one(tenants, { fields: [reservations.tenantId], references: [tenants.id] }),
  space: one(spaces, { fields: [reservations.spaceId], references: [spaces.id] }),
  member: one(members, { fields: [reservations.memberId], references: [members.id] }),
  createdBy: one(teamMembers, { fields: [reservations.teamMemberId], references: [teamMembers.id] }),
}));
