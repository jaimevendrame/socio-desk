// Database client - PostgreSQL with Drizzle ORM
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

export type Database = typeof db;
