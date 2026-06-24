import { useState, useCallback } from 'react';
import { buildApiUrl } from '@/lib/context/tenant-context';

interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingReservations: Array<{
    id: string;
    memberName: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
  availableSlots: Array<{
    start: string;
    end: string;
  }>;
}

interface UseConflictCheckOptions {
  spaceId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  tenantId?: string;
  excludeReservationId?: string;
}

interface UseConflictCheckResult {
  conflict: ConflictCheckResult | null;
  loading: boolean;
  error: Error | null;
  check: (params: UseConflictCheckOptions) => Promise<void>;
}

export function useConflictCheck(): UseConflictCheckResult {
  const [conflict, setConflict] = useState<ConflictCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const check = useCallback(async (params: UseConflictCheckOptions) => {
    if (!params.spaceId || !params.date || !params.startTime || !params.endTime || !params.tenantId) {
      setConflict(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        tenantId: params.tenantId,
        spaceId: params.spaceId,
        date: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
      });

      if (params.excludeReservationId) {
        searchParams.set('excludeReservationId', params.excludeReservationId);
      }

      const url = buildApiUrl(`/api/reservations/check-conflict?${searchParams.toString()}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erro ao verificar conflitos');
      }

      const result = await response.json();
      setConflict(result);
    } catch (err) {
      setError(err as Error);
      setConflict(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    conflict,
    loading,
    error,
    check,
  };
}
