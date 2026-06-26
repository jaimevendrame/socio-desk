// Tenant context for RLS — sets current_setting('app.tenant_id') per request
// Uses AsyncLocalStorage to carry tenant ID without manual requestId tracking
import { AsyncLocalStorage } from 'async_hooks';
import { db } from './client';
import { sql } from 'drizzle-orm';

export interface TenantContext {
  tenantId: string;
  userId?: string;
}

interface TenantStore {
  ctx: TenantContext;
}

const globalForTenant = globalThis as unknown as {
  asyncLocalStorage: AsyncLocalStorage<TenantStore>;
};

export const tenantStorage: AsyncLocalStorage<TenantStore> =
  globalForTenant.asyncLocalStorage ??
  (globalForTenant.asyncLocalStorage = new AsyncLocalStorage<TenantStore>());

/**
 * Sets the tenant context for the current async execution flow.
 * Must be called before any data query in each API route handler.
 * Uses AsyncLocalStorage so any child async call inherits the context automatically.
 */
export async function setTenantContext(
  tenantId: string,
  userId?: string
): Promise<void> {
  await db.execute(sql`SELECT set_tenant_id(${tenantId}::uuid, ${userId ?? null})`);
  tenantStorage.enterWith({ ctx: { tenantId, userId } });
}

/**
 * Clears the tenant context at the end of a request.
 * Resets the session setting so the connection is clean for the next request.
 */
export async function clearTenantContext(): Promise<void> {
  await db.execute(sql`SELECT set_tenant_id(NULL::uuid, NULL)`);
  tenantStorage.disable();
}

/**
 * Gets the current tenant context (without side effects).
 */
export function getTenantContext(): TenantContext | undefined {
  return tenantStorage.getStore()?.ctx;
}

/**
 * Helper to wrap an API handler with automatic tenant context.
 * Handles set on entry and clear on exit (success or error).
 */
export async function withTenantContext<T>(
  tenantId: string,
  userId: string | undefined,
  fn: () => T | Promise<T>
): Promise<T> {
  await db.execute(sql`SELECT set_tenant_id(${tenantId}::uuid, ${userId ?? null})`);
  const store: TenantStore = { ctx: { tenantId, userId } };
  try {
    return await tenantStorage.run(store, fn);
  } finally {
    await db.execute(sql`SELECT set_tenant_id(NULL::uuid, NULL)`);
  }
}