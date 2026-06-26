// Auth helpers and permission utilities
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// User roles
export type UserRole = 'admin_master' | 'admin' | 'team' | 'member';

// Extended session user with role
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified: boolean;
  role?: UserRole;
  tenantId?: string;
}

// Permission map
const rolePermissions: Record<UserRole, string[]> = {
  admin_master: ['*'], // All permissions
  admin: [
    'dashboard:read',
    'members:read', 'members:write', 'members:delete',
    'spaces:read', 'spaces:write', 'spaces:delete',
    'reservations:read', 'reservations:write', 'reservations:delete',
    'payments:read', 'payments:write',
    'team:read', 'team:write', 'team:delete',
    'reports:read', 'reports:export',
    'config:read', 'config:write',
  ],
  team: [
    'dashboard:read',
    'members:read', 'members:write',
    'spaces:read', 'spaces:write',
    'reservations:read', 'reservations:write',
    'payments:read', 'payments:write',
  ],
  member: [
    'dashboard:read',
    'reservations:read', 'reservations:write',
    'profile:read', 'profile:write',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = rolePermissions[role];
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}

/**
 * Get session and validate authentication
 */
export async function getSession(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}

/**
 * Require authenticated user
 */
export async function requireAuth(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.user) {
    throw new AuthError('Unauthorized', 401);
  }
  return session;
}

/**
 * Get user's role in the current tenant
 */
export async function getUserRole(tenantId: string, userId: string): Promise<UserRole | null> {
  const member = await db.query.teamMembers?.findFirst?.({
    where: (tm, { eq, and }) => and(
      eq(tm.tenantId, tenantId),
      eq(tm.userId, userId)
    ),
  });
  return (member?.role as UserRole) ?? null;
}

/**
 * Require specific permission
 */
export async function requirePermission(
  request: NextRequest,
  permission: string,
  tenantId?: string
) {
  const session = await requireAuth(request);

  // Get role from user metadata or session
  const userRole = (session.user as unknown as SessionUser).role;

  // Admin master has all permissions
  if (userRole === 'admin_master') {
    return session;
  }

  // Check tenant-specific role
  if (tenantId && userRole) {
    const role = await getUserRole(tenantId, session.user.id);
    if (!role || !hasPermission(role, permission)) {
      throw new AuthError('Forbidden', 403);
    }
  }

  return session;
}

/**
 * Custom Auth Error
 */
export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Handle auth errors in API routes
 */
export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  console.error('[Auth Error]', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
