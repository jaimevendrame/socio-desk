# SPEC — Socio Desk: Especificações Complementares ao PRD

**Documento:** Complemento ao PRD v1.0
**Versão:** 1.0 | **Data:** Junho/2026 | **Autor:** Análise Técnica
**Status:** Pronto para revisão e validação com stakeholders

---

## 1. Ciclo de Vida de Dependentes

### 1.1 Modelo de Dados Revisado

O modelo anterior apresentava ambiguidade: dependentes maiores de 18 anos não tinham path claro entre `dependent` e `members`. A solução abaixo define dois padrões distintos.

#### Padrão A: Dependente Não-Bilável (menores de 18, cônjuges sem renda própria)

Permanecem em `dependent`一辈子. Sem autenticação própria.

```
dependent
├── id (UUID, PK)
├── member_id (FK → members, titular/responsável)
├── type (enum: conjuge, filho, enteado, pais, irmao, outro)
├── name (string)
├── birth_date (date)
├── document_type (enum: rg, cpf, passaporte)
├── document_number (string)
├── photo_url (string, nullable)
├── created_at (timestamp)
├── updated_at (timestamp)
└── status (enum: ativo, inativo)
    └── [inativo = titular solicitou remoção ou dependente atingiu 25 anos]
```

**Índice:** `UNIQUE(member_id, document_type, document_number)` — evita duplicatas no vínculo.

#### Padrão B: Dependente Bilável (maiores de 18, cnjujo com renda própria)

Migra para `members` com campo `dependent_id` como referência ao registro original.

```
members
├── id (UUID, PK)
├── type (enum: afiliado, convidado, dependente_maior)
├── dependent_id (UUID, FK → dependent, nullable)
│   └── Populado apenas quando type = 'dependente_maior'
├── parent_member_id (UUID, FK → members, nullable)
│   └── Aponta para titular que originou o vínculo
├── [campos pessoais completos do afiliado...]
├── is_billable (boolean, default: false)
│   └── true quando migra de dependente para bilável
├── migrated_at (timestamp, nullable)
│   └── Data da migração para members
└── [restante dos campos do membro...]
```

### 1.2 Regras de Negócio — Ciclo de Vida

| Evento | Trigger | Ação Automática |
|--------|---------|-----------------|
| Cadastro inicial | Associado adiciona dependente | Cria registro em `dependent` |
| Menor atinge 18 anos | Cron job diário compara `birth_date + 18 anos` com `CURRENT_DATE` | Alerta admin (não migra automaticamente — requer validação) |
| Admin valida maioridade | Admin aprova migração | Cria registro em `members`, marca `dependent.status = 'migrado'` |
| Titular solicita remoção | POST /dependents/{id}/deactivate | Marca `dependent.status = 'inativo'` |
| Dependente atinge 25 anos | Cron job diário | Bloqueia reservas em nome próprio, notifica titular |

### 1.3 Fluxo de Autenticação e Reservas

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPENDENTE MENOR DE 18                   │
├─────────────────────────────────────────────────────────────┤
│  Autenticação:  NÃO (sem login próprio)                    │
│  Reservas:      Usa login do titular                        │
│  Cota:          Compartilha limite do titular              │
│  Notificações:  Enviadas ao titular                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  DEPENDENTE MAIOR DE 18                     │
├─────────────────────────────────────────────────────────────┤
│  Autenticação:  SIM (login próprio após migração)          │
│  Reservas:      Cota própria, independente do titular       │
│  Status:        Inicia como 'dependente_maior', pode        │
│                 pedir promoção para 'afiliado' se atender   │
│                 requisitos (Fase 2+)                         │
│  Cobrança:      Própria (se `is_billable = true`)          │
│  Notificações:  Próprias e em cópia para titular (opcional) │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 Regras de Cobrança

| Cenário | Titular Paga | Dependente Paga | Obs |
|---------|--------------|-----------------|-----|
| Dependente menor | Sim | Não | Incluído na mensalidade do titular |
| Dependente maior não-bilável | Sim | Não | Mantém vínculo sem custo |
| Dependente maior bilável | Não | Sim | Conta própria, pode ter plano próprio |

---

## 2. Algoritmo de Detecção de Conflitos de Reserva

### 2.1 Definições Formais

**Reserva:** tupla `(space_id, date, start_time, end_time)`

**Conflito:** Duas reservas R1 e R2 conflitam se e somente se:
```
R1.space_id = R2.space_id
AND R1.date = R2.date
AND R1.start_time < R2.end_time
AND R1.end_time > R2.start_time
```

### 2.2 Janela de Tolerância

Para permitir tempo de limpeza/transição entre reservas, aplicar buffer configurável por espaço:

```
effective_end_time = reservation.end_time + space.buffer_minutes
```

| Configuração | Valor Padrão | Aplicação |
|--------------|--------------|-----------|
| `buffer_minutes` | 15 min | Adicionado ao `end_time` na checagem de conflito |
| `min_reservation_minutes` | 30 min | Duração mínima de uma reserva |
| `max_reservation_minutes` | 480 min (8h) | Duração máxima de uma reserva |

### 2.3 Regras de Conflito por Tipo de Reserva

| Tipo | Checagem de Conflito | Observação |
|------|---------------------|------------|
| Esporádica | Com todas as reservas do mesmo dia | Padrão |
| Recorrente (diária) | Com todas as reservas dos próximos 90 dias | Limite de antecipação |
| Recorrente (semanal) | Com todas as reservas dos próximos 180 dias | Limite de antecipação |

### 2.4 API de Checagem de Conflito

```typescript
// POST /api/reservations/check-conflict
interface ConflictCheckRequest {
  space_id: string;
  date: string; // ISO date
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  exclude_reservation_id?: string; // Para edição — ignora a própria reserva
  is_recurring?: boolean;
  recurring_pattern?: 'daily' | 'weekly';
  recurring_until?: string; // ISO date
}

interface ConflictCheckResponse {
  has_conflict: boolean;
  conflicting_reservations: Array<{
    id: string;
    member_name: string;
    date: string;
    start_time: string;
    end_time: string;
  }>;
  available_slots: Array<{
    start_time: string;
    end_time: string;
  }>;
}
```

### 2.5 Fluxo de Reserva com Detecção de Conflito

```
┌──────────────┐
│  Usuário     │
│  seleciona   │
│  espaço/data │
└──────┬───────┘
       │ GET /spaces/{id}/availability?date=YYYY-MM-DD
       ▼
┌──────────────┐
│  Backend     │
│  calcula     │
│  horários    │
│  disponíveis │
│  (exclui     │
│  conflitos)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Frontend    │
│  exibe       │
│  calendário   │
│  com slots   │
│  livres      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Usuário     │
│  confirma    │
│  horário     │
└──────┬───────┘
       │ POST /reservations
       ▼
┌──────────────────────────────────────────────────────┐
│  Backend executa TRANSACTION:                        │
│  1. LOCK reservation WHERE space_id + date + hora    │
│  2. Re-checa conflito (previne race condition)       │
│  3. INSERT reservation                                │
│  4. COMMIT ou ROLLBACK                               │
│                                                      │
│  Se conflito detectado no step 2:                    │
│  → Retorna erro 409 com detalhes do conflito         │
└──────────────────────────────────────────────────────┘
```

### 2.6 Tratamento de Race Condition

O double-booking é prevenido com row-level locking na transação:

```sql
-- Check-and-insert atômico
BEGIN;

-- Trava as linhas que poderiam conflitar
SELECT id FROM reservations
WHERE space_id = $1
  AND date = $2
  AND start_time < $4 + interval '15 minutes'  -- buffer
  AND end_time + interval '15 minutes' > $3
FOR UPDATE;

-- Se não houver conflito, insere
INSERT INTO reservations (space_id, member_id, date, start_time, end_time, ...)
VALUES ($1, $2, $3, $4, $5, ...);

COMMIT;
```

---

## 3. Regras de Bloqueio por Inadimplência

### 3.1 Definição de Inadimplência

Um membro é considerado inadimplente quando:

| Condição | Descrição |
|----------|-----------|
| Mensalidade em atraso | `payments.due_date < CURRENT_DATE - grace_period_days` E `payments.status = 'pending'` |
| Dívida acumulada | Soma de `payments` com `status IN ('overdue', 'pending')` >= `config.min_debt_for_block` |

**Configurações por tenant:**
| Campo | Tipo | Padrão |
|-------|------|--------|
| `grace_period_days` | int | 5 dias |
| `min_debt_for_block` | decimal | R$ 0,01 |
| `auto_block_enabled` | boolean | true |

### 3.2 Escopo do Bloqueio

| Recurso | Bloqueado? | Justificativa |
|---------|------------|---------------|
| Nova reserva | Sim | Impedir uso sem pagamento |
| Reserva em andamento | Permite finalizar | Reserva já paga ou em andamento |
| Reserva cancelada pelo admin | Sim | Admin pode estornar |
| Edição de dados pessoais | Não | Informações cadastrais não são afetadas |
| Login no portal | Visualização apenas | Não pode reservar |
| Notificações | Enviadas normalmente | Lembrete de inadimplência |

### 3.3 Regras para Dependentes

| Situação | Comportamento |
|----------|---------------|
| Titular inadimplente, dependente menor | Bloqueado junto (não pode reservar) |
| Titular inadimplente, dependente maior bilável | Não bloqueado (responsabilidade própria) |
| Dependente inadimplente, titular adimplente | Titular não afetado, dependente bloqueado |

### 3.4 Fluxo de Desbloqueio

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE DESBLOQUEIO                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Recebimento pagamento (manual ou gateway Fase 3)       │
│     ↓                                                      │
│  2. Admin registra baixa em /payments/{id}/mark-paid       │
│     ↓                                                      │
│  3. Backend recalcula status:                              │
│     ├── Soma débitos pendentes                              │
│     ├── Se total = 0 → status = 'adimplente'               │
│     └── Se total > 0 → permanece inadimplente               │
│     ↓                                                      │
│  4. Se status mudou para 'adimplente':                     │
│     ├── member.blocked_at = NULL                           │
│     ├── member.block_reason = NULL                         │
│     └── Envia notificação "Conta regularizada"            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 Cronograma de Verificação

| Job | Frequência | Ação |
|-----|------------|------|
| `check-overdue-payments` | Diário, 06:00 | Marca pagamentos vencidos como `overdue` |
| `update-member-status` | Diário, 06:30 | Recalcula status de inadimplência por membro |
| `send-overdue-notifications` | Diário, 08:00 | Envia alertas a inadimplentes |

---

## 4. User Flows e Mapa de Telas MVP

### 4.1 Fluxo Principal — Associado

```
┌──────────────────────────────────────────────────────────────────┐
│                     FLUXO ASSOCIADO (PORTAL)                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────┐      ┌──────────────┐      ┌─────────────────┐ │
│  │   LOGIN    │─────▶│   DASHBOARD  │─────▶│   RESERVAR      │ │
│  └────────────┘      └──────────────┘      └─────────────────┘ │
│                            │                       │              │
│                            │                       ▼              │
│                            │              ┌─────────────────┐     │
│                            │              │  SELECIONA      │     │
│                            │              │  ESPAÇO/DATA    │     │
│                            │              └─────────────────┘     │
│                            │                       │              │
│                            │                       ▼              │
│                            │              ┌─────────────────┐     │
│                            │              │  ESCOLHE HORÁRIO│     │
│                            │              │  (calendário)   │     │
│                            │              └─────────────────┘     │
│                            │                       │              │
│                            │                       ▼              │
│                            │              ┌─────────────────┐     │
│                            │              │  CONFIRMAÇÃO    │     │
│                            │              │  + NOTIFICAÇÃO  │     │
│                            │              └─────────────────┘     │
│                            ▼                                         │
│                     ┌──────────────┐                               │
│                     │  MINHAS       │─────▶ Cancelamento           │
│                     │  RESERVAS     │                               │
│                     └──────────────┘                               │
│                            ▼                                         │
│                     ┌──────────────┐                                │
│                     │  MEU PERFIL   │─────▶ Edição dados            │
│                     └──────────────┘     Dependentes                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Fluxo Principal — Equipe Escritório

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUXO EQUIPE ESCRITÓRIO                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────┐      ┌──────────────┐                           │
│  │   LOGIN    │─────▶│   DASHBOARD   │                          │
│  └────────────┘      └──────────────┘                           │
│                            │                                      │
│         ┌──────────────────┼──────────────────┐                   │
│         ▼                  ▼                  ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  RESERVAS    │  │  ASSOCIADOS   │  │  ESPAÇOS     │          │
│  │  (calendário │  │  (lista +     │  │  (CRUD)      │          │
│  │   completo)  │  │   busca)      │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                                     │
│         ▼                  ▼                                     │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  Reserva      │  │  Cadastro     │                            │
│  │  balcão       │  │  Individual   │                            │
│  │  (em nome     │  │  / Em Massa   │                            │
│  │   de membro)  │  │  (CSV/Excel)  │                            │
│  └──────────────┘  └──────────────┘                            │
│                            ▼                                     │
│                     ┌──────────────┐                             │
│                     │  FINANCEIRO  │─────▶ Baixa pagamento      │
│                     └──────────────┘     Relatório inadimplência│
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 Fluxo Principal — Admin Tenant

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUXO ADMINISTRADOR TENANT                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────┐      ┌──────────────┐                             │
│  │   LOGIN    │─────▶│   DASHBOARD   │                            │
│  └────────────┘      │  (overview)   │                            │
│                       └──────────────┘                            │
│                             │                                      │
│         ┌──────────────────┼──────────────────┐                   │
│         ▼                  ▼                  ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  CONFIG      │  │  EQUIPE       │  │  RELATÓRIOS  │          │
│  │  (espaços,   │  │  (CRUD +      │  │  (dashboard, │          │
│  │   regras,    │  │   permissões) │  │   ocupação,   │          │
│  │   templates  │  │               │  │   exportação)│          │
│  │   notificação│  │               │  │               │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.4 Fluxo Principal — Admin Master

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUXO ADMINISTRADOR MASTER                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────┐      ┌──────────────┐                           │
│  │   LOGIN    │─────▶│   PAINEL     │                           │
│  │  (acesso   │      │   GLOBAL     │                           │
│  │   único)   │      │  (todos      │                           │
│  └────────────┘      │   tenants)   │                           │
│                       └──────────────┘                            │
│                             │                                      │
│         ┌──────────────────┼──────────────────┐                   │
│         ▼                  ▼                  ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  TENANTS     │  │  PLANOS      │  │  FINANCEIRO  │          │
│  │  (CRUD,      │  │  (CRUD,      │  │  (faturas,    │          │
│  │   ativar/    │  │   preços,    │  │   inadimplên- │          │
│  │   suspender) │  │   features) │  │   cia global) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                             ▼                                     │
│                      ┌──────────────┐                            │
│                      │  LOG AUDITORIA│                            │
│                      │  (acesso      │                            │
│                      │   completo)   │                            │
│                      └──────────────┘                            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.5 Mapa de Telas MVP

#### Portal do Associado

| Tela | Rota | Descrição | Prioridade |
|------|------|-----------|------------|
| Login | `/login` | E-mail + senha | MVP |
| Dashboard | `/dashboard` | Cards: próximas reservas, saldo, notificações | MVP |
| Reservar | `/reservar` | Seleção espaço → data → horário | MVP |
| Minhas Reservas | `/reservas` | Lista + filtro + cancelamento | MVP |
| Meu Perfil | `/perfil` | Dados pessoais + dependentes | MVP |
| Alterar Senha | `/perfil/senha` | Troca de senha | MVP |

#### Painel Escritório

| Tela | Rota | Descrição | Prioridade |
|------|------|-----------|------------|
| Dashboard | `/escritorio` | Cards: reservas hoje, ocupação, inadimplentes | MVP |
| Calendário | `/escritorio/reservas` | Visão dia/semana/mês, todos espaços | MVP |
| Nova Reserva | `/escritorio/reservas/nova` | Reserva em nome de membro | MVP |
| Lista Associados | `/escritorio/associados` | Busca, filtros, paginação | MVP |
| Detalhe Associado | `/escritorio/associados/{id}` | Full profile + histórico | MVP |
| Cadastro Associado | `/escritorio/associados/novo` | Form multi-step | MVP |
| Importação CSV | `/escritorio/associados/importar` | Upload + preview + confirmação | MVP |
| Espaços | `/escritorio/espacos` | CRUD espaços + configurações | MVP |
| Financeiro | `/escritorio/financeiro` | Mensalidades + baixa | MVP |

#### Painel Admin Tenant

| Tela | Rota | Descrição | Prioridade |
|------|------|-----------|------------|
| Dashboard | `/admin` | Overview + métricas | MVP |
| Configurações | `/admin/config` | Espaços, regras, notificações | MVP |
| Equipe | `/admin/equipe` | CRUD membros equipe + permissões | MVP |
| Relatórios | `/admin/relatorios` | Ocupação, uso, exportação | MVP |

#### Painel Admin Master

| Tela | Rota | Descrição | Prioridade |
|------|------|-----------|------------|
| Painel Global | `/master` | Todos tenants + métricas | MVP |
| Gerenciar Tenants | `/master/tenants` | CRUD + ativar/suspender | MVP |
| Planos | `/master/planos` | CRUD planos + features | MVP |
| Logs | `/master/logs` | Auditoria completa | MVP |

### 4.6 Wireframe Simplificado — Dashboard Escritório

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [≡] Socio Desk — Clube Exemplo                    [🔔] [Admin ▼]      │
├──────────┬──────────────────────────────────────────────────────────────┤
│          │  ┌─────────────────────────────────────────────────────────┐ │
│  🏠 Dash │  │  RESERVAS HOJE                    23/06/2026          │ │
│  📅 Ag.  │  │  ┌───────┬──────────┬────────┬───────────────────┐   │ │
│  👥 Assoc│  │  │ Horário │ Espaço  │ Membro │ Status            │   │ │
│  🏟️ Esp. │  │  ├───────┼──────────┼────────┼───────────────────┤   │ │
│  💰 Financ│  │  │ 08:00  │ Quadra A │ João S │ ✓ Confirmada      │   │ │
│  📊 Relat│  │  │ 10:00  │ Salão    │ Maria L│ ✓ Confirmada       │   │ │
│  ────────│  │  │ 14:00  │ Quadra B │ Carlos │ ⏳ Pendente        │   │ │
│  ⚙️ Config│ │  └───────┴──────────┴────────┴───────────────────┘   │ │
│  👤 Equipe│ └─────────────────────────────────────────────────────────┘ │
│  ────────│  ┌──────────────────┐  ┌──────────────────┐              │
│  🚪 Sair │  │ TAXA OCUPAÇÃO    │  │ INADIMPLENTES     │              │
│          │  │ ████████░░ 78%   │  │ ⚠️ 12 associados  │              │
│          │  └──────────────────┘  └──────────────────┘              │
│          │  ┌─────────────────────────────────────────────────────────┐ │
│          │  │ ÚLTIMAS AÇÕES                                            │ │
│          │  │ • Nova reserva: Quadra A — Maria L — 25/06 14:00        │ │
│          │  │ • Baixa: Mensalidade — Pedro M                          │ │
│          │  │ • Cadastro: Novo associado — Fulano de Tal                │ │
│          │  └─────────────────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────────────────┘
```

---

## 5. Estratégia de Autenticação Multi-Tenant

### 5.1 Identificação de Tenant

O acesso ao tenant é determinado por **subdomain**:

| URL | Tenant |
|-----|--------|
| `clubeexemplo.sociodesk.com.br` | Clube Exemplo |
| `associacaoabc.sociodesk.com.br` | Associação ABC |
| `admin.sociodesk.com.br` | Painel Admin Master |

**Fallback:** Se acesso via domínio direto (ex.: `app.sociodesk.com.br/login`), o campo `e-mail` é usado para derivar o tenant via lookup na tabela `members`:

```sql
-- Ao fazer login, extrair tenant do e-mail domain OU do prefixo
-- e.g., joao@clubeexemplo.com.br → tenant subdomain = 'clubeexemplo'
-- e.g., joao+clubeexemplo@email.com → tenant via tag no e-mail
```

### 5.2 Tabela de Mapeamento

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(63) UNIQUE NOT NULL,  -- subdomain único
  name VARCHAR(255) NOT NULL,
  plan_id UUID REFERENCES plans(id),
  custom_domain VARCHAR(255),          -- domínio próprio (Enterprise)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
```

### 5.3 RLS — Políticas de Isolamento

```sql
-- Habilitar RLS em todas as tabelas do tenant
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Política: membros só veem dados do próprio tenant
CREATE POLICY tenant_isolation_members ON members
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Política: admin master vê todos os tenants
CREATE POLICY admin_master_sees_all ON members
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND user_metadata->>'role' = 'admin_master'
    )
  );

-- Política: equipe ve apenas associados do tenant
CREATE POLICY team_sees_members ON members
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    AND (
      current_setting('app.current_user_role') IN ('admin', 'team')
      OR member_id = auth.uid()  -- próprio membro
    )
  );
```

### 5.4 Configuração de Contexto por Request

```typescript
// Middleware Next.js — extrai tenant do subdomain
// e.g., middlewares/tenant.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];

  // Admin master usa rota fixa
  if (subdomain === 'admin') {
    return NextResponse.next();
  }

  // Valida subdomain existe na tabela tenants
  const tenant = await validateTenant(subdomain);

  if (!tenant) {
    return NextResponse.redirect(new URL('/tenant-not-found', request.url));
  }

  // Injeta tenant_id no header para consumo pela API
  const response = NextResponse.next();
  response.headers.set('x-tenant-id', tenant.id);
  response.headers.set('x-tenant-slug', tenant.slug);

  return response;
}
```

---

## 6. Estrutura LGPD Baseline

### 6.1 Base Legal Identificada

| Finalidade | Base Legal | Justificativa |
|------------|------------|---------------|
| Gestão de reservas | Execução de contrato | Serviço contratado pelo associado |
| Envio de notificações | Legítimo interesse | Comunicação operacional necessária |
| Relatórios à admin | Obrigação legal | Art. 7º, IX — cumprimento de obrigação legal |
| Marketing (se houver) | Consentimento | Opt-in explícito, documentado |
| Dados de menores | Consentimento + Responsável legal | Art. 14, CDC |

### 6.2 Tabela de Retenção

| Dado | Retenção | Descarte |
|------|----------|----------|
| Dados cadastrais (ativo) | Prazo de associação + 5 anos | Anonimização irreversível |
| Dados cadastrais (cancelado) | Prazo de associação + 5 anos | Anonimização irreversível |
| Fotos | Vinculado ao cadastro | Remoção junto com cadastro |
| Reservas | 5 anos | Anonimização |
| Pagamentos | 10 anos (Art. 173, CTN) | Descarte completo |
| Logs de auditoria | 5 anos | Descarte completo |
| Documentos RG/CPF | Até fim da associação | Devolução ou destruição certificada |

### 6.3 Termos e Política — Estrutura

```
/public/legal
├── termos-de-uso.pdf        -- Termos de uso da plataforma
├── politica-privacidade.pdf  -- Política de privacidade completa
├── politica-cookies.pdf      -- Gestão de cookies
└── consentimento.pdf         -- Termo de consentimento (captura no onboarding)
```

### 6.4 Direitos do Titular — Endpoints

| Direito | Endpoint | Prazo Legal |
|---------|----------|-------------|
| Acesso | `GET /api/members/me/data` | Imediato |
| Retificação | `PATCH /api/members/me` | 10 dias úteis |
| Exclusão | `DELETE /api/members/me/request-deletion` | 15 dias úteis |
| Portabilidade | `GET /api/members/me/export` | 15 dias úteis |
| Revogação consentimento | `POST /api/consent/revoke` | Imediato |

---

## 7. Checklist de Implementação

### Antes do Kickoff

- [ ] Validar modelo de dependentes com stakeholder (Padrão A vs B)
- [ ] Confirmar regras de conflito com equipe de negócio
- [ ] Revisar escopo de bloqueio inadimplente
- [ ] Aprovar mapa de telas e user flows
- [ ] Confirmar estratégia multi-tenant (subdomain vs. dropdown)
- [ ] Revisar estrutura LGPD com time jurídico

### Durante MVP

- [ ] Implementar row-level locking para evitar race conditions
- [ ] Configurar cron jobs para inadimplência e ciclo de dependentes
- [ ] Validar RLS com testes de isolamento entre tenants
- [ ] Documentar APIs internas com OpenAPI/Swagger
- [ ] Plano de teste: E2E com Playwright cobrindo fluxos críticos

### Pré-Launch

- [ ] Pentest de RLS e isolamento
- [ ] Termos e política de privacidade finalizados
- [ ] Fluxo de exportação de dados LGPD implementado
- [ ] Documentação de segurança para cliente
- [ ] SLA de tempo de resposta <200ms para queries frequentes

---

## 8. Glossário

| Termo | Definição |
|-------|-----------|
| Tenant | Instância isolada da plataforma para uma associação |
| RLS | Row Level Security — recurso PostgreSQL para isolamento em nível de linha |
| Afiliado | Associado que é servidor público efetivo |
| Convidado | Associado que não é servidor público, paga taxa |
| Dependente | Pessoa vinculada a um associado titular |
| Bilável | Que gera obrigação de pagamento próprio |
| Bloqueio | Restrição de acesso a funcionalidades por inadimplência |
| Subdomain | Prefixo do domínio usado para identificar tenant |

---

## 9. Histórico de Versões

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 23/06/2026 | Versão inicial — complementando PRD v1.0 |
