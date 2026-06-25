# Socio Desk - Plano de Desenvolvimento

## Visão Geral

Socio Desk é um SaaS multi-tenant para gestão de reservas de associações recreativas. Desenvolvido com Next.js 16, TypeScript, Drizzle ORM e Better Auth.

---

## Milestones

### ✅ M1 - Foundation
**Status:** Concluído em 23/06/2026

**Entregas:**
- [x] Setup Next.js 16 + App Router
- [x] TypeScript configurado
- [x] Docker Compose (Postgres + MinIO)
- [x] Drizzle ORM + Schema completo (14 tabelas)
- [x] Better Auth configurado
- [x] Layout base (sidebar/header responsivo)
- [x] Páginas de autenticação (login, register, forgot-password)
- [x] Middleware de proteção de rotas
- [x] Design tokens (shadcn/ui)
- [x] Script de seed com dados mock
- [x] README.md com instruções
- [x] Build passando sem erros

**Arquivos principais:**
```
src/lib/db/schema.ts          # Schema completo do banco
src/lib/auth/                 # Configuração Better Auth
src/components/layout/        # Sidebar, Header
src/app/(auth)/              # Login, Register, Forgot Password
docker-compose.yml           # Postgres + MinIO
```

---

### ✅ M2 - Interface Core
**Status:** Concluído em 23/06/2026

**Entregas:**
- [x] `/escritorio/associados` - Listagem com filtros e stats
- [x] `/escritorio/associados/novo` - Formulário de cadastro
- [x] `/escritorio/associados/[id]` - Detalhes com tabs (dados, dependentes, reservas, pagamentos)
- [x] `/escritorio/espacos` - Grid de espaços com categorias
- [x] `/escritorio/espacos/novo` - Formulário de criação
- [x] `/escritorio/espacos/[id]` - Detalhes com configurações
- [x] `/escritorio/reservas` - Calendário visual mensal
- [x] `/escritorio/reservas/nova` - Formulário de reserva
- [x] `/escritorio/financeiro` - Dashboard financeiro, inadimplentes
- [x] `/dashboard/perfil` - Perfil do membro com tabs
- [x] `/dashboard/reservar` - Wizard de 3 etapas
- [x] `/dashboard/reservas` - Minhas reservas

**Todas páginas com:**
- Mock data realista
- UI completa com shadcn/ui
- Estados de loading
- Toasts de feedback

---

### 🔄 M3 - Backend Essentials
**Status:** Concluido

**Entregas:**
- [x] APIs REST implementadas (members, spaces, reservations, payments)
- [x] Validação Zod
- [x] Detecção de conflitos de horário
- [x] Páginas conectadas ao backend
- [x] Hooks e Context reutilizáveis
- [x] Banco de dados configurado (Docker + PostgreSQL)
- [x] Schema aplicado (14 tabelas)
- [x] Seed executado com dados de teste
- [x] **Autenticação básica implementada**

---

### ✅ M4 - Reservations Core
**Status:** Concluído em 24/06/2026

**Entregas:**
- [x] `/escritorio/reservas` - Calendário interativo (dia/semana/mês)
- [x] `/escritorio/reservas` - Lista de reservas do dia com refresh
- [x] `/api/reservations` - CRUD completo com validação Zod
- [x] `/api/spaces/availability` - API de disponibilidade
- [x] `/api/reservations/check-conflict` - Verificação de conflitos
- [x] Detecção de conflitos de horário com buffer configurável
- [x] Sistema de buffer entre reservas (configurável por espaço)
- [x] Reserva recorrente (diária/semanal)
- [x] Formulário de reserva com espaço, data, horário, membro
- [x] Dashboard do escritório conectado ao backend
- [x] Hooks reutilizáveis (useReservations, useConflicts, useAvailability)

**Pendente (Fase 2):**
- [ ] Notificações (email/whatsapp) via Brevo

---

### ✅ M5 - Financeiro
**Status:** Concluído em 26/06/2026

**Entregas:**
- [x] `/escritorio/financeiro` - Dashboard financeiro com stats (recebido, pendente, inadimplentes)
- [x] `/escritorio/financeiro` - Lista de pagamentos com filtros por status
- [x] `/api/payments` - CRUD completo com estatísticas e paginação
- [x] `/api/payments/[id]/mark-paid` - API para baixa de pagamento
- [x] `PaymentDialog` - Componente de diálogo para registrar baixa
- [x] `RegisterPaymentDialog` - Componente para registrar nova mensalidade
- [x] `src/lib/finance/subscription-generator.ts` - Geração automática de mensalidades
- [x] `src/lib/finance/debt-checker.ts` - Verificação de inadimplência com auto-bloqueio
- [x] `/api/cron/check-overdue` - Endpoint para verificar pagamentos vencidos
- [x] `/api/cron/generate-subscriptions` - Endpoint para gerar mensalidades do mês
- [x] `/api/reports/financial` - Relatório exportável em CSV
- [x] Hook `usePayments` com tipos corretos
- [x] Bloqueio automático de inadimplentes via cron job
- [x] Desbloqueio automático ao quitar débitos

**Pendente:**
- [ ] Dashboard com gráficos (Chart.js/Recharts)
- [ ] Integração PIX/pagamentos online (Fase 2)

---

### 📋 M6 - Polish & Deploy
**Status:** Pendente

**Entregas planejadas:**
- [ ] Testes E2E (Playwright)
- [ ] Documentação completa
- [ ] CI/CD (GitHub Actions)
- [ ] Deploy (Vercel/Railway)
- [ ] Monitoring (Sentry)

---

### 🎨 M7 - Design System v2
**Status:** Concluido (26/06/2026)

**Direção visual:** Professional SaaS (Linear/Vercel inspired) — sofisticado, minimalista, consistente

**Entregas:**
- [x] `src/app/globals.css` - Design tokens profissionais
- [x] `src/app/layout.tsx` - Inter font configurado
- [x] `/login` - Split layout com branding escuro
- [x] `/dashboard` - Stats cards + stagger animations
- [x] `/escritorio` - Painel admin com hierarquia visual
- [x] `/escritorio/financeiro` - Gráficos com nova paleta
- [x] `components/layout/sidebar.tsx` - Sidebar redesenhada
- [x] `components/layout/header.tsx` - Header com backdrop blur
- [x] `components/theme/theme-toggle.tsx` - Toggle dark/light mode
- [x] `components/animations/fade-in.tsx` - Motion utilities (Framer Motion)
- [x] Dark mode consistente implementado

**Tokens de Design v2:**
| Token | Valor | Uso |
|-------|-------|-----|
| Background | `#FAFAFA` | Fundo off-white (nunca puro branco) |
| Foreground | `#18181B` | Texto principal (zinc-900) |
| Brand Primary | `#16a34a` | CTAs, destaques (emerald-600) |
| Brand Light | `#22c55e` | Hovers, accents |
| Muted | `#71717A` | Texto secundário (zinc-500) |
| Border | `rgba(0,0,0,0.06)` | Bordas sutis, não cinza |
| Error | `#dc2626` | Status de erro |
| Warning | `#ca8a04` | Status de alerta (yellow-600) |

**Type Scale** — usa Tailwind padrão (text-xs a text-3xl via classe)

**Shadows (brand tint):**
- `--shadow-sm`: 0 1px 3px rgba(34,197,94,0.04)
- `--shadow-md`: 0 4px 6px rgba(34,197,94,0.04)
- `--shadow-lg`: 0 10px 15px rgba(34,197,94,0.06)

**Animações (Framer Motion):**
- Fade + translateY(8px): 200ms, ease [0.16,1,0.3,1]
- Stagger: 40ms entre elementos
- Hover card: scale(1.01) + y(-2px)
- prefers-reduced-motion respeitado

---

## Arquitetura

### Stack Tecnológico
| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16, React, TypeScript |
| UI | shadcn/ui, Tailwind CSS |
| Backend | Next.js API Routes |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Auth | Better Auth |
| Storage | MinIO (S3-compatible) |
| Deploy | Vercel |

### Estrutura de Pastas
```
socio-desk/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/           # Páginas de autenticação
│   │   ├── (dashboard)/      # Portal do membro
│   │   ├── (office)/         # Painel do escritório
│   │   ├── (admin)/          # Painel admin tenant
│   │   ├── (master)/         # Painel master
│   │   └── api/              # API routes
│   ├── components/
│   │   ├── layout/           # Sidebar, Header
│   │   └── ui/               # shadcn/ui components
│   └── lib/
│       ├── db/               # Drizzle ORM
│       ├── auth/             # Better Auth
│       └── design-system/    # Tokens
├── scripts/
│   └── db/                   # Migrations, seed
├── docker-compose.yml
└── docs/
    └── PLANS.md             # Este arquivo
```

---

## Repositório

**GitHub:** https://github.com/jaimevendrame/socio-desk

**Branch atual:** `main`

**Commits:**
- `268dd01` - feat(financeiro): M5 - Sistema de pagamentos e inadimplência
- `50aa452` - feat: completar M4 - Calendário interativo
- `9d3b1a7` - fix: corrigir formulário e lista de reservas
- `c33966f` - feat: M4 - Reservations Core
- `d91142c` - feat: M3 - Backend Essentials - Authentication & API Routes
- `c37949a` - feat: M2 - Interface Core
- `9ddb56d` - feat: M1 - Foundation
- `ceb3435` - Initial commit from Create Next App

---

## Como Contribuir

1. Criar branch: `git checkout -b feature/ nome-da-feature`
2. Desenvolver a feature
3. Commit: `git commit -m "feat: descrição"`
4. Push: `git push origin feature/nome`
5. Criar Pull Request

---

## Contato

Desenvolvido por Jaime Vendrame
