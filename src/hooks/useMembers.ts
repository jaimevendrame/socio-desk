import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/db/client';
import { members } from '@/lib/db/schema';
import { and, eq, or, ilike, desc, asc } from 'drizzle-orm';

interface UseMembersOptions {
  tenantId: string;
  status?: 'ativo' | 'inadimplente' | 'suspenso' | 'cancelado';
  search?: string;
  page?: number;
  limit?: number;
}

interface UseMembersResult {
  data: Array<{
    id: string;
    name: string;
    email: string;
    cpf: string;
    status: 'ativo' | 'inadimplente' | 'suspenso' | 'cancelado';
    phoneMobile?: string;
  }>;
  isLoading: boolean;
  error: Error | null;
  total: number;
  totalPages: number;
  refetch: () => void;
}

export function useMembers(options: Partial<UseMembersOptions> = {}): UseMembersResult {
  const [data, setData] = useState<UseMembersResult['data']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = useCallback(async () => {
    const tenantId = options.tenantId;
    if (!tenantId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { page = 1, limit = 50, status, search } = options;

      const conditions = [eq(members.tenantId, tenantId)];

      if (status) {
        conditions.push(eq(members.status, status));
      }

      if (search) {
        conditions.push(
          or(
            ilike(members.name, `%${search}%`),
            ilike(members.cpf, `%${search}%`),
            ilike(members.email, `%${search}%`)
          )!
        );
      }

      const result = await db
        .select({
          id: members.id,
          name: members.name,
          email: members.email,
          cpf: members.cpf,
          status: members.status,
          phoneMobile: members.phoneMobile,
        })
        .from(members)
        .where(and(...conditions))
        .orderBy(ilike(members.name, search || ''))
        .limit(limit)
        .offset((page - 1) * limit);

      // Para paginação, buscamos o total separadamente
      const countResult = await db
        .select({ id: members.id })
        .from(members)
        .where(and(...conditions));

      setData(result);
      setTotal(countResult.length);
      setTotalPages(Math.ceil(countResult.length / limit));
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    total,
    totalPages,
    refetch: fetchData,
  };
}
