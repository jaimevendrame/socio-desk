# Testes E2E - Socio Desk MVP

Sistema de automação de testes que executa o roteiro manual via navegador controlado.

## 🎯 Objetivo

- Executar automaticamente todas as telas do sistema
- Seguir o roteiro de teste manual (`docs/teste-manual-mvp.md`)
- Identificar bugs e pendências automaticamente
- Gerar relatórios de progresso

## 📁 Estrutura

```
tests/e2e/
├── playwright.config.ts    # Configuração do Playwright
├── specs/                 # Test specs (um por módulo)
│   ├── master.spec.ts     # 1. MASTER
│   ├── admin.spec.ts      # 2. ADMIN
│   ├── escritorio.spec.ts # 3. ESCRITÓRIO
│   ├── auth.spec.ts       # 4. AUTENTICAÇÃO
│   ├── dashboard.spec.ts  # 5. DASHBOARD
│   └── security.spec.ts   # 6. SEGURANÇA
├── utils/
│   ├── base-test.ts       # Base fixtures
│   ├── test-steps.ts      # Helpers reutilizáveis
│   └── diagnostic.ts      # Sistema de diagnóstico
├── reports/               # Relatórios gerados
│   └── progress-report.ts # Gerador de relatórios
└── README.md              # Este arquivo
```

## 🚀 Como Usar

### 1. Instalar Playwright

```bash
npm install
npm run test:e2e:install
```

### 2. Rodar os Testes

```bash
# Todos os testes
npm run test:e2e

# Módulo específico
npm run test:e2e:master
npm run test:e2e:admin
npm run test:e2e:escritorio
npm run test:e2e:auth
npm run test:e2e:dashboard
npm run test:e2e:security

# Modo interativo (UI)
npm run test:e2e:ui

# Ver testes no navegador
npm run test:e2e:headed
```

### 3. Ver Relatórios

```bash
npm run test:e2e:report
```

Os relatórios HTML ficam em `tests/e2e/reports/html/`

## 📋 Testes Implementados

| Módulo | Descrição | Status |
|--------|-----------|--------|
| MASTER | Tenants, Planos, Logs | ✅ |
| ADMIN | Equipe, Config, Relatórios | ✅ |
| ESCRITÓRIO | Espaços, Associados, Reservas, Fila, Financeiro | ✅ |
| AUTENTICAÇÃO | Registro, Login, Logout | ✅ |
| DASHBOARD | Portal do Membro | ✅ |
| SEGURANÇA | Tenant Isolation, Acesso não Autorizado, Rate Limiting | ✅ |

## 🔧 Configuração

### Credenciais de Teste

Configure no arquivo `utils/base-test.ts`:

```typescript
{
  masterUser: { email: 'super@admin.com', password: '...' },
  adminUser: { email: 'admin@dev.com', password: '...' },
  memberUser: { email: 'member@dev.com', password: '...' },
}
```

### URL Base

Configure no `playwright.config.ts`:

```typescript
use: {
  baseURL: 'http://localhost:3000',
}
```

## 📊 Fluxo de Trabalho

1. **Executar** → `npm run test:e2e`
2. **Diagnosticar** → Ver erros e screenshots em `reports/`
3. **Corrigir** → Aplicar fixes (com sua aprovação)
4. **Re-executar** → Rodar novamente

## 🐛 Reportando Bugs

Bugs são salvos automaticamente em `tests/e2e/reports/bugs.json`.

Para adicionar manualmente:

```typescript
import { ProgressReporter } from './utils/progress-report';

const reporter = new ProgressReporter();
reporter.addBug({
  module: 'Admin',
  testName: '2.1.1 - Deve listar membros',
  description: 'Não carrega lista de membros',
  severity: 'high',
  status: 'open',
});
```

## 📝 Notas

- Tests são executados em Chromium, Firefox e WebKit
- Screenshots são capturados automaticamente em falhas
- Videos são salvos para testes que falham
- Retry automático (1 retry por padrão)

---

Baseado em: `docs/teste-manual-mvp.md`
