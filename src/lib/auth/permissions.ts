import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export type UserRole = 'admin_master' | 'admin' | 'team' | 'member';

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified: boolean;
  role?: UserRole;
  tenantId?: string;
}

export async function requireAuth(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}