// Database client - PostgreSQL with Drizzle ORM
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Load environment variables
import 'dotenv/config';

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

function createPool() {
  if (!globalForDb.pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    globalForDb.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return globalForDb.pool;
}

export const db = drizzle(createPool(), { schema });

export type Database = typeof db;
