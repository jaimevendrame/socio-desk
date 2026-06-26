import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const response = await auth.api.getSession({
      headers: { cookie: cookieHeader },
    });

    return NextResponse.json({
      authenticated: !!response,
      userId: response?.user?.id ?? null,
      email: response?.user?.email ?? null,
      sessionId: response?.session?.id ?? null,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
