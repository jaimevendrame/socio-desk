import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithTenant(request.headers);

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
      sessionId: session.session.id,
      tenantId: session.user.tenantId,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
