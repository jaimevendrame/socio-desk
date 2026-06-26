# Socio Desk — Análise de Documentação e Gaps

**Documento:** Análise Consolidada de Documentação vs Implementação
**Versão:** 1.0 | **Data:** Junho/2026
**Status:** Análise completa realizada

---

## 1. Resumo Executivo

- O projeto está em **M5 Financeiro parcialmente implementado** — muitas funcionalidades existem como stubs/placeholders
- **4 gaps críticos de segurança** resolvidos e aplicados na branch `fix/security-gaps-001`
- **3 inconsistências de documentação** que causam confusão
- **11 funcionalidades especificadas mas não implementadas** (marked TODO)
- **Melhorias de UX/performance identificadas** mas não priorizadas

---

## 2. Documentos Lidos e Validados

| Documento | Lido | Validade |
|-----------|------|----------|
| CLAUDE.md | ✅ | ✅ Atualizado com M5, M7 mencionados |
| docs/PLANS.md | ✅ | ✅ Status de milestones verificado |
| docs/socio-desk-dev-setup.md (v1.1) | ✅ | ⚠️ Parcialmente desatualizado |
| docs/socio-desk-standards.md | ✅ | ✅ Válido |
| docs/socio-desk-spec-complementar.md | ✅ | ✅ Especificações detalhadas |
| docs/notepad.md (análise de melhorias) | ✅ | ✅ Criado nesta sessão |
| docs/mobile-first-implementation-plan.md | ✅ | ✅ Plano detalhado |
| docs/socio-desk-dev-setup-v1.1.md | ✅ | ✅ Mesmo conteúdo de dev-setup.md |

---

## 3. Status Real das Milestones

### Status Comparado: Documentado vs Implementado

| Milestone | Doc (PLANS.md) | Implementado Real | Status Real |
|-----------|-----------------|-------------------|-------------|
| **M1 Foundation** | ✅ Concluído | ✅ Setup, DB, Auth, Layout | **REAL: ✅ Completo** |
| **M2 Interface Core** | ✅ Concluído | ✅ Pages e mock data | **REAL: ✅ Completo** |
| **M3 Backend Essentials** | ⏳ Em progresso | ⚠️ Parcial | **REAL: ⚠️ 70% — falta CRUD spaces completo, import CSV** |
| **M4 Reservations Core** | ⏳ Em progresso | ⚠️ Parcial | **REAL: ⚠️ 60% — falta row-level locking, waitlist** |
| **M5 Financeiro** | ⏳ Em progresso | ⚠️ Parcial | **REAL: ⚠️ 50% — falta cron jobs wired, relatórios** |
| **M6 Polish & Deploy** | ❌ Não iniciado | ❌ Não iniciado | **REAL: ❌ Nada feito** |
| **M7 Design System v2** | ❌ Não documentado | ⚠️ Parcial | **REAL: ⚠️ Parcialmente feito (theme-toggle existe)** |

---

## 4. Gaps Críticos — Implementação vs Especificação

### 4.1 Segurança (IMPEDE DEPLOY)

| # | Item Especificado | Status | Severidade |
|---|-------------------|--------|-----------|
| 4.1.1 | Middleware auth completo com Better Auth | ✅ **CORRIGIDO** em `fix/security-gaps-001` | ✅ Resolvido |
| 4.1.2 | Tenant ID hardcoded (`DEMO_TENANT_ID`) | ✅ **CORRIGIDO** em `fix/security-gaps-001` | ✅ Resolvido |
| 4.1.3 | getUserRole usa query sem filtro userId | ✅ **CORRIGIDO** em `fix/security-gaps-001` | ✅ Resolvido |
| 4.1.4 | RLS não implementado no PostgreSQL | ✅ **APLICADO** no banco via docker exec | ✅ Resolvido |
| 4.1.5 | Rate limiting em APIs | ❌ Não feito | 🟡 ALTA |

### 4.2 Funcionalidades MVP Faltantes

| # | Funcionalidade | Especificada em | Implementada | Severidade |
|---|----------------|-----------------|-------------|-----------|
| 4.2.1 | Importação CSV de membros | dev-setup.md M3 | ❌ Não existe | 🟡 ALTA |
| 4.2.2 | CRUD Spaces completo (PATCH/DELETE) | dev-setup.md M3 | ⚠️ Só GET/POST | 🟡 ALTA |
| 4.2.3 | Row-level locking em reservas | spec-complementar | ❌ Não feito | 🟡 ALTA |
| 4.2.4 | Cron jobs wired (scheduler) | spec-complementar | ⚠️ APIs existem, não scheduled | 🟡 MÉDIA |
| 4.2.5 | Waitlist de reservas | PLANS.md M5 | ❌ Não existe | 🟡 MÉDIA |
| 4.2.6 | Exportação PDF/Excel | dev-setup.md M5 | ❌ Não existe | 🟡 MÉDIA |
| 4.2.7 | Ciclo de dependentes (CRUD) | spec-complementar | ❌ Não existe | 🟡 MÉDIA |
| 4.2.8 | Upload de fotos (S3/MinIO) | dev-setup.md M3 | ❌ Não existe | 🟡 MÉDIA |
| 4.2.9 | Notificações reais (Brevo) | dev-setup.md | ⚠️ Templates existem, não wired | 🟡 MÉDIA |
| 4.2.10 | PWA (manifest + service worker) | mobile-plan.md | ❌ Não existe | 🟢 BAIXA |
| 4.2.11 | Bottom navigation mobile | mobile-plan.md | ❌ Não existe | 🟢 BAIXA |

### 4.3 Pages/Telas Faltantes

| # | Page | Rota | Especificada em | Severidade |
|---|------|------|----------------|-----------|
| 4.3.1 | Admin Equipe | `/admin/equipe` | PLANS.md M2 | 🟡 ALTA |
| 4.3.2 | Admin Config | `/admin/config` | PLANS.md M2 | 🟡 ALTA |
| 4.3.3 | Admin Relatórios | `/admin/relatorios` | PLANS.md M2 | 🟡 ALTA |
| 4.3.4 | Master Tenants | `/master/tenants` | PLANS.md M2 | 🟡 ALTA |
| 4.3.5 | Master Planos | `/master/planos` | PLANS.md M2 | 🟡 ALTA |
| 4.3.6 | Master Logs | `/master/logs` | PLANS.md M2 | 🟡 MÉDIA |
| 4.3.7 | Importar Associados | `/escritorio/associados/importar` | PLANS.md M2 | 🟡 MÉDIA |

---

## 5. Inconsistências de Documentação

### 5.1 Versão do Next.js

| Documento | Especifica | Código Real |
|-----------|------------|-------------|
| dev-setup.md v1.1 | Next.js 14+ | **Next.js 16.2.9** |
| PLANS.md | Next.js 16 | ✅ Consistente |
| CLAUDE.md | Next.js 16 | ✅ Consistente |

**Impacto:** dev-setup.md precisa ser atualizado para refletir Next.js 16.

### 5.2 Dependências Desatualizadas

| Dependência | dev-setup.md | package.json real |
|-------------|---------------|-------------------|
| Next.js | ^14.2.0 | 16.2.9 |
| React | ^18.3.0 | 19.2.4 |
| better-auth | ^1.0.0 | ^1.6.20 |
| drizzle-orm | ^0.30.0 | ^0.45.2 |
| recharts | ^2.12.0 | ^3.9.0 |
| @radix-ui/* | v1.0.x | v1.2.x |
| zod | ^3.22.0 | ^4.4.3 |
| tailwindcss | ^3.4.0 | **^4** |
| react-hook-form | ^7.50.0 | ^7.80.0 |

**Impacto:** dev-setup.md está 3-12 meses desatualizado em versões. Nenhuma dependência é bloqueante.

### 5.3 Better Auth Configuração

| Item | dev-setup.md | Código Real |
|------|---------------|-------------|
| Adapter | `drizzleAdapter(db, { provider: 'pg' })` | ❌ Não usado |
| Schema fields | Passa schema.users, schema.sessions | ⚠️ Parcial |
| sendEmailVerification | Implementado | ❌ Não wired |
| socialProviders.google | Configurado | ❌ Commented |

**Impacto:** Auth está funcional mas não segue exatamente a spec. Funciona, mas difere do blueprint.

### 5.4 Estrutura de Pastas

| Especificado em dev-setup.md | Implementado Real |
|------------------------------|-------------------|
| `src/lib/db/schema.ts` | ✅ `src/lib/db/schema.ts` |
| `src/lib/tenant/` | ❌ Não existe (está no context) |
| `src/lib/storage/` | ❌ Não existe |
| `src/lib/email/index.ts` | ⚠️ `src/lib/email/reservations.ts` |
| `src/types/` | ❌ Não existe (inline ou any) |
| `src/components/dashboard/` | ❌ Não existe (cards inline) |
| `src/components/charts/` | ❌ Não existe (recharts direto) |
| `src/components/members/` | ❌ Não existe |
| `src/components/forms/` | ❌ Não existe |

### 5.5 Infraestrutura

| Item | dev-setup.md | Implementado |
|------|---------------|--------------|
| Dockerfile | Especificado | ❌ **Não existe** |
| Dockerfile.dev | Especificado | ❌ Não existe |
| .dockerignore | Especificado | ❌ Não existe |
| docker-compose.production.yml | Especificado | ❌ Não existe |
| vitest.config.ts | Especificado | ❌ Não existe |
| tailwind.config.ts | Especificado (v3) | ⚠️ Usando v4 |
| drizzle.config.ts | Especificado | ✅ Existe |

---

## 6. Documentação Desatualizada — Correções Necessárias

### 6.1 docs/socio-desk-dev-setup.md

| Seção | Problema | Ação |
|--------|----------|------|
| Seção 1 — Stack | Next.js 14+ | Atualizar para Next.js 16+ |
| Seção 2 — Estrutura | Pasta `src/types/` não existe | Remover ou documentar que types são inline |
| Seção 2 — Estrutura | Pasta `src/components/charts/` não existe | Remover ou indicar que está inline |
| Seção 2 — Estrutura | Pasta `src/components/members/` não existe | Remover ou indicar que está inline |
| Seção 5 — Auth | drizzleAdapter não está sendo usado | Atualizar para configuração real |
| Seção 10 — package.json | Todas as versões desatualizadas | Remover seção (manter no package.json) |
| Seção 14.1 | Templates listados | Remover — não usamos templates |
| Seção 15.3 — M3 | Menciona import CSV | Adicionar "(não implementado)" |
| Seção 15.4 — M4 | Menciona row-level locking | Adicionar "(não implementado)" |

### 6.2 docs/PLANS.md

| Seção | Problema | Ação |
|--------|----------|------|
| M3 Status | Marca como "Em progresso" | Atualizar % real (70%) |
| M4 Status | Marca como "Em progresso" | Atualizar % real (60%) |
| M5 Status | Marca como "Em progresso" | Atualizar % real (50%) |
| M7 mentioned | Menciona M7 Design System v2 | Documentar existência de M7 |
| Cron jobs | Menciona que existem APIs | Especificar que não estão scheduled |

### 6.3 docs/mobile-first-implementation-plan.md

| Seção | Problema | Ação |
|--------|----------|------|
| Sprint 1 | Menciona "Adaptar sidebar para desktop-only" | Adicionar nota: "Implementar variant prop na Sidebar existente" |
| Todos os sprints | Menciona `tailwind.config.ts` | Especificar que v4 usa CSS-first config |

---

## 7. Features no Código Não Documentadas

| # | Feature | Onde | Deveria estar |
|---|---------|------|---------------|
| 7.1 | Tema toggle (light/dark) | `src/components/theme/theme-toggle.tsx` | docs/standards.md |
| 7.2 | Animações fade-in | `src/components/animations/fade-in.tsx` | docs/standards.md |
| 7.3 | Debt checker completo | `src/lib/finance/debt-checker.ts` | spec-complementar.md |
| 7.4 | Conflict detection | `src/lib/reservations/conflicts.ts` | spec-complementar.md |
| 7.5 | Recurring reservations | `src/lib/reservations/recurring.ts` | spec-complementar.md |
| 7.6 | Permission system | `src/lib/auth/permissions.ts` | docs/standards.md |
| 7.7 | Logging estruturado | `src/lib/logging/index.ts` | docs/standards.md |

---

## 8. Gaps Críticos — Prioridade de Correção

### 🔴 CRÍTICA — Antes de Qualquer Deploy

```
1. Auth middleware (src/middleware.ts)
   - Implementar verifySession() com better-auth
   - Remover comentários TODO
   - Adicionar redirect para /login

2. TenantContext dinâmico (src/lib/context/tenant-context.tsx)
   - Remover DEMO_TENANT_ID hardcoded
   - Buscar tenant da sessão ou subdomain
   - Validar que tenant existe e está ativo

3. getUserRole corrigido (src/lib/auth/permissions.ts)
   - Substituir query quebrada por where correto
   - eq(teamMembers.userId, userId) + eq(teamMembers.tenantId, tenantId)
```

### 🟡 ALTA — Para MVP Funcional

```
4. CRUD Spaces completo
   - PATCH /api/spaces/[id]
   - DELETE /api/spaces/[id]
   - Página de edição de espaços

5. RLS preparação
   - Documentar políticas no schema
   - Adicionar migrations para RLS
   - Testar isolamento entre tenants

6. Pages admin/master
   - /admin/equipe
   - /admin/config
   - /master/tenants
   - /master/planos

7. docker-compose.production.yml
   - Criar baseado na spec

8. Dockerfile
   - Criar baseado na spec
```

### 🟡 MÉDIA — Experiência Completa

```
9. Importação CSV
10. Cron jobs wired (vercel-cron ou node-cron)
11. Upload de fotos
12. Relatórios com exportação
13. Waitlist de reservas
14. Ciclo de dependentes CRUD
15. Bottom navigation mobile
```

### 🟢 BAIXA — Nice to Have

```
16. PWA (manifest + service worker)
17. Testes (vitest + playwright)
18. CI/CD (GitHub Actions)
```

---

## 9. Reconciliação: docs/notepad.md vs Esta Análise

| Item | notepad.md (análise de melhorias) | Esta análise consolidada |
|------|----------------------------------|--------------------------|
| Escopo | Foco em code quality e gaps | Foco em documentação vs implementação |
| Complementares? | ✅ Sim, focam em coisas diferentes | ✅ Esta análise complementa |
| Prioridades | Similar | Similar |
| Ação | notepad.md → para quando for desenvolver | **Esta análise → atualizar docs primeiro** |

**Recomendação:** Manter ambos os documentos, mas antes de desenvolver, **atualizar a documentação** para refletir o estado real.

---

## 10. Checklist: O Que Fazer Antes de Desenvolver

```
DOCUMENTAÇÃO
[ ] Atualizar dev-setup.md com versões reais
[ ] Atualizar PLANS.md com % de completion real
[ ] Remover seções desatualizadas do dev-setup.md
[ ] Documentar M7 Design System no PLANS.md
[ ] Marcar funcionalidades não implementadas como [ ] no dev-setup.md

SEGURANÇA (bloqueia deploy)
[ ] Implementar auth middleware completo
[ ] Corrigir TenantContext (remover hardcoded)
[ ] Corrigir getUserRole
[ ] Implementar RLS ou documentar que é por código

FUNCIONALIDADES MVP
[ ] CRUD Spaces completo
[ ] Pages admin/master
[ ] Importação CSV
[ ] Cron jobs wired

INFRAESTRUTURA
[ ] Criar Dockerfile
[ ] Criar docker-compose.production.yml
[ ] Configurar vitest
```

---

## 11. Histórico

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2026-06 | Análise Técnica | Versão inicial — análise completa de docs vs implementação |
