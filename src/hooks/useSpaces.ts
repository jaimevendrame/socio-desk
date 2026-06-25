import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/db/client';
import { spaces } from '@/lib/db/schema';
import { and, eq, or, ilike, desc, asc } from 'drizzle-orm';

interface UseSpacesOptions {
  tenantId: string;
  category?: 'esportivo' | 'social' | 'equipamento';
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

interface UseSpacesResult {
  data: Array<{
    id: string;
    name: string;
    category: 'esportivo' | 'social' | 'equipamento';
    description?: string | null;
    photoUrl?: string | null;
    bufferMinutes: number;
    minReservationMinutes: number;
    maxReservationMinutes: number;
    maxAdvanceDays: number;
    maxReservationsPerDay?: number | null;
    openTime: string;
    closeTime: string;
    hasCost: boolean;
    costAmount?: number | string | null;
    isActive: boolean;
  }>;
  isLoading: boolean;
  error: Error | null;
  total: number;
  totalPages: number;
  refetch: () => void;
}

export function useSpaces(options: Partial<UseSpacesOptions> = {}): UseSpacesResult {
  const [data, setData] = useState<UseSpacesResult['data']>([]);
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
      const { page = 1, limit = 50, category, search, isActive } = options;

      const conditions = [eq(spaces.tenantId, tenantId)];

      if (category) {
        conditions.push(eq(spaces.category, category));
      }

      if (isActive !== undefined) {
        conditions.push(eq(spaces.isActive, isActive));
      }

      if (search) {
        conditions.push(
          or(
            ilike(spaces.name, `%${search}%`),
            ilike(spaces.description, `%${search}%`)
          )!
        );
      }

      const result = await db
        .select({
          id: spaces.id,
          name: spaces.name,
          category: spaces.category,
          description: spaces.description,
          photoUrl: spaces.photoUrl,
          bufferMinutes: spaces.bufferMinutes,
          minReservationMinutes: spaces.minReservationMinutes,
          maxReservationMinutes: spaces.maxReservationMinutes,
          maxAdvanceDays: spaces.maxAdvanceDays,
          maxReservationsPerDay: spaces.maxReservationsPerDay,
          openTime: spaces.openTime,
          closeTime: spaces.closeTime,
          hasCost: spaces.hasCost,
          costAmount: spaces.costAmount,
          isActive: spaces.isActive,
        })
        .from(spaces)
        .where(and(...conditions))
        .orderBy(desc(spaces.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);

      // Para paginação, buscamos o total separadamente
      const countResult = await db
        .select({ id: spaces.id })
        .from(spaces)
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
