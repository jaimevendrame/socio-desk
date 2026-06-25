import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/db/client';
import { reservations, members, spaces } from '@/lib/db/schema';
import { and, eq, or, ilike, desc, asc } from 'drizzle-orm';
import { type z } from 'zod';
import { createReservationSchema, updateReservationSchema } from '@/lib/reservations/schema';
import { checkConflict } from '@/lib/reservations/conflicts';

interface UseReservationsOptions {
  tenantId: string;
  spaceId?: string;
  memberId?: string;
  status?: 'pendente' | 'confirmada' | 'cancelada' | 'concluida';
  date?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'startTime' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

interface UseReservationsResult {
  data: Array<{
    id: string;
    spaceId: string;
    spaceName: string | null;
    memberId: string;
    memberName: string | null;
    date: string;
    startTime: string;
    endTime: string;
    status: 'pendente' | 'confirmada' | 'cancelada' | 'concluida';
    notes?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
  }>;
  isLoading: boolean;
  error: Error | null;
  total: number;
  totalPages: number;
  refetch: () => void;
}

export function useReservations(options: UseReservationsOptions): UseReservationsResult {
  const [data, setData] = useState<UseReservationsResult['data']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = useCallback(async () => {
    if (!options.tenantId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc' } = options;

      // Query principal com joins
      const query = db
        .select({
          id: reservations.id,
          spaceId: reservations.spaceId,
          spaceName: spaces.name,
          memberId: reservations.memberId,
          memberName: members.name,
          date: reservations.date,
          startTime: reservations.startTime,
          endTime: reservations.endTime,
          status: reservations.status,
          notes: reservations.notes,
          createdAt: reservations.createdAt,
          updatedAt: reservations.updatedAt,
        })
        .from(reservations)
        .leftJoin(members, eq(reservations.memberId, members.id))
        .leftJoin(spaces, eq(reservations.spaceId, spaces.id))
        .where(
          and(
            eq(reservations.tenantId, options.tenantId),
            options.spaceId ? eq(reservations.spaceId, options.spaceId) : undefined,
            options.memberId ? eq(reservations.memberId, options.memberId) : undefined,
            options.status ? eq(reservations.status, options.status) : undefined,
            options.date ? eq(reservations.date, options.date) : undefined,
          )
        )
        .orderBy(
          sortOrder === 'desc'
            ? desc(reservations[sortBy])
            : asc(reservations[sortBy])
        )
        .limit(limit)
        .offset((page - 1) * limit);

      const result = await query;

      // Query para total
      const countQuery = db
        .select({ count: reservations.id })
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, options.tenantId),
            options.spaceId ? eq(reservations.spaceId, options.spaceId) : undefined,
            options.memberId ? eq(reservations.memberId, options.memberId) : undefined,
            options.status ? eq(reservations.status, options.status) : undefined,
            options.date ? eq(reservations.date, options.date) : undefined,
          )
        );

      const countResult = await countQuery;
      const totalCount = countResult.length;

      setData(result);
      setTotal(totalCount);
      setTotalPages(Math.ceil(totalCount / limit));
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
