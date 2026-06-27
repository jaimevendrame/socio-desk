import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db/client';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = session.user.id;

    const result = await pool.query(
      'SELECT id, name, email FROM members WHERE user_id = $1 LIMIT 1',
      [userId],
    );

    if (!result.rows?.[0]) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (err) {
    console.error('[GET /members/profile] Error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
