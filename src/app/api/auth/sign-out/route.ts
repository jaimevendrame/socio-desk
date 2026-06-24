import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST() {
  try {
    await auth.api.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    );
  }
}
