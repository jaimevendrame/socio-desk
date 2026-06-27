import { NextRequest, NextResponse } from 'next/server';
import { db, pool } from '@/lib/db';
import { members, workplaces } from '@/lib/db/schema';
import { eq, and, like, or, desc } from 'drizzle-orm';
import { z } from 'zod';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';

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
    const rl = checkRateLimit(request, 'api');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
          },
        }
      );
    }
    const { searchParams } = new URL(request.url);
    const queryTenantId = searchParams.get('tenantId');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const cpf = searchParams.get('cpf');
    const registrationNumber = searchParams.get('registrationNumber');
    const workplaceId = searchParams.get('workplaceId');
    const userIdFilter = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Filtro por userId: raw SQL, não precisa de tenantId
    if (userIdFilter) {
      try {
        const result = await pool.query(
          'SELECT id, name, email FROM members WHERE user_id = $1 LIMIT 1',
          [userIdFilter],
        );
        if (!result.rows?.[0]) {
          return NextResponse.json({ data: [], pagination: { page: 1, limit: 1, total: 0, totalPages: 0 } });
        }
        return NextResponse.json({
          data: [result.rows[0]],
          pagination: { page: 1, limit: 1, total: 1, totalPages: 1 },
        });
      } catch (err) {
        console.error('[GET /members userIdFilter] error:', err);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
      }
    }

    // Resolve tenantId: query param overrides session tenantId
    const sessionData = await getSessionWithTenant(request.headers);
    const sessionTenantId = sessionData?.user.tenantId;
    const tenantId = queryTenantId || sessionTenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
    }

    const userId = sessionData?.user.id;

    const response = await withTenantContext(tenantId, userId, async () => {
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

      if (cpf) {
        conditions.push(like(members.cpf, `%${cpf}%`));
      }

      if (registrationNumber) {
        conditions.push(like(members.registrationNumber, `%${registrationNumber}%`));
      }

      if (workplaceId) {
        conditions.push(eq(members.workplaceId, workplaceId));
      }

      const result = await db
        .select()
        .from(members)
        .where(and(...conditions))
        .orderBy(desc(members.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);

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
    });

    response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));
    return response;
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 });
  }
}

// POST /api/members - Criar membro
export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 'write');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
          },
        }
      );
    }
    const sessionData = await getSessionWithTenant(request.headers);
    const userId = sessionData?.user.id;
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 400 });
    }

    const body = await request.json();
    const validated = createMemberSchema.parse(body);

    const response = await withTenantContext(tenantId, userId, async () => {
      const [newMember] = await db
        .insert(members)
        .values({
          ...validated,
          tenantId,
          status: 'ativo',
        })
        .returning();

      return NextResponse.json(newMember, { status: 201 });
    });

    response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error creating member:', error);
    return NextResponse.json({ error: 'Erro ao criar membro' }, { status: 500 });
  }
}
