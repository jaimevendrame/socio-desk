import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/db/client';
import { payments, members } from '@/lib/db/schema';
import { and, eq, or, ilike, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { type z } from 'zod';
import { createPaymentSchema, updatePaymentSchema } from '@/lib/payments/schema';

interface UsePaymentsOptions {
  tenantId: string;
  memberId?: string;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  limit?: number;
  sortBy?: 'dueDate' | 'paidDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

interface UsePaymentsResult {
  data: Array<{
    id: string;
    memberId: string;
    memberName: string | null;
    memberEmail?: string | null;
    description: string;
    amount: string;
    dueDate: string;
    paidDate: string | null;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    paymentMethod: string | null;
    receivedBy: string | null;
    notes: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
  }>;
  isLoading: boolean;
  error: Error | null;
  total: number;
  totalPages: number;
  refetch: () => void;
  // Actions
  createPayment: (payment: z.infer<typeof createPaymentSchema>) => Promise<void>;
  updatePayment: (id: string, payment: Partial<z.infer<typeof updatePaymentSchema>>) => Promise<void>;
  markAsPaid: (id: string, paymentMethod: string, notes?: string) => Promise<void>;
}

interface PaymentStats {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  defaultersCount: number;
  totalAmount: number;
  paymentRate: number;
}

export function usePayments(options: UsePaymentsOptions): UsePaymentsResult & { stats: PaymentStats } {
  const [data, setData] = useState<UsePaymentsResult['data']>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalReceived: 0,
    totalPending: 0,
    totalOverdue: 0,
    defaultersCount: 0,
    totalAmount: 0,
    paymentRate: 0,
  });
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
      const { page = 1, limit = 20, sortBy = 'dueDate', sortOrder = 'desc', dateRange } = options;

      // Query principal com joins
      const conditions = [eq(payments.tenantId, tenantId)];

      if (options.memberId) {
        conditions.push(eq(payments.memberId, options.memberId));
      }

      if (options.status) {
        conditions.push(eq(payments.status, options.status));
      }

      if (dateRange) {
        conditions.push(gte(payments.dueDate, dateRange.start));
        conditions.push(lte(payments.dueDate, dateRange.end));
      }

      const query = db
        .select({
          id: payments.id,
          memberId: payments.memberId,
          memberName: members.name,
          memberEmail: members.email,
          description: payments.description,
          amount: payments.amount,
          dueDate: payments.dueDate,
          paidDate: payments.paidDate,
          status: payments.status,
          paymentMethod: payments.paymentMethod,
          receivedBy: payments.receivedBy,
          notes: payments.notes,
          createdAt: payments.createdAt,
          updatedAt: payments.updatedAt,
        })
        .from(payments)
        .leftJoin(members, eq(payments.memberId, members.id))
        .where(and(...conditions))
        .orderBy(
          sortOrder === 'desc' ? desc(payments[sortBy]) : asc(payments[sortBy])
        )
        .limit(limit)
        .offset((page - 1) * limit);

      const result = await query;

      // Query para estatísticas
      const statsQuery = await db
        .select({
          totalPaid: sql`COALESCE(SUM(CASE WHEN ${payments.status} = 'paid' THEN ${payments.amount}::decimal ELSE 0 END), 0)`,
          totalPending: sql`COALESCE(SUM(CASE WHEN ${payments.status} = 'pending' THEN ${payments.amount}::decimal ELSE 0 END), 0)`,
          totalOverdue: sql`COALESCE(SUM(CASE WHEN ${payments.status} = 'overdue' THEN ${payments.amount}::decimal ELSE 0 END), 0)`,
          totalAmount: sql`COALESCE(SUM(${payments.amount}::decimal), 0)`,
          paidCount: sql`COUNT(CASE WHEN ${payments.status} = 'paid' THEN 1 END)`,
          totalCount: sql`COUNT(*)`,
        })
        .from(payments)
        .where(eq(payments.tenantId, tenantId));

      const statsResult = statsQuery[0];
      const totalCountVal = Number(statsResult.totalCount) || 0;
      const paidCountVal = Number(statsResult.paidCount) || 0;

      const newStats: PaymentStats = {
        totalReceived: parseFloat(String(statsResult.totalPaid)) || 0,
        totalPending: parseFloat(String(statsResult.totalPending)) || 0,
        totalOverdue: parseFloat(String(statsResult.totalOverdue)) || 0,
        defaultersCount: new Set(
          result.filter((p) => p.status === 'overdue').map((p) => p.memberId)
        ).size,
        totalAmount: parseFloat(String(statsResult.totalAmount)) || 0,
        paymentRate: totalCountVal > 0
          ? (paidCountVal / totalCountVal) * 100
          : 0,
      };

      // Query para total
      const countQuery = await db
        .select({ count: payments.id })
        .from(payments)
        .where(and(...conditions));

      const totalCount = countQuery.length;

      setData(result);
      setStats(newStats);
      setTotal(totalCount);
      setTotalPages(Math.ceil(totalCount / limit));
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const createPayment = useCallback(async (payment: z.infer<typeof createPaymentSchema>) => {
    try {
      await db.insert(payments).values({
        ...payment,
        amount: payment.amount.toString(),
      });
      await fetchData();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [fetchData]);

  const updatePayment = useCallback(async (id: string, payment: Partial<z.infer<typeof updatePaymentSchema>>) => {
    try {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (payment.description !== undefined) updateData.description = payment.description;
      if (payment.amount !== undefined) updateData.amount = payment.amount.toString();
      if (payment.dueDate !== undefined) updateData.dueDate = payment.dueDate;
      if (payment.paidDate !== undefined) updateData.paidDate = payment.paidDate;
      if (payment.status !== undefined) updateData.status = payment.status;
      if (payment.paymentMethod !== undefined) updateData.paymentMethod = payment.paymentMethod;
      if (payment.notes !== undefined) updateData.notes = payment.notes;

      await db
        .update(payments)
        .set(updateData)
        .where(eq(payments.id, id));
      await fetchData();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [fetchData]);

  const markAsPaid = useCallback(async (id: string, paymentMethod: string, notes?: string) => {
    try {
      await db
        .update(payments)
        .set({
          status: 'paid',
          paidDate: new Date().toISOString().split('T')[0],
          paymentMethod,
          receivedBy: options.memberId, // TODO: Obter usuário autenticado
          receivedAt: new Date(),
          notes,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, id));
      await fetchData();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [fetchData, options.memberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    stats,
    isLoading,
    error,
    total,
    totalPages,
    refetch: fetchData,
    createPayment,
    updatePayment,
    markAsPaid,
  };
}