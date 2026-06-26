-- Socio Desk RLS Migration
-- Habilita Row-Level Security para multi-tenant
-- Aplicar: npx drizzle-kit push ou npx tsx drizzle/migrations/0001_rls.sql

-- Criar extensao pgcrypto se nao existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar funcao para definir tenant atual (usado pelo app)
CREATE OR REPLACE FUNCTION set_tenant_id(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_uuid::TEXT, true);
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
-- COMENTARIOS PARA DOCUMENTACAO
-- =============================================
COMMENT ON FUNCTION set_tenant_id IS 'Define o tenant atual para a sessao. Chamar antes de cada operacao no banco.';
COMMENT ON FUNCTION current_tenant_id IS 'Retorna o tenant_id da sessao atual. Usado pelas politicas RLS.';
