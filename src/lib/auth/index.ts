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
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      if (user && session?.user) {
        try {
          const member = await db.query.teamMembers?.findFirst?.({
            where: (tm, { eq }) => eq(tm.userId, user.id),
          });
          if (member) {
            session.user.tenantId = member.tenantId;
          }
        } catch {
          // Silently fail — layout.tsx tambem busca tenant
        }
      }
      return session;
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    trustedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
  },
});

export type Session = typeof auth.$Infer.Session;
