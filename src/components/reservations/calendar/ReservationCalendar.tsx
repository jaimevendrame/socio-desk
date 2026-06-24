'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';
import type { ViewMode } from '@/lib/reservations/schema';
import type { ReservationStatus } from '@/lib/reservations/schema';
import { reservationStatusColors } from '@/lib/design-system/domain-colors';

interface ReservationCalendarProps {
  reservations: Array<{
    id: string;
    spaceId: string;
    spaceName: string;
    memberName: string;
    date: string;
    startTime: string;
    endTime: string;
    status: ReservationStatus;
  }>;
  onDateSelect?: (date: Date) => void;
  onReservationClick?: (reservationId: string) => void;
  onSlotClick?: (date: string, hour: number) => void;
  selectedDate?: Date;
  loading?: boolean;
  className?: string;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00 - 22:00

export function ReservationCalendar({
  reservations,
  onDateSelect,
  onReservationClick,
  onSlotClick,
  selectedDate = new Date(),
  loading = false,
  className = '',
}: ReservationCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(selectedDate);

  const navigate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      if (viewMode === 'day') {
        return direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1);
      }
      if (viewMode === 'week') {
        return direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1);
      }
      return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
    });
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Gera os dias para a visualização atual
  const visibleDays = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate];
    }
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }
    // month
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const monthStart = startOfWeek(start, { weekStartsOn: 0 });
    const monthEnd = endOfWeek(end, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentDate, viewMode]);

  // Agrupa reservas por data
  const reservationsByDate = useMemo(() => {
    const map = new Map<string, typeof reservations>();
    reservations.forEach((res) => {
      const existing = map.get(res.date) || [];
      map.set(res.date, [...existing, res]);
    });
    return map;
  }, [reservations]);

  const getHeaderTitle = () => {
    if (viewMode === 'day') {
      return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      if (format(start, 'MM') === format(end, 'MM')) {
        return `${format(start, "d")} - ${format(end, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
      }
      return `${format(start, "d 'de' MMM", { locale: ptBR })} - ${format(end, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`;
    }
    return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
  };

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isSelected = (date: Date) => isSameDay(date, selectedDate);
  const isCurrentMonth = (date: Date) => isSameMonth(date, currentDate);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold ml-2">{getHeaderTitle()}</h2>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Content */}
      <ScrollArea className="flex-1">
        {viewMode === 'month' ? (
          <MonthView
            days={visibleDays}
            reservationsByDate={reservationsByDate}
            isCurrentMonth={isCurrentMonth}
            isToday={isToday}
            isSelected={isSelected}
            onDateClick={onDateSelect}
            onReservationClick={onReservationClick}
          />
        ) : viewMode === 'week' ? (
          <WeekView
            days={visibleDays}
            hours={HOURS}
            reservations={reservations}
            isToday={isToday}
            onDateClick={onDateSelect}
            onReservationClick={onReservationClick}
            onSlotClick={onSlotClick}
          />
        ) : (
          <DayView
            date={currentDate}
            hours={HOURS}
            reservations={reservationsByDate.get(format(currentDate, 'yyyy-MM-dd')) || []}
            onReservationClick={onReservationClick}
            onSlotClick={onSlotClick}
          />
        )}
      </ScrollArea>

      {/* Legend */}
      <div className="flex items-center gap-4 p-4 border-t text-sm">
        <span className="text-muted-foreground">Status:</span>
        {Object.entries(reservationStatusColors).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${colors.bg}`} />
            <span className={colors.text}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Month View Component
interface MonthViewProps {
  days: Date[];
  reservationsByDate: Map<string, Array<ReservationCalendarProps['reservations'][0]>>;
  isCurrentMonth: (date: Date) => boolean;
  isToday: (date: Date) => boolean;
  isSelected: (date: Date) => boolean;
  onDateClick?: (date: Date) => void;
  onReservationClick?: (id: string) => void;
}

function MonthView({
  days,
  reservationsByDate,
  isCurrentMonth,
  isToday,
  isSelected,
  onDateClick,
  onReservationClick,
}: MonthViewProps) {
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Agrupa dias em semanas
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayReservations = reservationsByDate.get(dateStr) || [];
            const inMonth = isCurrentMonth(day);
            const today = isToday(day);
            const selected = isSelected(day);

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`
                  min-h-[100px] border-b border-r p-1 cursor-pointer
                  ${!inMonth ? 'bg-muted/30' : ''}
                  ${selected ? 'bg-primary/5' : ''}
                  hover:bg-muted/50 transition-colors
                `}
                onClick={() => onDateClick?.(day)}
              >
                <div className="flex items-center justify-between p-1">
                  <span
                    className={`
                      inline-flex items-center justify-center w-7 h-7 text-sm rounded-full
                      ${today ? 'bg-primary text-primary-foreground font-bold' : ''}
                      ${!inMonth ? 'text-muted-foreground' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayReservations.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dayReservations.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayReservations.slice(0, 2).map((res) => (
                    <button
                      key={res.id}
                      className={`
                        w-full text-left text-xs p-0.5 rounded truncate
                        ${reservationStatusColors[res.status].bg}
                        ${reservationStatusColors[res.status].text}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReservationClick?.(res.id);
                      }}
                    >
                      {res.startTime} {res.spaceName}
                    </button>
                  ))}
                  {dayReservations.length > 2 && (
                    <span className="text-xs text-muted-foreground pl-1">
                      +{dayReservations.length - 2} mais
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Week View Component
interface WeekViewProps {
  days: Date[];
  hours: number[];
  reservations: Array<ReservationCalendarProps['reservations'][0]>;
  isToday: (date: Date) => boolean;
  onDateClick?: (date: Date) => void;
  onReservationClick?: (id: string) => void;
  onSlotClick?: (date: string, hour: number) => void;
}

function WeekView({
  days,
  hours,
  reservations,
  isToday,
  onDateClick,
  onReservationClick,
  onSlotClick,
}: WeekViewProps) {
  const getReservationsForSlot = (date: Date, hour: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations.filter((res) => {
      const resHour = parseInt(res.startTime.split(':')[0]);
      const resEndHour = parseInt(res.endTime.split(':')[0]);
      return res.date === dateStr && resHour <= hour && resEndHour > hour;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-background z-10">
        <div className="p-2" />
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`
                p-2 text-center border-l
                ${today ? 'bg-primary/5' : ''}
              `}
            >
              <button
                className="w-full"
                onClick={() => onDateClick?.(day)}
              >
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div
                  className={`
                    text-lg font-semibold
                    ${today ? 'text-primary' : ''}
                  `}
                >
                  {format(day, 'd')}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)]">
          {/* Time labels */}
          <div className="border-r">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-14 border-b text-xs text-muted-foreground text-right pr-2 pt-1"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayReservations = reservations.filter(
              (r) => r.date === dateStr
            );

            return (
              <div key={day.toISOString()} className="relative border-l">
                {hours.map((hour) => {
                  const slotReservations = dayReservations.filter((res) => {
                    const resHour = parseInt(res.startTime.split(':')[0]);
                    return resHour === hour;
                  });

                  return (
                    <div
                      key={hour}
                      className="h-14 border-b hover:bg-muted/30 cursor-pointer transition-colors relative group"
                      onClick={() => onSlotClick?.(dateStr, hour)}
                    >
                      {/* Current time indicator */}
                      {isToday(day) && new Date().getHours() === hour && (
                        <div className="absolute left-0 right-0 top-0 h-0.5 bg-red-500 z-20" />
                      )}

                      {/* Reservations */}
                      {slotReservations.map((res) => {
                        const startMin = parseInt(res.startTime.split(':')[1]);
                        const endHour = parseInt(res.endTime.split(':')[0]);
                        const endMin = parseInt(res.endTime.split(':')[1]);
                        const durationHours = endHour - parseInt(res.startTime.split(':')[0]);
                        const height = durationHours * 56 + ((endMin - startMin) / 60) * 56;

                        return (
                          <button
                            key={res.id}
                            className={`
                              absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-xs
                              overflow-hidden cursor-pointer z-10
                              ${reservationStatusColors[res.status].bg}
                              ${reservationStatusColors[res.status].text}
                              hover:opacity-80 transition-opacity
                            `}
                            style={{ height: `${Math.max(height, 20)}px` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onReservationClick?.(res.id);
                            }}
                          >
                            <div className="font-medium truncate">{res.startTime}</div>
                            <div className="truncate">{res.spaceName}</div>
                          </button>
                        );
                      })}

                      {/* Add button on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSlotClick?.(dateStr, hour);
                          }}
                        >
                          + Reserva
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Day View Component
interface DayViewProps {
  date: Date;
  hours: number[];
  reservations: Array<ReservationCalendarProps['reservations'][0]>;
  onReservationClick?: (id: string) => void;
  onSlotClick?: (date: string, hour: number) => void;
}

function DayView({
  date,
  hours,
  reservations,
  onReservationClick,
  onSlotClick,
}: DayViewProps) {
  const dateStr = format(date, 'yyyy-MM-dd');

  const getReservationsForHour = (hour: number) => {
    return reservations.filter((res) => {
      const resHour = parseInt(res.startTime.split(':')[0]);
      return resHour === hour;
    });
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-4xl mx-auto space-y-2">
        {hours.map((hour) => {
          const hourReservations = getReservationsForHour(hour);
          const isCurrentHour =
            new Date().getHours() === hour &&
            isSameDay(date, new Date());

          return (
            <div key={hour} className="flex gap-4">
              {/* Time label */}
              <div className="w-20 flex-shrink-0">
                <span className="text-sm text-muted-foreground">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>

              {/* Hour slot */}
              <Card
                className={`
                  flex-1 min-h-[60px] p-3 cursor-pointer
                  ${isCurrentHour ? 'ring-2 ring-primary' : ''}
                  hover:border-primary/50 transition-colors
                  ${hourReservations.length > 0 ? '' : 'border-dashed'}
                `}
                onClick={() => onSlotClick?.(dateStr, hour)}
              >
                {hourReservations.length === 0 ? (
                  <div className="text-sm text-muted-foreground h-full flex items-center">
                    Clique para criar reserva
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hourReservations.map((res) => {
                      const startMin = parseInt(res.startTime.split(':')[1]);
                      const endHour = parseInt(res.endTime.split(':')[0]);
                      const endMin = parseInt(res.endTime.split(':')[1]);
                      const durationMinutes =
                        (endHour * 60 + endMin) - (hour * 60 + startMin);

                      return (
                        <button
                          key={res.id}
                          className={`
                            w-full text-left rounded p-2
                            ${reservationStatusColors[res.status].bg}
                            ${reservationStatusColors[res.status].text}
                            hover:opacity-80 transition-opacity
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReservationClick?.(res.id);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {res.startTime} - {res.endTime}
                            </span>
                            <Badge
                              variant="secondary"
                              className={reservationStatusColors[res.status].text}
                            >
                              {res.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {res.spaceName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {durationMinutes} min
                            </span>
                          </div>
                          <div className="text-sm mt-1 opacity-80">
                            {res.memberName}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
