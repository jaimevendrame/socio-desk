import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    // Obter cookies do header de requisição
    const requestHeaders = new Headers();

    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session) {
      return NextResponse.json({ user: null, session: null });
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        tenantId: (session.user as any).tenantId,
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ user: null, session: null });
  }
}
