import { test as base, Page, Expect } from '@playwright/test';
import { expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  role: 'master' | 'admin' | 'team' | 'member';
}

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
}

// Base test with common fixtures
export const test = base.extend<{
  masterUser: TestUser;
  adminUser: TestUser;
  memberUser: TestUser;
}>({
  masterUser: {
    email: 'super@admin.com',
    password: 'SuperAdmin123!',
    role: 'master',
  },
  adminUser: {
    email: 'admin@dev.com',
    password: 'Admin123!',
    role: 'admin',
  },
  memberUser: {
    email: 'member@dev.com',
    password: 'Member@123456',
    role: 'member',
  },
});
