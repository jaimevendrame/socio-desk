@AGENTS.md

# Socio Desk — Contexto do Projeto

**Versão:** MVP em desenvolvimento
**Stack:** Next.js 16 + Drizzle ORM + Better Auth + PostgreSQL + Coolify
**Data:** Junho/2026
**Status:** M5 Financeiro completo ✅ | M7 Design System v2 completo ✅

---

## 1. O que é

Socio Desk é um SaaS multi-tenant para gestão de reservas de associações recreivas (clubes). Cada associação é um tenant independente — associados reservam espaços pelo portal, escritório gerencia com dashboards.

---

## 2. Personas

| Persona | Descrição |
|--------|-----------|
| **Associado** | Membro — reserva espaços, vê histórico |
| **Equipe Escritório** | Atendentes — reservas balcão, consulta associados |
| **Admin Tenant** | Gestor do clube — espaços, regras, equipe |
| **Admin Master** | Dono SaaS — gerencia tenants, planos, visão global |

---

## 3. Modelo de Negócio

- Receita: Assinatura mensal/anual por tenant
- Planos: Básico (100 associados), Profissional (500), Enterprise (ilimitado)
- MVP NÃO inclui billing/pagamentos online — baixa manual no escritório

---

## 4. Features MVP

### 4.1 Gestão de Associados
- Cadastro de afiliados (servidores efetivos)
- Cadastro de dependentes (cônjuge, filhos)
- Busca: nome, CPF, matrícula, local de trabalho
- Importação CSV/Excel
- Bloqueio automático de inadimplentes

### 4.2 Espaços e Recursos
- Quadras, quiosques, sinuca, materiais esportivos
- Disponibilidade por dia/horário
- Regras por espaço (limite reservas, tarifação, antecedência)

### 4.3 Reservas
- Calendário visual de disponibilidade
- Reserva pelo associado (autoatendimento)
- Reserva pelo escritório
- **Detecção automática de conflitos**
- Cancelamento com regras

### 4.4 Financeiro
- Cadastro de mensalidades
- Baixa manual de pagamento
- Bloqueio inadimplentes automático
- Dashboard com gráficos (Recharts)
- Relatório exportável (CSV)
- Geração automática de mensalidades (cron) automático
- Dashboard com gráficos (Recharts)
- Relatório exportável (CSV)
- Geração automática de mensalidades (cron)

### 4.5 Notificações
- Confirmação via e-mail (Brevo)
- Lembrete de pagamento

---

## 5. Stack Técnica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16 (App Router), React 18, TypeScript |
| Estilização | Tailwind CSS, shadcn/ui |
| ORM | Drizzle ORM |
| Auth | Better Auth |
| Database | PostgreSQL 16 (Coolify) |
| E-mail | Brevo (Sendinblue) |
| Charts | Recharts |
| Storage | MinIO (local), Backblaze B2 (prod) |
| Deploy | Coolify na VPS |

---

## 6. Estrutura de Pastas

socio-desk/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── (office)/
│   │   ├── (admin)/
│   │   ├── (master)/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── charts/
│   └── lib/
│       ├── db/
│       ├── auth/
│       ├── email/
│       └── tenant/
├── docker-compose.yml
└── package.json

---

## 7. Documentação

Documentos de referência em `../socio-desk-docs/`:

| Arquivo | Conteúdo |
|---------|----------|
| `socio-desk-prd.md` | Requisitos de negócio |
| `socio-desk-spec-complementar.md` | Dependentes, conflitos, inadimplência |
| `socio-desk-dev-setup-v1.1.md` | Setup completo |
| `socio-desk-standards.md` | Design system, código, segurança |

---

## 8. Plano de Desenvolvimento (Milestones)

| Milestone | Duração | Objetivo |
|-----------|---------|----------|
| **M1 Foundation** | 1-2 sem | Setup, DB, Auth, Layout |
| **M2 Interface Core** | 2 sem | UI com mock data |
| **M3 Backend Essentials** | 2 sem | Spaces, Members |
| **M4 Reservations** | 2-3 sem | Sistema de reservas |
| **M5 Financeiro** | 1-2 sem | Pagamentos, Dashboard |
| **M6 Polish** | 1-2 sem | Deploy |

---

## 9. Regras Importantes

### Multi-Tenant
- TODA query precisa de `tenant_id`
- Middleware extrai tenant do subdomain

### Validação
- Usar Zod para inputs
- Validar CPF com algoritmo oficial

### Segurança
- Headers CSP, HSTS
- Não expor CPF em logs/URLs

### Conflitos de Reserva

R1.space_id = R2.space_id
AND R1.date = R2.date
AND R1.start_time < R2.end_time
AND R1.end_time > R2.start_time

---

## 10. Comandos Úteis

```bash
# Setup
docker compose up -d
npm install
npx shadcn-ui@latest init
npm run db:push
npm run db:seed
npm run dev

# Commits (Conventional Commits)
git commit -m "feat(members): adicionar busca por CPF"
git commit -m "fix(reservations): corrigir conflito"
```

---

## 11. Design System v2

**Direção:** Professional SaaS (Linear/Vercel inspired) — sofisticado, minimalista

### Paleta de Cores

| Nome | Hex | Uso |
|------|-----|-----|
| Background | `#FAFAFA` | Fundo off-white |
| Foreground | `#18181B` | Texto principal (zinc-900) |
| Brand Primary | `#16a34a` | CTAs, destaques (emerald-600) |
| Brand Light | `#22c55e` | Hovers, accents (emerald-500) |
| Muted | `#71717A` | Texto secundário (zinc-500) |
| Border | `rgba(0,0,0,0.06)` | Bordas sutis |
| Error | `#dc2626` | Status erro |
| Warning | `#ca8a04` | Status alerta |

### Tipografia

| Role | Font | Weight |
|------|------|--------|
| UI/Body | Inter | 400-500 |
| Headings | Inter | 600 (semibold) |
| Labels | Inter | 500 uppercase |

### Animações (Framer Motion)

```tsx
import { FadeIn, StaggerContainer, fadeVariants } from '@/components/animations/fade-in';
```

### Componentes Redesignados

| Página | Status | Arquivo |
|--------|--------|---------|
| Login | ✅ Feito | `src/app/(auth)/login/page.tsx` |
| Dashboard Associado | ✅ Feito | `src/app/(dashboard)/dashboard/page.tsx` |
| Office Dashboard | ✅ Feito | `src/app/(office)/escritorio/page.tsx` |
| Sidebar | ✅ Feito | `src/components/layout/sidebar.tsx` |
| Header | ✅ Feito | `src/components/layout/header.tsx` |
| Financeiro | ✅ Feito | `src/app/(office)/escritorio/financeiro/page.tsx` |
| Dark mode | ✅ Feito | `components/theme/theme-toggle.tsx` |

### Variáveis CSS

Ver `src/app/globals.css` para tokens completos:
- `--background`, `--foreground` — Cores base
- `--color-brand-*` — Paleta emerald
- `--shadow-*` — Sombras com tint de marca
- `--space-*` — Espaçamento (grid 4px)
- `--text-*` — Escala tipográfica