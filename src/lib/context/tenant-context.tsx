'use client';

import { createContext, useContext, ReactNode } from 'react';

// Tenant Context para multi-tenant
interface TenantContextType {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

const TenantContext = createContext<TenantContextType | null>(null);

// Tenant ID do banco de dados - atualizado após seed
const DEMO_TENANT_ID = '1bdd8429-6dce-42ea-bf5b-6dc39a7a5490';
const DEMO_TENANT_NAME = 'Clube Exemplo Desenvolvimento';
const DEMO_TENANT_SLUG = 'dev';

export function TenantProvider({ children }: { children: ReactNode }) {
  // TODO: Obter tenant do subdomain ou sessao quando auth estiver pronto
  // Por enquanto, usa tenant de demostracao
  const tenant = {
    tenantId: DEMO_TENANT_ID,
    tenantName: DEMO_TENANT_NAME,
    tenantSlug: DEMO_TENANT_SLUG,
  };

  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// Helper para construir URLs com tenantId
export function buildApiUrl(baseUrl: string, additionalParams?: Record<string, string | number | boolean>) {
  const params = new URLSearchParams({ tenantId: DEMO_TENANT_ID });
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  return `${baseUrl}?${params.toString()}`;
}
