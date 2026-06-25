import { z } from 'zod';

export const reservationSchema = z.object({
  spaceId: z.string().uuid('Espaço inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
  memberId: z.string().uuid('Membro inválido'),
  status: z.enum(['pendente', 'confirmada', 'cancelada', 'concluida']).default('pendente'),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.enum(['daily', 'weekly']).optional(),
  recurringUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').optional(),
});

export const createReservationSchema = reservationSchema.omit({ memberId: true });
export const updateReservationSchema = reservationSchema.partial();

/**
 * Schema para o formulário de reserva
 * Usado no ReservationForm
 */
export function useReservationFormSchema() {
  return z.object({
    spaceId: z.string().min(1, 'Selecione um espaço'),
    date: z.string().min(1, 'Selecione uma data'),
    startTime: z.string().min(1, 'Selecione o horário de início'),
    endTime: z.string().min(1, 'Selecione o horário de término'),
    memberId: z.string().min(1, 'Selecione um membro'),
    notes: z.string().optional(),
    isRecurring: z.boolean().default(false),
    recurringPattern: z.enum(['daily', 'weekly']).optional(),
    recurringUntil: z.string().optional(),
  });
}

export interface TimeSlot {
  start: string; // HH:mm
  end: string; // HH:mm
  available: boolean;
  reservation?: {
    id: string;
    memberId: string;
    memberName: string;
    status: 'pendente' | 'confirmada' | 'cancelada' | 'concluida';
  };
}

export interface DayAvailability {
  date: string;
  slots: TimeSlot[];
  spaces: Array<{
    id: string;
    name: string;
    category: string;
    slots: TimeSlot[];
  }>;
}

export interface ConflictCheck {
  hasConflict: boolean;
  conflictingReservations: Array<{
    id: string;
    memberId: string;
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

export type ReservationStatus = 'pendente' | 'confirmada' | 'cancelada' | 'concluida';
export type ViewMode = 'day' | 'week' | 'month';
export type RecurringPattern = 'daily' | 'weekly';