/**
 * Sistema de Reservas Recorrentes
 *
 * Suporta:
 * - Diária: mesmo horário todos os dias
 * - Semanal: mesmo dia da semana (ex.: toda segunda-feira)
 *
 * Limites:
 * - Diária: máximo 90 dias de antecedência
 * - Semanal: máximo 180 dias de antecedência
 */

import { addDays, addWeeks, format, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MAX_DAILY_RECURRENCE_DAYS = 90;
export const MAX_WEEKLY_RECURRENCE_DAYS = 180;

export type RecurringPattern = 'daily' | 'weekly';

/**
 * Gera lista de datas para uma reserva recorrente
 */
export function generateRecurringDates(
  startDate: string,
  pattern: RecurringPattern,
  endDate: string
): string[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const maxDays = pattern === 'daily' ? MAX_DAILY_RECURRENCE_DAYS : MAX_WEEKLY_RECURRENCE_DAYS;

  const dates: string[] = [];
  let currentDate = start;
  let dayCount = 0;

  while (
    (isBefore(currentDate, end) || format(currentDate, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) &&
    dayCount < maxDays
  ) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    dayCount++;

    if (pattern === 'daily') {
      currentDate = addDays(currentDate, 1);
    } else {
      currentDate = addWeeks(currentDate, 1);
    }
  }

  return dates;
}

/**
 * Valida os parâmetros de uma reserva recorrente
 */
export function validateRecurringReservation(params: {
  startDate: string;
  endDate: string;
  pattern: RecurringPattern;
}): { valid: boolean; error?: string } {
  const { startDate, endDate, pattern } = params;
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const today = new Date();

  // Data de início não pode ser no passado
  if (isBefore(start, today)) {
    return { valid: false, error: 'Data de início não pode ser no passado' };
  }

  // Data de término deve ser após a de início
  if (!isAfter(end, start) && format(start, 'yyyy-MM-dd') !== format(end, 'yyyy-MM-dd')) {
    return { valid: false, error: 'Data de término deve ser após a data de início' };
  }

  // Verifica limites de antecedência
  const maxDays = pattern === 'daily' ? MAX_DAILY_RECURRENCE_DAYS : MAX_WEEKLY_RECURRENCE_DAYS;
  const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (pattern === 'daily' && daysDiff > MAX_DAILY_RECURRENCE_DAYS) {
    return {
      valid: false,
      error: `Reservas diárias não podem ultrapassar ${MAX_DAILY_RECURRENCE_DAYS} dias`,
    };
  }

  if (pattern === 'weekly' && daysDiff > MAX_WEEKLY_RECURRENCE_DAYS) {
    return {
      valid: false,
      error: `Reservas semanais não podem ultrapassar ${MAX_WEEKLY_RECURRENCE_DAYS} dias`,
    };
  }

  return { valid: true };
}

/**
 * Formata a descrição de uma recorrência para exibição
 */
export function formatRecurringDescription(
  pattern: RecurringPattern,
  startDate: string,
  endDate: string
): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const dates = generateRecurringDates(startDate, pattern, endDate);

  if (pattern === 'daily') {
    return `Diariamente de ${format(start, "d 'de' MMMM", { locale: ptBR })} até ${format(end, "d 'de' MMMM 'de' yyyy", { locale: ptBR })} (${dates.length} reservas)`;
  }

  // Para semanal, mostra o nome do dia
  const dayName = format(start, 'EEEE', { locale: ptBR });
  return `Toda ${dayName} de ${format(start, "d 'de' MMMM", { locale: ptBR })} até ${format(end, "d 'de' MMMM 'de' yyyy", { locale: ptBR })} (${dates.length} reservas)`;
}

/**
 * Resumo de impacto de uma reserva recorrente
 */
export interface RecurringImpact {
  totalReservations: number;
  dates: string[];
  conflicts: number;
  validDays: number;
  invalidDays: number;
}

export function calculateRecurringImpact(
  startDate: string,
  pattern: RecurringPattern,
  endDate: string,
  conflictDates: string[]
): RecurringImpact {
  const dates = generateRecurringDates(startDate, pattern, endDate);
  const conflictSet = new Set(conflictDates);

  return {
    totalReservations: dates.length,
    dates,
    conflicts: conflictDates.length,
    validDays: dates.length - conflictDates.length,
    invalidDays: conflictDates.length,
  };
}
