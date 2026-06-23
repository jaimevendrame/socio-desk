import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, workplaces } from '@/lib/db/schema';
import { eq, and, like, or, desc } from 'drizzle-orm';
import { z } from 'zod';

const createMemberSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(255),
  cpf: z.string().min(11).max(14),
  birthDate: z.string(),
  email: z.string().email().optional(),
  phoneMobile: z.string().optional(),
  phoneHome: z.string().optional(),
  type: z.enum(['afiliado', 'convidado', 'dependente_maior']).default('afiliado'),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressDistrict: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZipCode: z.string().optional(),
  workplaceId: z.string().uuid().optional(),
  registrationNumber: z.string().optional(),
  admissionDate: z.string().optional(),
  jobTitle: z.string().optional(),
});

// GET /api/members - Listar membros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
    }

    let query = db.select().from(members).where(eq(members.tenantId, tenantId));

    // Filtros
    const conditions = [eq(members.tenantId, tenantId)];

    if (status) {
      conditions.push(eq(members.status, status as 'ativo' | 'inadimplente' | 'suspenso' | 'cancelado'));
    }

    if (type) {
      conditions.push(eq(members.type, type as 'afiliado' | 'convidado' | 'dependente_maior'));
    }

    if (search) {
      conditions.push(
        or(
          like(members.name, `%${search}%`),
          like(members.cpf, `%${search}%`),
          like(members.email, `%${search}%`)
        )!
      );
    }

    const result = await db
      .select()
      .from(members)
      .where(and(...conditions))
      .orderBy(desc(members.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    // Contar total
    const countResult = await db
      .select({ count: members.id })
      .from(members)
      .where(and(...conditions));

    return NextResponse.json({
      data: result,
      pagination: {
        page,
        limit,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 });
  }
}

// POST /api/members - Criar membro
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createMemberSchema.parse(body);

    const [newMember] = await db
      .insert(members)
      .values({
        ...validated,
        status: 'ativo',
      })
      .returning();

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error creating member:', error);
    return NextResponse.json({ error: 'Erro ao criar membro' }, { status: 500 });
  }
}
