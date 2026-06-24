'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';

interface Reservation {
  id: string;
  spaceId: string;
  spaceName?: string;
  memberId: string;
  memberName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pendente' | 'confirmada' | 'cancelada' | 'concluida';
  notes: string | null;
}

interface ReservationsApiResponse {
  data: Reservation[];
}

const statusColors: Record<string, string> = {
  confirmada: 'bg-blue-500',
  pendente: 'bg-yellow-500',
  cancelada: 'bg-gray-400',
  concluida: 'bg-green-500',
};

export default function CalendarPage() {
  const { tenantId } = useTenant();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar reservas do backend
  useEffect(() => {
    async function fetchReservations() {
      try {
        setLoading(true);
        // Buscar reservas do mês atual
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const startDate = `${year}-${month}-01`;
        const lastDay = new Date(year, currentDate.getMonth() + 1, 0).getDate();
        const endDate = `${year}-${month}-${lastDay}`;

        const url = buildApiUrl('/api/reservations', { startDate, endDate });
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao carregar reservas');
        const data: ReservationsApiResponse = await response.json();
        setReservations(data.data || []);
      } catch (err) {
        console.error('Erro ao carregar reservas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReservations();
  }, [tenantId, currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    // Previous month days
    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -startingDay + i + 1);
      days.push({ date: prevDate, currentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), currentMonth: true });
    }
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), currentMonth: false });
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getReservationsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.filter((r) => r.date === dateStr);
  };

  const todayReservations = getReservationsForDate(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendário de Reservas</h1>
          <p className="text-muted-foreground">Visualize todas as reservas do mês</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-40 text-center font-medium capitalize">{monthName}</span>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {/* Week days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dayReservations = day.currentMonth ? getReservationsForDate(day.date) : [];
                return (
                  <div
                    key={index}
                    className={`min-h-24 rounded-lg border p-1 transition-colors ${
                      day.currentMonth ? 'bg-background' : 'bg-muted/30'
                    } ${isToday(day.date) ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className={`text-sm p-1 ${day.currentMonth ? '' : 'text-muted-foreground'}`}>
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayReservations.slice(0, 3).map((res) => (
                        <div
                          key={res.id}
                          className={`text-xs px-1 py-0.5 rounded truncate text-white ${statusColors[res.status] || 'bg-gray-400'}`}
                        >
                          {res.startTime.slice(0, 5)} {res.spaceName || 'Espaço'}
                        </div>
                      ))}
                      {dayReservations.length > 3 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayReservations.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reservations List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reservas de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : todayReservations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma reserva hoje</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayReservations.map((res) => (
                  <div key={res.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {res.spaceName || 'Espaço'}
                        </Badge>
                        <Badge className={
                          res.status === 'confirmada'
                            ? 'bg-green-100 text-green-800'
                            : res.status === 'pendente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }>
                          {res.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{res.startTime.slice(0, 5)} - {res.endTime.slice(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>{res.memberName || 'Membro'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
