'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseFetchOptions<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseFetchParams {
  url: string;
  params?: Record<string, string | number | boolean | undefined>;
  dependencies?: unknown[];
}

export function useFetch<T>({ url, params, dependencies = [] }: UseFetchParams): UseFetchOptions<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Construir URL com query params
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const fullUrl = queryParams.toString()
        ? `${url}?${queryParams.toString()}`
        : url;

      const response = await fetch(fullUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const result = await response.json();
      setData(result.data ?? result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
}

// Hook para mutations (POST, PUT, DELETE)
interface UseMutationOptions<T> {
  mutate: (body: T) => Promise<{ success: boolean; data?: unknown; error?: string }>;
  loading: boolean;
  error: string | null;
}

export function useMutation<TInput, TOutput>(url: string, method: 'POST' | 'PUT' | 'DELETE' = 'POST'): UseMutationOptions<TInput> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (body: TInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [url, method]);

  return { mutate, loading, error };
}
