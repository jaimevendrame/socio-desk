import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email e senha sao obrigatorios' },
      { status: 400 }
    );
  }

  try {
    const bodyString = JSON.stringify({ email, password });
    const origin = request.headers.get('origin') || `${new URL(request.url).protocol}//${new URL(request.url).host}`;

    const authRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
        'Origin': origin,
      },
      body: bodyString,
    });

    const response = await auth.handler(authRequest);
    const responseBody = await response.text();

    if (!response.ok) {
      let errorMsg = 'Email ou senha invalidos';
      try {
        const errorData = JSON.parse(responseBody);
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch { /* use default */ }
      return NextResponse.json({ error: errorMsg }, { status: response.status });
    }

    const data = JSON.parse(responseBody);

    // Get tenantId from teamMembers (raw SQL bypasses RLS)
    let tenantId: string | undefined;
    let sessionToken: string | undefined;
    try {
      const result = await db.execute(
        sql`SELECT tm.tenant_id, s.token
            FROM team_members tm
            JOIN sessions s ON s.user_id = tm.user_id
            WHERE tm.user_id = ${data.user?.id}
              AND s.expires_at > NOW()
            ORDER BY s.created_at DESC
            LIMIT 1`,
      );
      if (result.rows?.[0]) {
        tenantId = result.rows[0].tenant_id as string;
        sessionToken = result.rows[0].token as string;
      }
    } catch { /* continue */ }

    // Persist tenantId in sessions table (bypasses RLS on sessions)
    if (tenantId && sessionToken) {
      try {
        await db.execute(
          sql`UPDATE sessions SET tenant_id = ${tenantId}::uuid WHERE token = ${sessionToken}`,
        );
      } catch { /* non-critical */ }
    }

    // Forward set-cookie headers
    const setCookieHeaders: string[] = [];
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value.split(',')[0].trim());
      }
    });

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
        tenantId,
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
    console.error('[SignIn] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login: ' + error.message },
      { status: 500 }
    );
  }
}
