/**
 * API de Waitlist - Operações por ID
 *
 * GET    /api/waitlist/[id]  - Detalhe de uma entrada
 * DELETE /api/waitlist/[id]  - Remove da fila (membro sai ou admin remove)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { reservationWaitlist } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = checkRateLimit(request, 'api');
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { id } = await params;
    const sessionData = await getSessionWithTenant(request.headers);
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 401 });
    }

    return withTenantContext(tenantId, sessionData?.user.id, async () => {
      const [entry] = await db
        .select()
        .from(reservationWaitlist)
        .where(eq(reservationWaitlist.id, id));

      if (!entry) {
        return NextResponse.json({ error: 'Entrada não encontrada na fila de espera' }, { status: 404 });
      }

      return NextResponse.json(entry);
    });
  } catch (error) {
    console.error('Error fetching waitlist entry:', error);
    return NextResponse.json({ error: 'Erro ao buscar entrada' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = checkRateLimit(request, 'write');
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { id } = await params;
    const sessionData = await getSessionWithTenant(request.headers);
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 401 });
    }

    return withTenantContext(tenantId, sessionData?.user.id, async () => {
      const [deleted] = await db
        .delete(reservationWaitlist)
        .where(eq(reservationWaitlist.id, id))
        .returning();

      if (!deleted) {
        return NextResponse.json({ error: 'Entrada não encontrada na fila de espera' }, { status: 404 });
      }

      return NextResponse.json({ success: true, removed: deleted });
    });
  } catch (error) {
    console.error('Error removing from waitlist:', error);
    return NextResponse.json({ error: 'Erro ao remover da fila de espera' }, { status: 500 });
  }
}