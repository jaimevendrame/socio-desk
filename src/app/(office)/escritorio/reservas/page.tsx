'use client';

import { useState, useEffect } from 'react';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';
import { ReservationForm } from '@/components/reservations/ReservationForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  // Buscar reservas
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Busca reservas do dia específico
      const url = buildApiUrl('/api/reservations', {
        tenantId,
        startDate: dateStr,
        endDate: dateStr,
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
  };

  useEffect(() => {
    fetchReservations();
  }, [tenantId, selectedDate]);

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
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
          <ReservationForm
            date={selectedDate.toISOString().split('T')[0]}
            onSuccess={handleReservationSuccess}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Simples */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">📅</div>
              <p>Calendário interativo será implementado</p>
              <p className="text-sm mt-2">Use o seletor de data acima</p>
            </div>
          </CardContent>
        </Card>

        {/* Reservations List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Reservas do Dia</span>
              <button
                onClick={fetchReservations}
                className="text-sm text-blue-600 hover:underline"
              >
                🔄 Atualizar
              </button>
            </CardTitle>
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
            ) : reservations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">📅</div>
                <p>Nenhuma reserva para este dia</p>
                <p className="text-sm mt-2">Clique em "Nova Reserva" para criar</p>
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
                          {formatStatus(res.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {res.startTime.slice(0, 5)} - {res.endTime.slice(0, 5)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      👤 {res.memberName || 'Membro'}
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
