# Socio Desk

Sistema SaaS multi-tenant de gestão de reservas para associações recreativas.

## Stack

- **Frontend + Backend:** Next.js 14 (App Router)
- **ORM:** Drizzle ORM
- **Auth:** Better Auth
- **Database:** PostgreSQL 16
- **Email:** Brevo (Sendinblue)
- **Storage:** MinIO (local) / Backblaze B2 (produção)
- **UI:** shadcn/ui + Radix UI
- **Charts:** Recharts
- **Deploy:** Coolify

## Requisitos

- Node.js 18+
- Docker Desktop
- PostgreSQL 16 (via Docker)
- npm ou yarn

## Setup Local

### 1. Clone e instale dependências

```bash
git clone <repo>
cd socio-desk
npm install
```

### 2. Configure variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` conforme necessário:

```env
DATABASE_URL="postgresql://dev:dev_password@localhost:5432/socio_desk"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### 3. Suba os serviços Docker

```bash
docker compose up -d
```

Verifique se estão rodando:

```bash
docker compose ps
```

### 4. Configure o banco de dados

```bash
# Gere as migrations
npm run db:generate

# Aplique as migrations
npm run db:push

# Popule com dados de exemplo
npm run db:seed
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## Credenciais de Demo

Após executar o seed:

- **Email:** joao@demo.com
- **Senha:** demo123

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Verifica linting
npm run typecheck    # Verifica tipos TypeScript

# Banco de dados
npm run db:generate  # Gera migrations
npm run db:migrate   # Aplica migrations
npm run db:push     # Push schema (desenvolvimento)
npm run db:studio   # Abre Drizzle Studio
npm run db:seed     # Popula banco com dados mock

# Docker
npm run docker:up       # Sobe containers
npm run docker:down     # Para containers
npm run docker:restart  # Reinicia containers
npm run docker:logs     # Ver logs
```

## Estrutura do Projeto

```
socio-desk/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/           # Páginas de autenticação
│   │   ├── (dashboard)/       # Portal do associado
│   │   ├── (office)/          # Painel do escritório
│   │   ├── (admin)/           # Painel admin tenant
│   │   ├── (master)/          # Painel admin master
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/               # Componentes shadcn/ui
│   │   ├── layout/           # Layout components
│   │   └── ...               # Componentes específicos
│   └── lib/
│       ├── db/               # Drizzle ORM
│       ├── auth/             # Better Auth
│       └── design-system/    # Tokens de design
├── scripts/
│   └── db/                   # Scripts de banco
├── drizzle/
│   └── migrations/          # Migrations Drizzle
└── docs/                     # Documentação
```

## Arquitetura Multi-Tenant

O sistema utiliza subdomain para identificar tenants:

- `clubeexemplo.sociodesk.com.br` → Clube Exemplo
- `admin.sociodesk.com.br` → Painel Admin Master

Em desenvolvimento: `/escritorio`, `/admin`, `/master`

## Perfis de Usuário

| Perfil | Descrição | Acesso |
|--------|-----------|--------|
| member | Associado comum | Portal (/dashboard) |
| team | Equipe do escritório | Portal + Escritório |
| admin | Administrador do tenant | Portal + Escritório + Admin |
| admin_master | Administrador da plataforma | Todos + Master |

## Funcionalidades MVP

### M1 - Foundation (atual)
- [x] Setup Next.js 14
- [x] Docker Compose (Postgres + MinIO)
- [x] Drizzle ORM configurado
- [x] Better Auth
- [x] Layout base (sidebar/header)
- [x] Páginas de autenticação
- [x] Middleware de proteção
- [x] Design tokens

### M2 - Interface Core (próximo)
- [ ] Todas as páginas com mock data
- [ ] shadcn/ui completo
- [ ] Calendário visual

### M3 - Backend Essentials
- [ ] API Spaces
- [ ] API Members
- [ ] Upload de fotos

### M4 - Reservations
- [ ] Sistema de reservas
- [ ] Detecção de conflitos
- [ ] Row-level locking

### M5 - Financeiro
- [ ] Mensalidades
- [ ] Inadimplência
- [ ] Relatórios

### M6 - Polish & Deploy
- [ ] Email templates
- [ ] Segurança
- [ ] Deploy com Coolify

## Troubleshooting

### Erro de conexão com banco

Verifique se o PostgreSQL está rodando:

```bash
docker compose ps
```

### Erro de migration

Se houver conflito,force o push:

```bash
npm run db:push -- --force
```

### Limpar banco e recriar

```bash
docker compose down -v  # Remove volumes (PERDE DADOS!)
npm run db:push
npm run db:seed
```

## Licença

Proprietário © 2026 Socio Desk
