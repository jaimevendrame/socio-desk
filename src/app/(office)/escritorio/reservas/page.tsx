'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/lib/context/tenant-context';
import { ReservationCalendar } from '@/components/reservations/ReservationCalendar';
import { ReservationForm } from '@/components/reservations/ReservationForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useReservations } from '@/hooks/useReservations';

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

export default function CalendarPage() {
  const { tenantId } = useTenant();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Buscar reservas
  const { data: reservationsData, isLoading } = useReservations({
    tenantId,
    date: selectedDate.toISOString().split('T')[0],
  });

  useEffect(() => {
    if (reservationsData) {
      setReservations(reservationsData);
    }
  }, [reservationsData]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleReservationClick = (reservationId: string) => {
    // TODO: Abrir modal de detalhes da reserva
    console.log('Abrir detalhes da reserva:', reservationId);
  };

  const handleSlotClick = (date: string, hour: number) => {
    setSelectedDate(new Date(date));
    // TODO: Abrir formulário de reserva
    console.log('Abrir formulário para:', date, hour);
  };

  const handleReservationSuccess = () => {
    // Recarregar reservas após criação
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendário de Reservas</h1>
          <p className="text-muted-foreground">
            {selectedDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReservationForm
            date={selectedDate.toISOString().split('T')[0]}
            onSuccess={handleReservationSuccess}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ReservationCalendar
              reservations={reservations}
              onDateSelect={handleDateSelect}
              onReservationClick={handleReservationClick}
              onSlotClick={handleSlotClick}
              selectedDate={selectedDate}
              loading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Reservations List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reservas do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">📅</div>
                <p>Nenhuma reserva para este dia</p>
                <p className="text-sm mt-2">Clique no calendário para criar</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {reservations.map((res) => (
                  <div key={res.id} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
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
                            : res.status === 'cancelada'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }>
                          {res.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {res.startTime.slice(0, 5)} - {res.endTime.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1 text-muted-foreground">
                      <span>👤 {res.memberName || 'Membro'}</span>
                    </div>
                    {res.notes && (
                      <div className="text-sm text-muted-foreground mt-2">
                        {res.notes}
                      </div>
                    )}
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
