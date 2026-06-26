'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';
import { ReservationForm } from '@/components/reservations/ReservationForm';
import { InteractiveCalendar } from '@/components/reservations/InteractiveCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Reservation {
  id: string;
  spaceId: string;
  spaceName: string | null;
  memberId: string;
  memberName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pendente' | 'confirmada' | 'cancelada' | 'concluida';
  notes: string | null;
}

export default function CalendarPage() {
  const { tenantId } = useTenant();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showReservationDetails, setShowReservationDetails] = useState(false);

  // Busca reservas do mês selecionado para o calendário
  const fetchReservations = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);

      // Busca reservas do mês inteiro para o calendário
      const startOfMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const startStr = startOfMonthDate.toISOString().split('T')[0];
      const endStr = endOfMonthDate.toISOString().split('T')[0];

      const url = buildApiUrl('/api/reservations', tenantId, {
        startDate: startStr,
        endDate: endStr,
      });

      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao carregar reservas');

      const data = await response.json();
      setReservations(data.data || []);
    } catch (err) {
      console.error('Erro ao carregar reservas:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedDate]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleReservationClick = (id: string) => {
    const reservation = reservations.find((r) => r.id === id);
    if (reservation) {
      setSelectedReservation(reservation);
      setShowReservationDetails(true);
    }
  };

  const handleReservationSuccess = () => {
    fetchReservations();
  };

  const formatStatus = (status: string) => {
    const labels: Record<string, string> = {
      pendente: 'Pendente',
      confirmada: 'Confirmada',
      cancelada: 'Cancelada',
      concluida: 'Concluída',
    };
    return labels[status] || status;
  };

  // Reservas do dia selecionado
  const dayReservations = reservations.filter(
    (r) => r.date === selectedDate.toISOString().split('T')[0]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendário de Reservas</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todas as reservas
          </p>
        </div>
        <ReservationForm
          date={selectedDate.toISOString().split('T')[0]}
          onSuccess={handleReservationSuccess}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendário Interativo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && reservations.length === 0 ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : (
              <InteractiveCalendar
                reservations={reservations}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onReservationClick={handleReservationClick}
                onSlotClick={(date, hour) => {
                  setSelectedDate(new Date(date + 'T00:00:00'));
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Painel lateral */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>
                {selectedDate.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchReservations}
                className="text-xs"
              >
                🔄
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : dayReservations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-muted-foreground">Nenhuma reserva</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em "Nova Reserva" para criar
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {dayReservations.map((res) => (
                  <div
                    key={res.id}
                    className="rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleReservationClick(res.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
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
                        {formatStatus(res.status)}
                      </Badge>
                    </div>
                    <div className="font-medium">
                      {res.startTime.slice(0, 5)} - {res.endTime.slice(0, 5)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      👤 {res.memberName || 'Membro'}
                    </div>
                    {res.notes && (
                      <div className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {res.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Stats do dia */}
            {dayReservations.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="text-lg font-bold">{dayReservations.length}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-700">
                      {dayReservations.filter((r) => r.status === 'confirmada').length}
                    </div>
                    <div className="text-xs text-green-600">Confirmadas</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Detalhes da Reserva */}
      <Dialog open={showReservationDetails} onOpenChange={setShowReservationDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Reserva</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Espaço</label>
                  <p className="mt-1">{selectedReservation.spaceName || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="mt-1">
                    <Badge className={
                      selectedReservation.status === 'confirmada'
                        ? 'bg-green-100 text-green-800'
                        : selectedReservation.status === 'pendente'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }>
                      {formatStatus(selectedReservation.status)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Membro</label>
                  <p className="mt-1">{selectedReservation.memberName || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data</label>
                  <p className="mt-1">
                    {new Date(selectedReservation.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Horário</label>
                  <p className="mt-1">
                    {selectedReservation.startTime.slice(0, 5)} - {selectedReservation.endTime.slice(0, 5)}
                  </p>
                </div>
              </div>
              {selectedReservation.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Observações</label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedReservation.notes}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowReservationDetails(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
