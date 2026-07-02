import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, dependents, reservations, payments } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

const updateMemberSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  cpf: z.string().min(11).max(14).optional(),
  birthDate: z.string().optional(),
  email: z.string().email().optional().nullable(),
  phoneMobile: z.string().optional().nullable(),
  phoneHome: z.string().optional().nullable(),
  phoneWork: z.string().optional().nullable(),
  type: z.enum(['afiliado', 'convidado', 'dependente_maior']).optional(),
  status: z.enum(['ativo', 'inadimplente', 'suspenso', 'cancelado']).optional(),
  addressStreet: z.string().optional().nullable(),
  addressNumber: z.string().optional().nullable(),
  addressDistrict: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  addressState: z.string().optional().nullable(),
  addressZipCode: z.string().optional().nullable(),
  workplaceId: z.string().uuid().optional().nullable(),
  registrationNumber: z.string().optional().nullable(),
  admissionDate: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

// GET /api/members/[id] - Obter membro por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = checkRateLimit(request, 'api');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)) } }
      );
    }
    const { id } = await params;
    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 401 });
    }

    return withTenantContext(tenantId, userId, async () => {
      // Security: Verify member belongs to tenant
      const [member] = await db
        .select()
        .from(members)
        .where(and(eq(members.id, id), eq(members.tenantId, tenantId)));

      if (!member) {
        return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
      }

      const memberDependents = await db
        .select()
        .from(dependents)
        .where(eq(dependents.memberId, id));

      const memberReservations = await db
        .select()
        .from(reservations)
        .where(eq(reservations.memberId, id))
        .orderBy(desc(reservations.date))
        .limit(10);

      const memberPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.memberId, id))
        .orderBy(desc(payments.dueDate))
        .limit(10);

      return NextResponse.json({
        ...member,
        dependents: memberDependents,
        reservations: memberReservations,
        payments: memberPayments,
      });
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json({ error: 'Erro ao buscar membro' }, { status: 500 });
  }
}

// PUT /api/members/[id] - Atualizar membro
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = checkRateLimit(request, 'api');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)) } }
      );
    }
    const { id } = await params;
    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateMemberSchema.parse(body);

    return withTenantContext(tenantId, userId, async () => {
      // Security: Verify member belongs to tenant
      const [existingMember] = await db
        .select()
        .from(members)
        .where(and(eq(members.id, id), eq(members.tenantId, tenantId)));

      if (!existingMember) {
        return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
      }

      const [updatedMember] = await db
        .update(members)
        .set({
          ...validated,
          updatedAt: new Date(),
        })
        .where(eq(members.id, id))
        .returning();

      if (!updatedMember) {
        return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
      }

      return NextResponse.json(updatedMember);
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 500 });
  }
}

// DELETE /api/members/[id] - Excluir membro
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = checkRateLimit(request, 'api');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)) } }
      );
    }
    const { id } = await params;
    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 401 });
    }

    return withTenantContext(tenantId, userId, async () => {
      // Security: Verify member belongs to tenant
      const [existingMember] = await db
        .select()
        .from(members)
        .where(and(eq(members.id, id), eq(members.tenantId, tenantId)));

      if (!existingMember) {
        return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
      }

      const [deletedMember] = await db
        .delete(members)
        .where(eq(members.id, id))
        .returning();

      if (!deletedMember) {
        return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ success: true, deleted: deletedMember });
    });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json({ error: 'Erro ao excluir membro' }, { status: 500 });
  }
}
