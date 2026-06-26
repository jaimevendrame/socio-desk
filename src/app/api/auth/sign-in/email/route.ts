import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha sao obrigatorios' },
        { status: 400 }
      );
    }

    const authRequest = new NextRequest(
      new URL('/api/auth/sign-in/email', request.url),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        body: JSON.stringify({ email, password }),
      }
    );

    const response = await auth.handler(authRequest);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: 'Erro ao fazer login' };
      }
      return NextResponse.json(
        { error: errorData.error || 'Email ou senha invalidos' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Forward todos os set-cookie headers para o cliente
    const setCookieHeaders: string[] = [];
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value.split(',')[0].trim());
      }
    });

    // Obter tenantId do usuario logado
    let tenantId: string | undefined;
    try {
      const sessionHeaders = new Headers();
      const sessionCookie = setCookieHeaders[0];
      if (sessionCookie) {
        sessionHeaders.set('cookie', sessionCookie.split(';')[0]);
      }
      const sessionResponse = await auth.api.getSession({
        headers: sessionHeaders,
      });
      if (sessionResponse?.user) {
        tenantId = (sessionResponse.user as any).tenantId;
      }
    } catch {
      // Continuar mesmo se falhar
    }

    const jsonResponse = new NextResponse(JSON.stringify({
      user: {
        id: data.user?.id,
        name: data.user?.name,
        email: data.user?.email,
        image: data.user?.image,
        tenantId,
      },
      session: {
        id: data.session?.id || data.token,
        expiresAt: data.session?.expiresAt,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    for (const cookie of setCookieHeaders) {
      jsonResponse.headers.append('set-cookie', cookie);
    }

    return jsonResponse;
  } catch (error: any) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login: ' + error.message },
      { status: 500 }
    );
  }
}
