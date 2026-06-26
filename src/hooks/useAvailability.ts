import { useState, useCallback, useEffect } from 'react';
import { buildApiUrl } from '@/lib/context/tenant-context';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  reservation?: {
    id: string;
    memberId: string;
    memberName: string;
    status: 'pendente' | 'confirmada' | 'cancelada' | 'concluida';
  };
}

interface SpaceAvailability {
  id: string;
  name: string;
  category: string;
  openTime: string;
  closeTime: string;
  bufferMinutes: number;
  slots: TimeSlot[];
}

interface UseAvailabilityOptions {
  tenantId?: string;
  spaceId?: string;
  date?: string;
}

interface UseAvailabilityResult {
  spaces: SpaceAvailability[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAvailability(options: UseAvailabilityOptions): UseAvailabilityResult {
  const [spaces, setSpaces] = useState<SpaceAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!options.tenantId || !options.date) {
      setSpaces([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {
        date: options.date,
      };

      if (options.spaceId) {
        params.spaceId = options.spaceId;
      }

      const url = buildApiUrl('/api/spaces/availability', options.tenantId ?? '', params);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erro ao buscar disponibilidade');
      }

      const result = await response.json();
      setSpaces(result.data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return {
    spaces,
    loading,
    error,
    refetch: fetchAvailability,
  };
}
