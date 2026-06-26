// Better Auth Configuration
import { betterAuth } from 'better-auth';
import { db } from '@/lib/db';

export const auth = betterAuth({
  database: db,
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
      // TODO: Buscar tenantId real da tabela teamMembers pelo userId
      // Por enquanto usando demo tenant — CORRIGIR antes de production
      if (user && session?.user) {
        session.user.tenantId = '1bdd8429-6dce-42ea-bf5b-6dc39a7a5490';
      }
      return session;
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  // Social providers can be added later
  // google: {
  //   clientId: process.env.GOOGLE_CLIENT_ID!,
  //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  // },
});

export type Session = typeof auth.$Infer.Session;
