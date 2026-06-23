import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { spaces } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const createSpaceSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(['esportivo', 'social', 'equipamento']),
  bufferMinutes: z.number().int().min(0).default(15),
  minReservationMinutes: z.number().int().min(15).default(30),
  maxReservationMinutes: z.number().int().min(30).default(480),
  maxAdvanceDays: z.number().int().min(1).default(30),
  maxReservationsPerDay: z.number().int().optional(),
  openTime: z.string().default('06:00'),
  closeTime: z.string().default('22:00'),
  hasCost: z.boolean().default(false),
  costAmount: z.number().optional(),
  isActive: z.boolean().default(true),
});

// GET /api/spaces - Listar espaços
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
    }

    const conditions = [eq(spaces.tenantId, tenantId)];

    if (category) {
      conditions.push(eq(spaces.category, category as 'esportivo' | 'social' | 'equipamento'));
    }

    if (active !== null) {
      conditions.push(eq(spaces.isActive, active === 'true'));
    }

    const result = await db
      .select()
      .from(spaces)
      .where(and(...conditions))
      .orderBy(desc(spaces.createdAt));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching spaces:', error);
    return NextResponse.json({ error: 'Erro ao buscar espaços' }, { status: 500 });
  }
}

// POST /api/spaces - Criar espaço
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createSpaceSchema.parse(body);

    const [newSpace] = await db
      .insert(spaces)
      .values({
        tenantId: validated.tenantId,
        name: validated.name,
        description: validated.description,
        category: validated.category,
        bufferMinutes: validated.bufferMinutes,
        minReservationMinutes: validated.minReservationMinutes,
        maxReservationMinutes: validated.maxReservationMinutes,
        maxAdvanceDays: validated.maxAdvanceDays,
        maxReservationsPerDay: validated.maxReservationsPerDay,
        openTime: validated.openTime,
        closeTime: validated.closeTime,
        hasCost: validated.hasCost,
        costAmount: validated.costAmount?.toString(),
        isActive: validated.isActive,
      })
      .returning();

    return NextResponse.json(newSpace, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error creating space:', error);
    return NextResponse.json({ error: 'Erro ao criar espaço' }, { status: 500 });
  }
}
