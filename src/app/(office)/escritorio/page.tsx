'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, Building, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';

export default function OfficeDashboardPage() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    reservationsToday: 0,
    activeMembers: 0,
    occupancyRate: 0,
    defaulters: 0,
    totalPendingAmount: 0,
  });
  const [todayReservations, setTodayReservations] = useState<any[]>([]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function fetchData() {
      if (!tenantId) return;

      try {
        setLoading(true);

        // Busca reservas de hoje
        const reservationsUrl = buildApiUrl('/api/reservations', {
          tenantId,
          startDate: today,
          endDate: today,
        });
        const reservationsRes = await fetch(reservationsUrl);
        const reservationsData = reservationsRes.ok ? await reservationsRes.json() : { data: [] };

        // Busca membros ativos
        const membersUrl = buildApiUrl('/api/members', { tenantId, status: 'ativo' });
        const membersRes = await fetch(membersUrl);
        const membersData = membersRes.ok ? await membersRes.json() : { data: [] };

        // Busca inadimplentes
        const defaultersUrl = buildApiUrl('/api/members', { tenantId, status: 'inadimplente' });
        const defaultersRes = await fetch(defaultersUrl);
        const defaultersData = defaultersRes.ok ? await defaultersRes.json() : { data: [] };

        // Calcula taxa de ocupação (mock - baseado em espaços)
        const spacesUrl = buildApiUrl('/api/spaces', { tenantId });
        const spacesRes = await fetch(spacesUrl);
        const spacesData = spacesRes.ok ? await spacesRes.json() : { data: [] };

        const totalSlots = (spacesData.data || []).length * 8; // 8 horas de funcionamento
        const occupiedSlots = (reservationsData.data || []).length;
        const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

        setStats({
          reservationsToday: (reservationsData.data || []).length,
          activeMembers: (membersData.data || []).length,
          occupancyRate,
          defaulters: (defaultersData.data || []).length,
          totalPendingAmount: 0, // TODO: buscar do financeiro
        });

        setTodayReservations(reservationsData.data || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tenantId, today]);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Painel do Escritório</h1>
        <p className="text-muted-foreground">Resumo das operações de hoje</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.reservationsToday}</div>
            )}
            <p className="text-xs text-muted-foreground">de {stats.occupancyRate}% ocupação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Associados Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.activeMembers}</div>
            )}
            <p className="text-xs text-muted-foreground">associados registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Ocupação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            )}
            <p className="text-xs text-muted-foreground">baseado em reservas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inadimplentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.defaulters}</div>
            )}
            <p className="text-xs text-muted-foreground">bloqueados</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Reservations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reservas de Hoje</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </CardDescription>
              </div>
              <Link
                href="/escritorio/reservas"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent h-7"
              >
                Ver calendário
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : todayReservations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma reserva para hoje</p>
                <Link
                  href="/escritorio/reservas"
                  className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                >
                  Criar nova reserva
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {todayReservations.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Building className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{r.spaceName || 'Espaço'}</p>
                        <p className="text-sm text-muted-foreground">
                          {r.memberName || 'Membro'} • {r.startTime?.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <Badge className={
                      r.status === 'confirmada'
                        ? 'bg-green-100 text-green-800'
                        : r.status === 'pendente'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }>
                      {r.status === 'confirmada' ? 'Confirmada' : r.status === 'pendente' ? 'Pendente' : r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Atalhos para funções do escritório</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/escritorio/reservas"
                className="inline-flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
              >
                <Calendar className="h-6 w-6" />
                <span>Nova Reserva</span>
              </Link>
              <Link
                href="/escritorio/associados/novo"
                className="inline-flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
              >
                <Users className="h-6 w-6" />
                <span>Novo Associado</span>
              </Link>
              <Link
                href="/escritorio/associados"
                className="inline-flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
              >
                <Users className="h-6 w-6" />
                <span>Buscar Associado</span>
              </Link>
              <Link
                href="/escritorio/financeiro"
                className="inline-flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
              >
                <CreditCard className="h-6 w-6" />
                <span>Baixa Pagamento</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Links Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/escritorio/reservas"
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Calendário de Reservas
            </Link>
            <Link
              href="/escritorio/espacos"
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20 transition-colors"
            >
              <Building className="h-4 w-4" />
              Gerenciar Espaços
            </Link>
            <Link
              href="/escritorio/associados"
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20 transition-colors"
            >
              <Users className="h-4 w-4" />
              Lista de Associados
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
