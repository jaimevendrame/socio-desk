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