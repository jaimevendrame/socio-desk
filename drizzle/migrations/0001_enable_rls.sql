-- Socio Desk RLS Migration
-- Habilita Row-Level Security para multi-tenant
-- Aplicar: npx drizzle-kit push ou npx tsx drizzle/migrations/0001_rls.sql

-- =============================================
-- APPLICATION ROLE (sem BYPASSRLS — necessario para RLS funcionar)
-- IMPORTANTE: usar socio_app na DATABASE_URL, nao dev (dev bypassa RLS)
-- =============================================
DROP ROLE IF EXISTS socio_app;
CREATE ROLE socio_app WITH LOGIN PASSWORD 'dev123';
GRANT CONNECT ON DATABASE postgres TO socio_app;
GRANT USAGE ON SCHEMA public TO socio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO socio_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO socio_app;

-- =============================================
-- APPLICATION ROLE FOR DEV (remover BYPASSRLS se existir)
-- =============================================
ALTER ROLE dev NOBYPASSRLS;

-- Criar extensao pgcrypto se nao existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar funcao para definir tenant atual E user atual (usado pelo app + sessions RLS)
-- Usa set_config(..., false) = session level (persiste alem da transacao)
-- Com connection pooling, cada request obtem uma conexao diferente do pool
CREATE OR REPLACE FUNCTION set_tenant_id(tenant_uuid UUID, request_user_uuid UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  -- false = session level, persiste entre queries na mesma conexao
  -- Com pool de conexoes (pg-pool), cada request usa conexao diferente
  PERFORM set_config('app.tenant_id', COALESCE(tenant_uuid::text, ''), false);
  IF request_user_uuid IS NOT NULL THEN
    PERFORM set_config('app.request_user_id', request_user_uuid::text, false);
  ELSE
    PERFORM set_config('app.request_user_id', '', false);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar funcao para obter tenant atual
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- TENANTS (tabela raiz - sem RLS, admin master)
-- =============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_select ON tenants
  FOR SELECT USING (true);

CREATE POLICY tenants_admin ON tenants
  FOR ALL USING (true);

-- =============================================
-- TEAM MEMBERS (precisa ver o tenant do membro)
-- =============================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_members_tenant ON team_members
  FOR ALL USING (
    current_tenant_id() = tenant_id
  );

-- =============================================
-- MEMBERS (isolar por tenant)
-- =============================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_tenant ON members
  FOR ALL USING (
    current_tenant_id() = tenant_id
  );

-- =============================================
-- SPACES (isolar por tenant)
-- =============================================
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY spaces_tenant ON spaces
  FOR ALL USING (
    current_tenant_id() = tenant_id
  );

-- =============================================
-- RESERVATIONS (isolar por tenant)
-- =============================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY reservations_tenant ON reservations
  FOR ALL USING (
    current_tenant_id() = tenant_id
  );

-- =============================================
-- PAYMENTS (isolar por tenant)
-- =============================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_tenant ON payments
  FOR ALL USING (
    current_tenant_id() = tenant_id
  );

-- =============================================
-- WORKPLACES (isolar por tenant)
-- =============================================
ALTER TABLE workplaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY workplaces_tenant ON workplaces
  FOR ALL USING (
    current_tenant_id() = tenant_id
  );

-- =============================================
-- DEPENDENTS (herda do member -> tenant)
-- =============================================
ALTER TABLE dependents ENABLE ROW LEVEL SECURITY;

CREATE POLICY dependents_tenant ON dependents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = dependents.member_id
        AND members.tenant_id = current_tenant_id()
    )
  );

-- =============================================
-- AUDIT LOGS (leitura livre, escrita com tenant)
-- =============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_read ON audit_logs
  FOR SELECT USING (
    current_tenant_id() = tenant_id OR current_tenant_id() IS NULL
  );

CREATE POLICY audit_logs_write ON audit_logs
  FOR INSERT WITH CHECK (true);

-- =============================================
-- PLANS (tabela global, apenas admin master)
-- =============================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_public ON plans
  FOR SELECT USING (true);

-- =============================================
-- TENANT_SETTINGS (isolar por tenant)
-- =============================================
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_settings_tenant ON tenant_settings
  FOR ALL USING (
    current_tenant_id() = tenant_id
  );

-- =============================================
-- MEMBERS (isolar por tenant)
-- =============================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_tenant ON members
  FOR ALL USING (current_tenant_id() = tenant_id);

-- =============================================
-- TEAM MEMBERS (isolar por tenant)
-- =============================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_members_tenant ON team_members
  FOR ALL USING (current_tenant_id() = tenant_id);

-- =============================================
-- SESSIONS (usuarios acessam apenas suas próprias sessões)
-- A policy usa app.request_user_id definido por set_tenant_id(user_id)
-- =============================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_user ON sessions
  FOR ALL USING (
    user_id = NULLIF(current_setting('app.request_user_id', true), '')::uuid
  );

-- =============================================
-- FIX: AUDIT LOGS write deve filtrar por tenant
-- =============================================
DROP POLICY IF EXISTS audit_logs_write ON audit_logs;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_write ON audit_logs
  FOR INSERT WITH CHECK (current_tenant_id() = tenant_id);

-- =============================================
-- COMENTARIOS PARA DOCUMENTACAO
-- =============================================
COMMENT ON FUNCTION set_tenant_id IS 'Define o tenant atual (app.tenant_id) e user atual (app.request_user_id) para a sessao. Chamar antes de cada operacao no banco.';
COMMENT ON FUNCTION current_tenant_id IS 'Retorna o tenant_id da sessao atual. Usado pelas politicas RLS.';
