'use client';

import { createContext, useContext, ReactNode } from 'react';

export interface TenantData {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

const DEFAULT_TENANT: TenantData = {
  tenantId: '1bdd8429-6dce-42ea-bf5b-6dc39a7a5490',
  tenantName: 'Clube Exemplo',
  tenantSlug: 'dev',
};

interface TenantContextType {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

const TenantContext = createContext<TenantContextType>(DEFAULT_TENANT);

export function TenantProvider({
  children,
  initialTenant,
}: {
  children: ReactNode;
  initialTenant?: TenantData;
}) {
  const tenant = initialTenant ?? DEFAULT_TENANT;
  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}

export function buildApiUrl(
  baseUrl: string,
  tenantId: string,
  additionalParams?: Record<string, string | number | boolean | null | undefined>
) {
  const params = new URLSearchParams({ tenantId });
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  return `${baseUrl}?${params.toString()}`;
}
