import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/db/client';
import { reservations, members } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { type z } from 'zod';
import { checkConflict } from '@/lib/reservations/conflicts';
import type { ConflictCheck } from '@/lib/reservations/schema';

interface UseConflictCheckOptions {
  spaceId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  tenantId?: string;
  excludeReservationId?: string;
}

interface UseConflictCheckResult {
  conflict: ConflictCheck | null;
  loading: boolean;
  error: Error | null;
  check: (params: UseConflictCheckOptions) => Promise<void>;
}

export function useConflictCheck(): UseConflictCheckResult {
  const [conflict, setConflict] = useState<ConflictCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkConflicts = useCallback(async (params: UseConflictCheckOptions) => {
    if (!params.spaceId || !params.date || !params.startTime || !params.endTime || !params.tenantId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await checkConflict({
        spaceId: params.spaceId,
        date: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
        tenantId: params.tenantId,
        excludeReservationId: params.excludeReservationId,
      });

      setConflict(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    conflict,
    loading,
    error,
    check: checkConflicts,
  };
}
