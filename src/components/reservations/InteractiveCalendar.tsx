'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ViewMode = 'day' | 'week' | 'month';

interface CalendarReservation {
  id: string;
  spaceId: string;
  spaceName: string | null;
  memberId: string;
  memberName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pendente' | 'confirmada' | 'cancelada' | 'concluida';
}

interface InteractiveCalendarProps {
  reservations: CalendarReservation[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onReservationClick: (id: string) => void;
  onSlotClick?: (date: string, hour: number) => void;
}

export function InteractiveCalendar({
  reservations,
  selectedDate,
  onDateSelect,
  onReservationClick,
  onSlotClick,
}: InteractiveCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(selectedDate);

  const goToToday = () => setCurrentDate(new Date());

  const goToPrevious = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goToNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  // Agrupa reservas por data para fácil lookup
  const reservationsByDate = useMemo(() => {
    const map = new Map<string, CalendarReservation[]>();
    reservations.forEach((r) => {
      const existing = map.get(r.date) || [];
      map.set(r.date, [...existing, r]);
    });
    return map;
  }, [reservations]);

  // Dias da semana
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Gera dias do mês para o grid
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Gera dias da semana selecionada
  const weekDaysList = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: start, end: addDays(start, 6) });
  }, [currentDate]);

  // Gera horas do dia (6h às 22h)
  const hours = Array.from({ length: 16 }, (_, i) => i + 6);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada': return 'bg-blue-500';
      case 'pendente': return 'bg-yellow-500';
      case 'cancelada': return 'bg-gray-400';
      case 'concluida': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const formatHeader = () => {
    if (viewMode === 'month') return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = addDays(start, 6);
      return `${format(start, "d 'de' MMM", { locale: ptBR })} - ${format(end, "d 'de' MMM yyyy", { locale: ptBR })}`;
    }
    return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="font-medium capitalize">{formatHeader()}</h3>
        </div>

        {/* View Mode Toggles */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'day' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Dia
          </Button>
          <Button
            variant={viewMode === 'week' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Semana
          </Button>
          <Button
            variant={viewMode === 'month' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Mês
          </Button>
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === 'month' && (
        <div className="border rounded-lg overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 bg-muted">
            {weekDays.map((day) => (
              <div key={day} className="py-2 text-center text-sm font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayReservations = reservationsByDate.get(dateStr) || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={dateStr}
                  className={`
                    min-h-[100px] border-t border-r p-1 cursor-pointer transition-colors
                    ${!isCurrentMonth ? 'bg-muted/50' : 'bg-background'}
                    ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}
                    hover:bg-muted/30
                  `}
                  onClick={() => onDateSelect(day)}
                >
                  <div className={`
                    text-sm p-1 rounded-full w-7 h-7 flex items-center justify-center
                    ${isTodayDate ? 'bg-primary text-primary-foreground' : ''}
                    ${!isCurrentMonth ? 'text-muted-foreground' : ''}
                  `}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1 mt-1">
                    {dayReservations.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className={`
                          text-xs px-1 py-0.5 rounded truncate cursor-pointer
                          ${getStatusColor(r.status)} text-white
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onReservationClick(r.id);
                        }}
                        title={`${r.startTime.slice(0, 5)} - ${r.spaceName}`}
                      >
                        {r.startTime.slice(0, 5)} {r.spaceName}
                      </div>
                    ))}
                    {dayReservations.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayReservations.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="border rounded-lg overflow-hidden">
          {/* Week header */}
          <div className="grid grid-cols-8 bg-muted">
            <div className="py-2 px-2 text-sm font-medium">Horário</div>
            {weekDaysList.map((day) => (
              <div
                key={day.toISOString()}
                className={`
                  py-2 text-center text-sm
                  ${isToday(day) ? 'bg-primary/10' : ''}
                `}
              >
                <div className="font-medium">{format(day, 'EEE', { locale: ptBR })}</div>
                <div className={`text-xs ${isToday(day) ? 'text-primary font-bold' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="max-h-[500px] overflow-y-auto">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-t">
                <div className="py-2 px-2 text-xs text-muted-foreground">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDaysList.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayReservations = reservationsByDate.get(dateStr) || [];
                  const hourReservations = dayReservations.filter((r) => {
                    const resHour = parseInt(r.startTime.split(':')[0]);
                    return resHour === hour;
                  });

                  return (
                    <div
                      key={`${dateStr}-${hour}`}
                      className={`
                        min-h-[50px] border-l p-1
                        ${isToday(day) ? 'bg-primary/5' : ''}
                      `}
                      onClick={() => onSlotClick?.(dateStr, hour)}
                    >
                      {hourReservations.map((r) => (
                        <div
                          key={r.id}
                          className={`
                            text-xs px-1 py-0.5 rounded mb-1 cursor-pointer
                            ${getStatusColor(r.status)} text-white
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReservationClick(r.id);
                          }}
                        >
                          {r.startTime.slice(0, 5)} {r.spaceName}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'day' && (
        <div className="border rounded-lg overflow-hidden">
          {/* Day header */}
          <div className="bg-muted py-3 px-4">
            <div className="text-lg font-medium">
              {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </div>
            {isToday(currentDate) && (
              <Badge variant="secondary">Hoje</Badge>
            )}
          </div>

          {/* Time slots */}
          <div className="max-h-[500px] overflow-y-auto">
            {hours.map((hour) => {
              const dateStr = format(currentDate, 'yyyy-MM-dd');
              const dayReservations = reservationsByDate.get(dateStr) || [];
              const hourReservations = dayReservations.filter((r) => {
                const resHour = parseInt(r.startTime.split(':')[0]);
                return resHour === hour;
              });

              return (
                <div
                  key={hour}
                  className="flex border-t min-h-[60px]"
                  onClick={() => onSlotClick?.(dateStr, hour)}
                >
                  <div className="w-20 py-2 px-3 text-sm text-muted-foreground border-r shrink-0">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 p-2 space-y-1">
                    {hourReservations.map((r) => (
                      <div
                        key={r.id}
                        className={`
                          rounded-lg p-2 cursor-pointer transition-all hover:scale-[1.02]
                          ${getStatusColor(r.status)} text-white
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onReservationClick(r.id);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{r.spaceName}</div>
                            <div className="text-sm opacity-90">
                              {r.startTime.slice(0, 5)} - {r.endTime.slice(0, 5)}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`
                              text-xs
                              ${r.status === 'confirmada' ? 'bg-green-200 text-green-800' : ''}
                              ${r.status === 'pendente' ? 'bg-yellow-200 text-yellow-800' : ''}
                            `}
                          >
                            {r.status}
                          </Badge>
                        </div>
                        <div className="text-sm mt-1 opacity-90">
                          👤 {r.memberName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Confirmada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Pendente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Concluída</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-400" />
          <span>Cancelada</span>
        </div>
      </div>
    </div>
  );
}
