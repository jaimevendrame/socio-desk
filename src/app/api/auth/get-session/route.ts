import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: Object.fromEntries(
          Object.entries(Object.fromEntries(
            // Get cookies from headers in production
          ))
        ),
      }),
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
