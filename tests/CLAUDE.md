# Loop Engineering - Socio Desk MVP

## 🎯 Objetivo
Automatizar o roteiro manual de testes usando loop engineering:
- Executar → Verificar → Diagnosticar → Corrigir → Re-executar
- Limite de 3 tentativas por caso antes de escalar

## 📁 Estrutura de Arquivos

```
tests/
├── setup.ts                    # Setup global (já existe)
├── manual-to-automated/       # Conversão do roteiro manual
│   ├── master.test.ts         # Seção 1: Master
│   ├── admin.test.ts          # Seção 2: Admin
│   ├── office.test.ts         # Seção 3: Escritório
│   ├── auth.test.ts           # Seção 4: Autenticação
│   ├── dashboard.test.ts      # Seção 5: Dashboard
│   └── security.test.ts       # Seção 6: Segurança
├── utils/
│   ├── test-helpers.ts        # Helpers comuns
│   ├── mock-factories.ts      # Factories para test data
│   └── api-client.ts          # Cliente para APIs internas
└── CLAUDE.md                  # Este arquivo

## 🚀 Como Usar o Loop

### Passo 1: Converter um caso manual
```typescript
// Exemplo: Criar tenant (manual passo 1.1.3)
test('criar novo tenant', async () => {
  // Arrange: Preparar dados
  const newTenant = {
    name: 'Test Tenant',
    slug: 'test-tenant',
    planId: existingPlan.id
  };
  
  // Act: Executar ação
  const response = await api.post('/master/tenants', newTenant);
  
  // Assert: Verificar resultado
  expect(response.status).toBe(201);
  expect(response.body.data.slug).toBe('test-tenant');
});
```

### Passo 2: Rodar o teste
```bash
npm test -- --run tests/manual-to-automated/master.test.ts
```

### Passo 3: Se falhar, diagnosticar
1. Verificar logs do Vitest: `npm test -- --run`
2. Checar banco: `npm run db:studio`
3. Ler código-fonte da API

### Passo 4: Corrigir (fora de /tests)
- Editar `src/app/api/tenants/route.ts`
- Não alterar o teste!

### Passo 5: Re-executar
```bash
npm test -- --run tests/manual-to-automated/master.test.ts
```

## 📋 Regras do Loop

1. **Nunca alterar schema de banco** durante o loop
2. **Limite de 3 tentativas** por caso
3. **Registrar bugs** em `bugs.log`
4. **Pedir aprovação** antes de aplicar fixes complexos
5. **Testar um caso de cada vez** (não rodar tudo)

## 🐛 Exemplo de Fluxo Falho

```
Teste: "Criar tenant falha"
1. Rodar teste → Falha com 500
2. Diagnóstico → Falha de validação no slug
3. Corrigir → Adicionar regex validation em src/lib/validators.ts
4. Re-executar → Passa!
```

## 📊 Progresso Tracking

| Seção | Casos Convertidos | Status |
|-------|-------------------|--------|
| Master | 0/3 | ⏳ |
| Admin | 0/3 | ⏳ |
| Escritório | 0/10 | ⏳ |
| Autenticação | 0/5 | ⏳ |
| Dashboard | 0/3 | ⏳ |
| Segurança | 0/4 | ⏳ |

## 🔧 Scripts Úteis

```bash
# Rodar só Master
npm test -- --run tests/manual-to-automated/master.test.ts

# Rodar com coverage
npm test -- --run tests/manual-to-automated/master.test.ts --coverage

# Rodar falhados só
npm test -- --run tests/manual-to-automated/master.test.ts --reporter verbose

# Debug
npm test -- --run tests/manual-to-automated/master.test.ts --reporter verbose
```

## 📝 Notas Importantes

- Usar `jsdom` para componentes React
- Mockar APIs externas (email, S3)
- Isolar tenant por teste
- Limpar dados entre execuções