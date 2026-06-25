/**
 * Sistema de Detecção de Conflitos de Reserva
 *
 * Duas reservas R1 e R2 conflitam se e somente se:
 * R1.space_id = R2.space_id
 * AND R1.date = R2.date
 * AND R1.start_time < R2.end_time
 * AND R1.end_time > R2.start_time
 *
 * Com buffer configurável para tempo de limpeza/transição
 */

import { db } from '@/lib/db/client';
import { reservations } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import type { ConflictCheck } from './schema';

const DEFAULT_BUFFER_MINUTES = 15;
const MIN_RESERVATION_MINUTES = 30;
const MAX_RESERVATION_MINUTES = 480;

export interface ConflictCheckParams {
  spaceId: string;
  date: string;
  startTime: string;
  endTime: string;
  tenantId: string;
  excludeReservationId?: string;
}

/**
 * Converte horário HH:mm para minutos desde meia-noite
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos desde meia-noite para horário HH:mm
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Verifica se dois intervalos de tempo se sobrepõem
 * Considera o buffer para tempo de transição
 */
export function intervalsOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
  bufferMinutes: number = DEFAULT_BUFFER_MINUTES
): boolean {
  // Aplica buffer no segundo intervalo
  const bufferEnd1 = end1 + bufferMinutes;
  const bufferStart2 = start2 - bufferMinutes;

  return start1 < bufferEnd1 && bufferEnd1 > start2;
}

/**
 * Verifica se os horários são válidos
 */
export function validateReservationTimes(
  startTime: string,
  endTime: string
): { valid: boolean; error?: string } {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    return { valid: false, error: 'Horário de término deve ser após o início' };
  }

  const duration = endMinutes - startMinutes;

  if (duration < MIN_RESERVATION_MINUTES) {
    return { valid: false, error: `Duração mínima é ${MIN_RESERVATION_MINUTES} minutos` };
  }

  if (duration > MAX_RESERVATION_MINUTES) {
    return { valid: false, error: `Duração máxima é ${MAX_RESERVATION_MINUTES} minutos (8 horas)` };
  }

  return { valid: true };
}

/**
 * Obtém todas as reservas de um espaço em uma data específica
 */
export async function getReservationsForDate(
  spaceId: string,
  date: string,
  tenantId: string,
  excludeId?: string
) {
  const conditions: any[] = [
    eq(reservations.spaceId, spaceId),
    eq(reservations.date, date),
    eq(reservations.tenantId, tenantId),
  ];

  // Build the query based on whether we have an excludeId
  const query = db
    .select({
      id: reservations.id,
      spaceId: reservations.spaceId,
      date: reservations.date,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      memberId: reservations.memberId,
      status: reservations.status,
    })
    .from(reservations)
    .where(and(...conditions));

  return query;
}

/**
 * Verifica se há conflitos para uma nova reserva
 * Retorna detalhes do conflito se existir
 */
export async function checkConflict(
  params: ConflictCheckParams,
  bufferMinutes: number = DEFAULT_BUFFER_MINUTES
): Promise<ConflictCheck> {
  const { spaceId, date, startTime, endTime, tenantId, excludeReservationId } = params;

  // Valida horários
  const validation = validateReservationTimes(startTime, endTime);
  if (!validation.valid) {
    return {
      hasConflict: false,
      conflictingReservations: [],
      availableSlots: [],
    };
  }

  // Busca reservas do mesmo espaço na mesma data
  const existingReservations = await db
    .select({
      id: reservations.id,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      memberId: reservations.memberId,
    })
    .from(reservations)
    .where(
      and(
        eq(reservations.spaceId, spaceId),
        eq(reservations.date, date),
        eq(reservations.tenantId, tenantId),
        eq(reservations.status, 'confirmada')
      )
    );

  // Filtra conflitos
  const conflictingReservations = existingReservations.filter((res) => {
    // Ignora a própria reserva se estiver editando
    if (excludeReservationId && res.id === excludeReservationId) {
      return false;
    }

    const resStart = timeToMinutes(res.startTime);
    const resEnd = timeToMinutes(res.endTime);
    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    return intervalsOverlap(newStart, newEnd, resStart, resEnd, bufferMinutes);
  });

  return {
    hasConflict: conflictingReservations.length > 0,
    conflictingReservations: conflictingReservations.map((r) => ({
      id: r.id,
      memberId: r.memberId,
      memberName: '', // Será preenchido com join na query
      date,
      startTime: r.startTime,
      endTime: r.endTime,
    })),
    availableSlots: calculateAvailableSlots(date, existingReservations, bufferMinutes),
  };
}

/**
 * Calcula os horários disponíveis em um dia
 */
export function calculateAvailableSlots(
  date: string,
  existingReservations: Array<{ startTime: string; endTime: string }>,
  bufferMinutes: number = DEFAULT_BUFFER_MINUTES
): Array<{ start: string; end: string }> {
  // Horário de funcionamento: 06:00 - 22:00
  const OPEN_HOUR = 6;
  const CLOSE_HOUR = 22;

  const openMinutes = OPEN_HOUR * 60;
  const closeMinutes = CLOSE_HOUR * 60;

  const slots: Array<{ start: string; end: string }> = [];

  // Ordena reservas por horário de início
  const sorted = [...existingReservations].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  let currentStart = openMinutes;

  for (const reservation of sorted) {
    const resStart = timeToMinutes(reservation.startTime);
    const resEnd = timeToMinutes(reservation.endTime) + bufferMinutes;

    // Se há tempo disponível antes desta reserva
    if (currentStart < resStart) {
      //分段: cria slots de 30 minutos
      let slotStart = currentStart;
      while (slotStart + MIN_RESERVATION_MINUTES <= resStart) {
        const slotEnd = Math.min(slotStart + MIN_RESERVATION_MINUTES, resStart);
        slots.push({
          start: minutesToTime(slotStart),
          end: minutesToTime(slotEnd),
        });
        slotStart += MIN_RESERVATION_MINUTES;
      }
    }

    // Move para após a reserva (considerando buffer)
    currentStart = Math.max(currentStart, resEnd);
  }

  // Adiciona tempo após última reserva até fechamento
  while (currentStart + MIN_RESERVATION_MINUTES <= closeMinutes) {
    const slotEnd = Math.min(currentStart + MIN_RESERVATION_MINUTES, closeMinutes);
    slots.push({
      start: minutesToTime(currentStart),
      end: minutesToTime(slotEnd),
    });
    currentStart += MIN_RESERVATION_MINUTES;
  }

  return slots;
}

/**
 * Verifica conflitos para uma reserva recorrente
 */
export async function checkRecurringConflicts(
  spaceId: string,
  startTime: string,
  endTime: string,
  tenantId: string,
  dates: string[],
  bufferMinutes: number = DEFAULT_BUFFER_MINUTES
): Promise<Map<string, ConflictCheck>> {
  const results = new Map<string, ConflictCheck>();

  for (const date of dates) {
    const check = await checkConflict(
      { spaceId, date, startTime, endTime, tenantId },
      bufferMinutes
    );
    results.set(date, check);
  }

  return results;
}
