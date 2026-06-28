'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';
import { useAuth } from '@/lib/auth/client';

interface Reservation {
  id: string;
  spaceId: string;
  spaceName: string;
  memberId: string;
  memberName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pendente' | 'confirmada' | 'cancelada' | 'concluida';
  notes?: string;
  amount?: number;
  isPaid?: boolean;
}

const statusConfig = {
  confirmada: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR');
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { weekday: 'long' });
}

export default function ReservationsPage() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  // Buscar memberId do usuário logado
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    async function fetchMemberId() {
      try {
        const userId = user?.id;
        if (!userId) return;
        const res = await fetch(`/api/members?userId=${userId}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setMemberId(data.data?.[0]?.id || null);
        }
      } catch (err) {
        console.error('[reservas] fetchMemberId error:', err);
      }
    }
    fetchMemberId();
  }, [user?.id]);

  // Buscar reservas quando tiver memberId
  useEffect(() => {
    if (!memberId || !tenantId) return;

    async function fetchReservations() {
      try {
        setLoading(true);
        const url = buildApiUrl('/api/reservations', tenantId, { memberId });
        const res = await fetch(url, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setReservations(data.data || []);
        }
      } catch (err) {
        console.error('[reservas] fetchReservations error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReservations();
  }, [memberId, tenantId]);

  const upcomingReservations = reservations.filter(
    (r) => ['confirmada', 'pendente'].includes(r.status)
  );

  const pastReservations = reservations.filter(
    (r) => ['concluida', 'cancelada'].includes(r.status)
  );

  const filteredUpcoming = filter === 'all' ? upcomingReservations : upcomingReservations.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas Reservas</h1>
          <p className="text-muted-foreground">Visualize e gerencie suas reservas</p>
        </div>
        <Link href="/reservar">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Reserva
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Proximas ({upcomingReservations.length})</TabsTrigger>
          <TabsTrigger value="past">Anteriores ({pastReservations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {filteredUpcoming.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="Nenhuma reserva proxima"
              description="Voce ainda nao tem reservas agendadas"
              action={{
                label: 'Fazer uma reserva',
                onClick: () => window.location.href = '/reservar',
              }}
            />
          ) : (
            <div className="space-y-4">
              {filteredUpcoming.map((res) => (
                <Card key={res.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{res.spaceName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="capitalize">{getDayName(res.date)}, {formatDate(res.date)}</span>
                            <span>-</span>
                            <Clock className="h-4 w-4" />
                            <span>{res.startTime} - {res.endTime}</span>
                          </div>
                          {res.amount && res.amount > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={res.isPaid ? 'default' : 'outline'}>
                                {res.isPaid ? 'Pago' : 'Pendente'}
                              </Badge>
                              <span className="text-sm font-medium">R$ {res.amount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusConfig[res.status].color}>
                          {statusConfig[res.status].label}
                        </Badge>
                        {res.status === 'confirmada' && (
                          <Button variant="outline" size="sm" className="text-destructive">Cancelar</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastReservations.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="Nenhuma reserva anterior"
              description="Suas reservas passadas aparecerao aqui"
            />
          ) : (
            <div className="space-y-4">
              {pastReservations.map((res) => (
                <Card key={res.id} className={res.status === 'cancelada' ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`rounded-lg p-3 ${res.status === 'concluida' ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          <MapPin className={`h-6 w-6 ${res.status === 'concluida' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{res.spaceName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(res.date)}</span>
                            <span>-</span>
                            <Clock className="h-4 w-4" />
                            <span>{res.startTime} - {res.endTime}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={statusConfig[res.status].color}>
                        {statusConfig[res.status].label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
