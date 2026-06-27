import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { members } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

export async function GET(request: NextRequest) {
  try {
    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const result = await db
      .select({ id: members.id, name: members.name, email: members.email })
      .from(members)
      .where(eq(members.userId, userId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data: result[0] });
  } catch (err) {
    console.error('[GET /members/me] Error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}