# SPEC — Socio Desk: Standards e Práticas de Desenvolvimento

**Documento:** Standards técnicos, design system e práticas de engenharia
**Versão:** 1.0 | **Data:** Junho/2026
**Baseado em:** Micro SaaS Launcher, Frontend Design, Security Audit, Code Reviewer

---

## 1. Visão

Este documento estabelece os padrões de código, design e segurança para o Socio Desk. O objetivo é garantir consistência, manutenibilidade e segurança em todas as fases do desenvolvimento — do MVP à escala.

**Princípios guias:**

1. **Simplicidade primeiro** — Não adicionar complexidade antes de necessário
2. **Segurança por padrão** — Tratar dados de associados como dado sensível
3. **UX consistente** — Seguir padrões do mercado para familiaridade
4. **Código auditável** — Qualquer desenvolvedor deve entender o que o código faz

---

## 2. Design System

### 2.1 Tokens de Design

```typescript
// src/lib/design-system/tokens.ts

export const tokens = {
  // Cores primárias — tema azul profissional
  colors: {
    primary: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#2196F3',  // Base
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',
      900: '#0D47A1',
    },
    // Cores semânticas
    success: '#10B981',   // Verde — confirmações
    warning: '#F59E0B',   // Amarelo — alertas
    danger: '#EF4444',    // Vermelho — erros, bloqueios
    info: '#3B82F6',      // Azul — informações

    // Neutros
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },

  // Tipografia
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },
  },

  // Espaçamento (base 4px)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
  },

  // Bordas
  borderRadius: {
    none: '0',
    sm: '0.125rem',  // 2px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    full: '9999px',
  },

  // Sombras
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },

  // Breakpoints (mobile-first)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index
  zIndex: {
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modalBackdrop: '1040',
    modal: '1050',
    popover: '1060',
    tooltip: '1070',
    toast: '1080',
  },
} as const;
```

### 2.2 Sistema de Cores para o Domínio

```typescript
// src/lib/design-system/domain-colors.ts

/**
 * Cores semânticas específicas do domínio Socio Desk
 * Seguem o princípio: cor comunica estado, não apenas aparência
 */

// Status de associado
export const memberStatusColors = {
  ativo: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: 'text-green-600',
  },
  inadimplente: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: 'text-red-600',
  },
  suspenso: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
  },
  cancelado: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    icon: 'text-gray-500',
  },
} as const;

// Status de reserva
export const reservationStatusColors = {
  pendente: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    icon: 'text-yellow-500',
  },
  confirmada: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: 'text-blue-500',
  },
  cancelada: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-200',
    icon: 'text-gray-400',
  },
  concluida: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: 'text-green-500',
  },
} as const;

// Status de pagamento
export const paymentStatusColors = {
  pending: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    icon: 'text-yellow-500',
  },
  paid: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: 'text-green-500',
  },
  overdue: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: 'text-red-500',
  },
  cancelled: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-200',
    icon: 'text-gray-400',
  },
} as const;

// Categorias de espaço
export const spaceCategoryColors = {
  esportivo: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    icon: 'text-emerald-500',
  },
  social: {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    icon: 'text-purple-500',
  },
  equipamento: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    icon: 'text-amber-500',
  },
} as const;
```

### 2.3 Componentes Base do Design System

```typescript
// src/components/ui/design-system-provider.tsx
import { tokens } from '@/lib/design-system/tokens';

/**
 * Componente provider que injeta tokens no CSS
 * Usado no root layout da aplicação
 */
export function DesignSystemProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        :root {
          --color-primary-50: ${tokens.colors.primary[50]};
          --color-primary-100: ${tokens.colors.primary[100]};
          --color-primary-500: ${tokens.colors.primary[500]};
          --color-primary-700: ${tokens.colors.primary[700]};
          --color-success: ${tokens.colors.success};
          --color-warning: ${tokens.colors.warning};
          --color-danger: ${tokens.colors.danger};
          --font-sans: ${tokens.typography.fontFamily.sans};
          --radius-md: ${tokens.borderRadius.md};
          --radius-lg: ${tokens.borderRadius.lg};
        }
      `}</style>
      {children}
    </>
  );
}

// ============================================
// PATTERNS DE COMPONENTE
// ============================================

/**
 * Estrutura padrão para card de entidade
 * Usado em: membros, espaços, reservas
 */
export interface EntityCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  avatar?: React.ReactNode;
  actions?: React.ReactNode;
  metadata?: Array<{ label: string; value: string }>;
}

/**
 * Estrutura padrão para badge de status
 * Segue domain-colors para consistência
 */
export interface StatusBadgeProps {
  status: keyof typeof memberStatusColors | keyof typeof reservationStatusColors;
  type: 'member' | 'reservation' | 'payment';
  size?: 'sm' | 'md';
}

/**
 * Estrutura padrão para metric card
 * Usado em dashboards
 */
export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: { value: number; positive: boolean };
  icon?: React.ReactNode;
  loading?: boolean;
}
```

---

## 3. Padrões de Código

### 3.1 Estrutura de API Routes

```typescript
// src/app/api/[entity]/route.ts
// Padrão consistente para todas as API routes

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { requireAuth, requirePermission } from '@/lib/auth/permissions';
import {
  createEntitySchema,
  updateEntitySchema,
  querySchema,
} from '@/lib/validations/entity';
import { ZodError } from 'zod';

/**
 * GET /api/[entity]
 * Lista entidades com paginação e filtros
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const session = await requireAuth(request);

    // 2. Permissão
    requirePermission(session.user.role, 'entity:read');

    // 3. Parsing de query params
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
      search: searchParams.get('search') ?? '',
      status: searchParams.get('status'),
      sortBy: searchParams.get('sortBy') ?? 'createdAt',
      sortOrder: searchParams.get('sortOrder') ?? 'desc',
    });

    // 4. Query com tenant isolation
    const data = await db.query.entities.findMany({
      where: (entities, { eq, and, or, ilike }) =>
        and(
          eq(entities.tenantId, session.user.tenantId),
          query.search
            ? or(
                ilike(entities.name, `%${query.search}%`),
                ilike(entities.email, `%${query.search}%`)
              )
            : undefined,
          query.status ? eq(entities.status, query.status) : undefined
        ),
      orderBy: (entities, { desc, asc }) => [
        query.sortOrder === 'desc'
          ? desc(entities[query.sortBy as keyof typeof entities])
          : asc(entities[query.sortBy as keyof typeof entities]),
      ],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });

    const total = await db
      .select({ count: count() })
      .from(entities)
      .where(eq(entities.tenantId, session.user.tenantId));

    return NextResponse.json({
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: total[0].count,
        totalPages: Math.ceil(total[0].count / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[API ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/[entity]
 * Cria nova entidade
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    requirePermission(session.user.role, 'entity:write');

    const body = await request.json();
    const data = createEntitySchema.parse(body);

    const [created] = await db
      .insert(entities)
      .values({
        ...data,
        tenantId: session.user.tenantId,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    // ... error handling padrão
  }
}
```

### 3.2 Validações com Zod

```typescript
// src/lib/validations/member.ts
import { z } from 'zod';

/**
 * Schema de validação para criação de membro
 * Usado em API route e React Hook Form
 */
export const createMemberSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
    .refine(validateCPF, 'CPF inválido'),
  email: z.string().email('E-mail inválido'),
  birthDate: z.string().refine((date) => {
    const age = differenceInYears(new Date(), new Date(date));
    return age >= 18;
  }, 'Associado deve ter pelo menos 18 anos'),
  phoneMobile: z
    .string()
    .regex(/^\(\d{2}\)\s?\d{5}-\d{4}$/, 'Celular inválido'),
  address: z.object({
    street: z.string().min(1, 'Logradouro é obrigatório'),
    number: z.string().min(1, 'Número é obrigatório'),
    district: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().length(2, 'UF deve ter 2 caracteres'),
    zipCode: z
      .string()
      .regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  }),
  workplaceId: z.uuid('Local de trabalho inválido'),
  registrationNumber: z.string().min(1, 'Matrícula é obrigatória'),
  admissionDate: z.string().refine(
    (date) => new Date(date) <= new Date(),
    'Data de admissão não pode ser futura'
  ),
  jobTitle: z.string().min(1, 'Cargo é obrigatório'),
  photo: z.instanceof(File).optional(),
});

export const updateMemberSchema = createMemberSchema.partial();
export const queryMemberSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ativo', 'inadimplente', 'suspenso', 'cancelado']).optional(),
  workplaceId: z.string().uuid().optional(),
  sortBy: z.enum(['name', 'createdAt', 'cpf']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

### 3.3 Tipos e Interfaces

```typescript
// src/types/api.ts
/**
 * Padrão de resposta de API consistente
 * Usado em todas as rotas
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  code?: string;
  details?: ZodIssue[];
}

// ============================================
// PADRÃO DE CRIAÇÃO DE HOOKS
// ============================================

/**
 * Estrutura padrão para hooks de dados
 * Segue convenção: use + EntityName + (opcional: Mode)
 */
export interface UseListOptions<TFilter, TSort> {
  filters?: TFilter;
  sort?: TSort;
  page?: number;
  limit?: number;
  enabled?: boolean; // Para lazy loading
}

export interface UseListResult<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    totalPages: number;
  };
  actions: {
    refetch: () => void;
    setPage: (page: number) => void;
  };
}

/**
 * Exemplo de uso:
 * const { data, isLoading, actions } = useMembersList({
 *   filters: { status: 'ativo' },
 *   page: 1,
 * });
 */
```

### 3.4 Convenções de Nomenclatura

```typescript
// Regras de nomenclatura seguidas no projeto

// === ARQUIVOS ===
// Componentes: PascalCase
// - components/ui/Button.tsx
// - components/reservations/Calendar.tsx

// Hooks: camelCase com prefixo "use"
// - hooks/use-auth.ts
// - hooks/use-reservations.ts

// Utils: camelCase
// - lib/utils/cpf.ts
// - lib/utils/date.ts

// Schema/Validação: camelCase
// - lib/validations/member.ts
// - lib/validations/reservation.ts

// === VARIÁVEIS E FUNÇÕES ===
// Funções: verbos no imperativo
const createMember = () => {};
const getReservations = async () => {};
const calculateOccupancy = () => {};

// Variáveis booleanas: prefixo is/are/has/should
const isLoading = true;
const hasPermission = false;
const shouldBlock = true;

// Constantes: SCREAMING_SNAKE_CASE para configs globais
const MAX_RESERVATION_DURATION = 480; // minutos
const DEFAULT_BUFFER_MINUTES = 15;

// === NOMENCLATURA DE ROTAS ===
// Rotas: kebab-case
// - /escritorio/associados
// - /escritorio/reservas/nova
// - /admin/configuracoes

// Parâmetros dinâmicos: camelCase
// - /associados/[memberId]
// - /reservas/[reservationId]

// === NOMENCLATURA DE BANCO ===
// Tabelas: snake_case, plural
// - members, reservations, spaces, payments

// Colunas: snake_case
// - created_at, updated_at, is_active, cpf

// Índices: idx_[tabela]_[coluna(s)]
// - idx_members_tenant
// - idx_reservations_space_date
```

---

## 4. Padrões Multi-Tenant

### 4.1 Isolation Patterns

```typescript
// src/lib/tenant/isolation.ts
/**
 * Padrão de isolamento multi-tenant
 * Garante que todo acesso ao banco passe pelo tenant correto
 */

import { db } from '@/lib/db/client';
import { tenants, members, reservations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Extrai tenant ID da sessão do usuário
 * THROW se não houver sessão ou tenant
 */
export async function getTenantFromSession(session: Session) {
  if (!session.user.tenantId) {
    throw new Error('UNAUTHORIZED: No tenant context');
  }
  return session.user.tenantId;
}

/**
 * Query builder helper que injeta tenant_id automaticamente
 * Previne vazamento de dados entre tenants
 */
export function withTenant<T extends { tenantId: unknown }>(
  query: ReturnType<typeof db.select>,
  tenantId: string
) {
  return query.where(eq(T.tenantId, tenantId));
}

/**
 * Middleware para validar acesso a entidade do tenant
 * Usado em API routes antes de retornar dados
 */
export async function validateTenantAccess<T extends { tenantId: string }>({
  entity,
  entityId,
  tenantId,
  errorMessage = 'Entity not found or access denied',
}: {
  entity: T;
  entityId: string;
  tenantId: string;
  errorMessage?: string;
}) {
  const record = await db.query[entity].findFirst({
    where: (table, { eq, and }) =>
      and(eq(table.id, entityId), eq(table.tenantId, tenantId)),
  });

  if (!record) {
    throw new ForbiddenError(errorMessage);
  }

  return record;
}

// ============================================
// RLS — Row Level Security (Postgres)
// ============================================

/**
 * Políticas RLS para isolamento de tenants
 * Aplicadas no banco de dados, complementam a lógica da aplicação
 */

// Habilitar RLS na tabela
// ALTER TABLE members ENABLE ROW LEVEL SECURITY;

// Política: membros só veem dados do próprio tenant
/*
CREATE POLICY tenant_isolation ON members
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Para super admin (admin master), bypass RLS
CREATE POLICY admin_bypass ON members
  FOR ALL
  USING (
    current_setting('app.current_user_role') = 'admin_master'
    AND current_user = 'authenticator'  -- ajuste conforme seu setup
  );
*/

// ============================================
// CONTEXTO DE TENANT NO NEXT.JS
// ============================================

// src/lib/tenant/context.tsx
import { createContext, useContext } from 'react';

interface TenantContextValue {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
  settings: {
    gracePeriodDays: number;
    autoBlockEnabled: boolean;
    primaryColor: string;
  };
}

export const TenantContext = createContext<TenantContextValue | null>(null);

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
```

---

## 5. Segurança

### 5.1 Checklist de Segurança (OWASP + LGPD)

```markdown
## CHECKLIST DE SEGURANÇA — Socio Desk

### Autenticação
- [ ] Senhas hasheadas com bcrypt (cost factor ≥ 12)
- [ ] Rate limiting em endpoints de login (5 tentativas/15min)
- [ ] Sessões com expiração (7 dias max)
- [ ] Refresh token rotativo
- [ ] Logout invalida sessão no servidor
- [ ] Recuperação de senha: token de uso único, expira em 1h
- [ ] 2FA disponível (Fase 2+)

### Autorização
- [ ] RBAC implementado (admin_master, admin, team, member)
- [ ] Verificação de permissão em TODA API route
- [ ] Tenant isolation em todas as queries
- [ ] Princípio do menor privilégio
- [ ] Audit log de ações sensíveis

### Dados
- [ ] CPF não exposto em logs ou URLs
- [ ] Dados pessoais em repouso: criptografia transparente (Postgres)
- [ ] Backups criptografados
- [ ] Dados de teste não contêm dados reais
- [ ] Retention policy implementada (LGPD)

### Input/Output
- [ ] Validação de input com Zod em todas as APIs
- [ ] Sanitização de HTML (XSS)
- [ ] Parameterized queries (Drizzle já faz)
- [ ] Upload de arquivos: validação de tipo (mime), tamanho máximo
- [ ] URLs de redirect validadas (open redirect)
- [ ] CORS configurado corretamente

### Infraestrutura
- [ ] HTTPS forçado
- [ ] Headers de segurança (CSP, HSTS, X-Frame-Options)
- [ ] Variables de ambiente em segredo (não em código)
- [ ] Secrets rodacionais (AUTH_SECRET, API keys)
- [ ] Rate limiting global
- [ ] WAF (Web Application Firewall) em produção

### Monitoramento
- [ ] Logs de erro sem dados sensíveis
- [ ] Alertas para falhas de autenticação
- [ ] Alertas para acesso anômalo
- [ ] Dashboard de segurança (admin master)
```

### 5.2 Headers de Segurança

```typescript
// src/middleware/security-headers.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Headers de segurança aplicados a todas as respostas
 */
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://*.backblazeb2.com https://*.minio",
    "connect-src 'self' https://*.brevo.com https://*.backblazeb2.com",
    "frame-ancestors 'none'",
  ].join('; '),
};

export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
```

### 5.3 Validação de Upload de Fotos

```typescript
// src/lib/storage/validation.ts
import { z } from 'zod';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export const photoUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => ALLOWED_MIME_TYPES.includes(file.type),
    'Apenas JPEG, PNG ou WebP são permitidos'
  ).refine(
    (file) => file.size <= MAX_FILE_SIZE,
    'Arquivo deve ter no máximo 2MB'
  ),
});

/**
 * Validação client-side antes do upload
 * Complementa validação server-side
 */
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo inválido' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Arquivo muito grande (máx 2MB)' };
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Extensão não permitida' };
  }

  return { valid: true };
}

/**
 * Compressão client-side antes do upload
 * Reduz size mantendo qualidade aceitável
 */
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Redimensiona para máximo 400x400
      const maxDim = 400;
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = (height / width) * maxDim;
        width = maxDim;
      } else if (height > maxDim) {
        width = (width / height) * maxDim;
        height = maxDim;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Falha ao comprimir imagem'));
          }
        },
        'image/jpeg',
        0.8 // Quality 80%
      );
    };
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
}
```

---

## 6. Code Review Checklist

### 6.1 Checklist para PRs

```markdown
## CODE REVIEW CHECKLIST — Socio Desk

### Componentes
- [ ] Nome de componente significativo
- [ ] Props documentadas com JSDoc/TYPES
- [ ] Estados (loading, error, empty) tratados
- [ ] Acessibilidade: aria-labels, foco gerenciado
- [ ] Responsivo (mobile-first)
- [ ] Sem hardcoded strings (i18n)
- [ ] Sem console.log

### API Routes
- [ ] Autenticação verificada
- [ ] Permissão validada
- [ ] Validação de input (Zod)
- [ ] Erros tratados comtry/catch
- [ ] Status codes corretos (201, 400, 401, 403, 404, 500)
- [ ] Dados sensíveis não em logs
- [ ] Tenant isolation verificada
- [ ] Rate limiting se aplicável

### Database
- [ ] Migrations reversíveis
- [ ] Índices para queries frequentes
- [ ] Sem N+1 queries
- [ ] Transações onde necessário
- [ ] Queries testadas com dataset real

### Segurança
- [ ] Input sanitizado
- [ ] SQL injection prevenido (Drizzle faz)
- [ ] XSS prevenido
- [ ] CSRF tokens (se formulário POST)
- [ ] CORS configurado
- [ ] Secrets em env, não em código

### Performance
- [ ] Lazy loading de componentes pesados
- [ ] Imagens otimizadas
- [ ] Caching de queries se aplicável
- [ ] Sem memory leaks em hooks
- [ ] Bundle size não aumentou significativamente

### Testes
- [ ] Unit tests para lógica complexa
- [ ] E2E para fluxos críticos (login, reserva)
- [ ] Cobertura de edge cases
- [ ] Testes passam localmente
```

### 6.2 Padrões de Commits

```bash
# Formato Conventional Commits
<tipo>(<escopo>): <descrição>

# Tipos
feat:     Nova funcionalidade
fix:      Correção de bug
docs:     Documentação
style:    Formatação (CSS, indentação)
refactor: Refatoração (sem mudança de comportamento)
test:     Adição de testes
chore:    Tarefas de build, CI, deps

# Escopos
api, auth, members, reservations, spaces, payments, ui, db, config

# Exemplos
feat(members): adicionar campo telefone recado no cadastro
fix(reservations): corrigir conflito de horário no mesmo espaço
docs(api): documentar endpoint de geração de relatório
refactor(auth): extrair validação de sessão para hook
test(spaces): adicionar testes de criação de espaço

# Regras
- Máximo 72 caracteres na primeira linha
- Descrição em português (MVP), pode ser inglês em código
- Issues referenciados: Fixes #123
```

### 6.3 Critérios de Merge

```markdown
## CRITÉRIOS PARA MERGE — PR em Socio Desk

### Obrigatórios (bloqueantes)
- [ ] CI/CD passando (lint, typecheck, tests)
- [ ] Code review approval (mínimo 1)
- [ ] Sem conflitos com main
- [ ] Descrição do PR completa
- [ ] Testes novos passando

### Recomendados
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Breaking changes comunicados
- [ ] Screenshots/gifs do comportamento

### Situacionais
- [ ] Revisão de UX para mudanças de interface
- [ ] Revisão de DB para mudanças de schema
- [ ] Revisão de segurança para auth/pagamentos
```

---

## 7. Fluxo de Desenvolvimento

### 7.1 Branch Strategy

```
main (produção)
├── develop (integração)
│   ├── feature/SD-XXX-descricao-curta
│   ├── feature/SD-XXX-outra-feature
│   ├── hotfix/SD-XXX-correcao-urgente
│   └── release/v1.0.0
```

### 7.2 Issue Format

```markdown
## ISSUE TEMPLATE — Socio Desk

### Informações
- **ID:** SD-XXX
- **Tipo:** Feature | Bug | Chore
- **Prioridade:** Alta | Média | Baixa
- **Estimativa:** X dias

### Descrição
[Descrição clara do que precisa ser feito]

### Critérios de Aceite
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

### Tarefas
- [ ] Tarefa 1
- [ ] Tarefa 2

### Dependências
- Bloco por: [outro issue, infra, decisão pendente]

### Notas
[Contexto adicional, links, screenshots]
```

### 7.3 Definition of Done

```markdown
## DEFINITION OF DONE — Socio Desk

### Para código
- [ ] Implementação completa
- [ ] Testes escritos e passando
- [ ] Code review aprovado
- [ ] Lint passando
- [ ] TypeScript sem erros
- [ ] Documentado (se necessário)

### Para features
- [ ] Critérios de aceite cumpridos
- [ ] Testado manualmente
- [ ] Funciona em mobile
- [ ] Acessibilidade verificada
- [ ] Dados sensíveis protegidos

### Para bugs
- [ ] Reproduzido localmente
- [ ] Causa raiz identificada
- [ ] Corrigido
- [ ] Não reintroduz em outras áreas
- [ ] Teste adicionado para prevenir regressão
```

---

## 8. Monitoramento e Observabilidade

### 8.1 Logging

```typescript
// src/lib/logging/index.ts
/**
 * Sistema de logging estruturado
 */

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }));
  },

  error: (message: string, error?: Error, context?: Record<string, unknown>) => {
    // Não loga dados sensíveis
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      timestamp: new Date().toISOString(),
      ...context,
    }));
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }));
  },

  // Para auditoria (nunca logs em produção, vai para DB)
  audit: async (data: {
    action: string;
    entity: string;
    entityId?: string;
    userId?: string;
    tenantId?: string;
    changes?: unknown;
    ipAddress?: string;
  }) => {
    await db.insert(auditLogs).values({
      ...data,
      createdAt: new Date(),
    });
  },
};

// Uso
logger.info('Reserva criada', {
  reservationId: '123',
  memberId: '456',
  tenantId: '789',
});

logger.error('Falha ao enviar e-mail', error, {
  memberId: '456',
  template: 'reservation-confirmation',
});
```

### 8.2 Métricas de Saúde

```typescript
// src/app/api/health/route.ts
/**
 * Endpoint de health check para monitoramento
 */

export async function GET() {
  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    email: await checkEmail(),
  };

  const healthy = Object.values(checks).every((c) => c.healthy);

  return NextResponse.json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    checks,
  }, { status: healthy ? 200 : 503 });
}

async function checkDatabase() {
  try {
    await db.execute(sql`SELECT 1`);
    return { healthy: true };
  } catch {
    return { healthy: false, error: 'Database connection failed' };
  }
}
```

---

## 9. Histórico de Versões

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 23/06/2026 | Versão inicial — standards, design system, segurança, code review |
