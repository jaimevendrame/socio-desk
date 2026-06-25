import { z } from 'zod';

export const createPaymentSchema = z.object({
  tenantId: z.string().uuid(),
  memberId: z.string().uuid(),
  description: z.string().min(1, 'Descrição é obrigatória').max(255),
  amount: z.number().min(0, 'Valor deve ser positivo'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  paidDate: z.string().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
  paymentMethod: z.string().optional(),
  receivedBy: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  description: z.string().min(1).max(255).optional(),
  amount: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  paidDate: z.string().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export const markPaidSchema = z.object({
  paymentMethod: z.enum(['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto']),
  notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;
