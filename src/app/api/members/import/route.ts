import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { withTenantContext } from '@/lib/db/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';
import Papa from 'papaparse';

const importRowSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  cpf: z
    .string()
    .min(11, 'CPF deve ter 11 dígitos')
    .max(14)
    .transform((v) => v.replace(/\D/g, '')),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  telefone_movel: z.string().optional(),
  telefone_residencial: z.string().optional(),
  tipo: z.enum(['afiliado', 'convidado', 'dependente_maior']).default('afiliado'),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  cep: z.string().optional(),
  local_trabalho: z.string().optional(),
  matricula: z.string().optional(),
  data_admissao: z.string().optional(),
  cargo: z.string().optional(),
});

interface ImportResult {
  success: number;
  errors: Array<{ row: number; data: Record<string, string>; error: string }>;
  duplicates: Array<{ row: number; cpf: string; name: string }>;
}

function formatDateBRtoISO(dateStr: string): string {
  const cleaned = dateStr.trim();
  const parts = cleaned.split(/[\/\-\.]/);
  if (parts.length !== 3) return cleaned;
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (parseInt(clean[9]) !== remainder) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return parseInt(clean[10]) === remainder;
}

// POST /api/members/import
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    const allowedExtensions = ['.csv'];
    const hasValidExtension = allowedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      return NextResponse.json(
        { error: 'Apenas arquivos CSV são permitidos' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (máximo 5MB)' },
        { status: 400 }
      );
    }

    const text = await file.text();

    const parseResult = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      transform: (value) => value.trim(),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Erro ao processar arquivo CSV',
          details: parseResult.errors.slice(0, 5),
        },
        { status: 400 }
      );
    }

    const rows = parseResult.data;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Arquivo vazio ou sem dados válidos' }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json(
        { error: 'Limite de 500 registros por importação excedido' },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: 0,
      errors: [],
      duplicates: [],
    };

    await withTenantContext(tenantId, userId, async () => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because header is row 1 and data starts at row 2

        const parsed = importRowSchema.safeParse(row);
        if (!parsed.success) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: parsed.error.issues.map((e: z.ZodIssue) => e.message).join('; '),
          });
          continue;
        }

        const data = parsed.data;

        // Validate CPF algorithm
        if (!validateCPF(data.cpf)) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: `CPF inválido: ${data.cpf}`,
          });
          continue;
        }

        // Check for duplicates within the same tenant
        const existingMember = await db
          .select({ id: members.id, name: members.name })
          .from(members)
          .where(and(eq(members.cpf, data.cpf), eq(members.tenantId, tenantId)))
          .limit(1);

        if (existingMember.length > 0) {
          result.duplicates.push({
            row: rowNumber,
            cpf: data.cpf,
            name: data.nome,
          });
          continue;
        }

        // Format dates
        const birthDate = formatDateBRtoISO(data.data_nascimento);
        const admissionDate = data.data_admissao
          ? formatDateBRtoISO(data.data_admissao)
          : undefined;

        // Create member
        await db.insert(members).values({
          tenantId,
          name: data.nome,
          cpf: data.cpf,
          birthDate,
          email: data.email || null,
          phoneMobile: data.telefone_movel || null,
          phoneHome: data.telefone_residencial || null,
          type: data.tipo,
          addressStreet: data.logradouro || null,
          addressNumber: data.numero || null,
          addressDistrict: data.bairro || null,
          addressCity: data.cidade || null,
          addressState: data.estado || null,
          addressZipCode: data.cep || null,
          registrationNumber: data.matricula || null,
          admissionDate: admissionDate || null,
          jobTitle: data.cargo || null,
          status: 'ativo',
        });

        result.success++;
      }
    });

    const response = NextResponse.json(
      {
        message: `Importação concluída`,
        imported: result.success,
        errors: result.errors.length,
        duplicates: result.duplicates.length,
        details: result,
      },
      { status: 200 }
    );

    response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));
    return response;
  } catch (error) {
    console.error('Error importing members:', error);
    return NextResponse.json({ error: 'Erro ao importar membros' }, { status: 500 });
  }
}
