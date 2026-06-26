// Better Auth Configuration
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  // Note: session callback is NOT used for tenantId hydration here because Better Auth
  // does not execute it during getSession(). Instead, getSessionWithTenant() handles
  // tenantId enrichment via direct DB query (sessions table has no RLS).
  // tenantId is persisted to sessions table during sign-in via sign-in/email/route.ts.
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    trustedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
  },
});

export type Session = typeof auth.$Infer.Session;
