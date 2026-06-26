---
name: socio-desk-pending-tasks
description: Tarefas pendentes do projeto Socio Desk — gaps críticos, MVP e infraestrutura
metadata:
  type: project
---

# Socio Desk — Pendências

## Status Atual (Junho/2026)

Auth E2E corrigido e funcionando. Commits:
- `33e163a` — gaps segurança multi-tenant
- `38b3d53` — sign-in + getServerContext
- `5f56cfc` — auth flow + middleware Edge + drizzleAdapter + schema fix

E2E testado e passando: login → dashboard → reservar → escritorio (todos 200).

---

## 🔴 CRÍTICO — Impedem Deploy

| # | Item | Onde está | Como resolver |
|---|------|-----------|---------------|
| 1 | **RLS no PostgreSQL** | `notepad.md 4.1.4` | Criar policies RLS por tenant |
| 2 | **Rate limiting em APIs** | `notepad.md 4.1.5` | better-auth rate limiting ou middleware |
| 3 | **`BETTER_AUTH_SECRET` curto** | Warnings no log | Gerar com `openssl rand -base64 32` |
| 4 | **`BETTER_AUTH_URL` não setado** | Warnings no log | Adicionar `BETTER_AUTH_URL=http://localhost:3000` no .env |

---

## 🟡 ALTA — MVP Funcional

| # | Item | Onde |
|---|------|------|
| 5 | CRUD Spaces completo (PATCH/DELETE + página edição) | `notepad.md 4.2.2` |
| 6 | Row-level locking em reservas | `notepad.md 4.2.3` |
| 7 | Pages admin: `/admin/equipe`, `/admin/config`, `/admin/relatorios` | `notepad.md 4.3.1-4.3.3` |
| 8 | Pages master: `/master/tenants`, `/master/planos`, `/master/logs` | `notepad.md 4.3.4-4.3.6` |
| 9 | Importação CSV de membros `/escritorio/associados/importar` | `notepad.md 4.2.1` |

---

## 🟡 MÉDIA

| # | Item | Onde |
|---|------|------|
| 10 | Cron jobs wired (scheduler) | `notepad.md 4.2.4` |
| 11 | Waitlist de reservas | `notepad.md 4.2.5` |
| 12 | Upload de fotos (S3/MinIO) | `notepad.md 4.2.8` |
| 13 | Exportação PDF/Excel | `notepad.md 4.2.6` |
| 14 | Ciclo de dependentes CRUD | `notepad.md 4.2.7` |
| 15 | Notificações reais (Brevo wired) | `notepad.md 4.2.9` |
| 16 | Bottom navigation mobile | `notepad.md 4.2.11` |

---

## 🟢 BAIXA

| # | Item | Onde |
|---|------|------|
| 17 | PWA (manifest + service worker) | `notepad.md 4.2.10` |
| 18 | Testes (vitest + playwright) | `notepad.md 4.3` |
| 19 | CI/CD (GitHub Actions) | `notepad.md 8` |

---

## 🟢 INFRAESTRUTURA

| # | Item |
|---|------|
| 20 | Dockerfile |
| 21 | docker-compose.production.yml |
| 22 | vitest.config.ts |

---

## Milestones Reais

| M | Nome | Status | Notas |
|---|------|--------|-------|
| M1 | Foundation | ✅ | Completo |
| M2 | Interface Core | ✅ | Completo |
| M3 | Backend Essentials | ✅ | Auth corrigido; falta CRUD spaces, CSV, upload |
| M4 | Reservations Core | ⚠️ 60% | Falta row locking, waitlist |
| M5 | Financeiro | ⚠️ 50% | Falta cron jobs wired, relatórios |
| M6 | Polish & Deploy | ⚠️ 80% | Auth ✅; falta RLS, rate limiting, Dockerfile |
| M7 | Design System v2 | ⚠️ Parcial | Theme toggle existe |

---

## Docs Principais

- `docs/notepad.md` — análise completa de gaps
- `docs/PLANS.md` — milestones e status
- `docs/socio-desk-dev-setup.md` — stack e estrutura
- `docs/mobile-first-implementation-plan.md` — plano mobile
