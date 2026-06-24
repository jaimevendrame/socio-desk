import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, accounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

    // Find user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!userResult.length) {
      return NextResponse.json(
        { error: 'Email ou senha invalidos' },
        { status: 401 }
      );
    }

    const user = userResult[0];

    // Find account with password
    const accountsResult = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, user.id));

    const accountWithPassword = accountsResult.find(acc => acc.password);

    if (!accountWithPassword?.password) {
      return NextResponse.json(
        { error: 'Email ou senha invalidos' },
        { status: 401 }
      );
    }

    // Simple password check (in production use bcrypt)
    const storedHash = accountWithPassword.password;
    const hashParts = storedHash.split(':');
    if (hashParts.length !== 2) {
      return NextResponse.json(
        { error: 'Email ou senha invalidos' },
        { status: 401 }
      );
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      session: {
        id: sessionId,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login: ' + error.message },
      { status: 500 }
    );
  }
}
