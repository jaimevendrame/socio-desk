import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithTenant(request.headers);

    if (!session) {
      return NextResponse.json({ user: null, session: null });
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        tenantId: session.user.tenantId,
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt.toISOString(),
        tenantId: session.session.tenantId,
      },
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ user: null, session: null });
  }
}
