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
**Status:** Em andamento (APIs REST concluídas)

**Entregas concluídas:**
- [x] APIs REST implementadas:
  - [x] `/api/members` - CRUD de associados
  - [x] `/api/spaces` - CRUD de espaços
  - [x] `/api/reservations` - CRUD com verificação de conflitos
  - [x] `/api/payments` - CRUD de pagamentos
- [x] Validação Zod em todas as APIs
- [x] Detecção de conflitos de horário em reservas

**Próximos passos:**
- [ ] Configurar Docker e banco PostgreSQL (precisa Docker local)
- [ ] Executar migrations Drizzle
- [ ] Seed database com dados de teste
- [ ] Conectar páginas ao backend real
- [ ] Autenticação funcional (login/logout)

---

### 📋 M4 - Reservations Core
**Status:** Pendente

**Entregas planejadas:**
- [ ] Calendário interativo (dia/semana/mês)
- [ ] Verificação de conflito de horários
- [ ] Sistema de buffer entre reservas
- [ ] Notificações (email/whatsapp)
- [ ] Reserva recorrente

---

### 📋 M5 - Financeiro
**Status:** Pendente

**Entregas planejadas:**
- [ ] Dashboard financeiro com gráficos
- [ ] CRUD de mensalidades
- [ ] Sistema de inadimplência
- [ ] Integração PIX/pagamentos
- [ ] Relatórios exportáveis

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

**Branch atual:** `feature/m1-foundation`

**Commits:**
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
