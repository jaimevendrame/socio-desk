'use client';

import { Calendar, Users, Building, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Mock data
const todayStats = {
  reservationsToday: 23,
  activeMembers: 487,
  occupancyRate: 78,
  defaulters: 12,
};

const recentReservations = [
  { id: '1', space: 'Quadra A', member: 'João Silva', time: '08:00', status: 'confirmada' },
  { id: '2', space: 'Salão', member: 'Maria Costa', time: '10:00', status: 'confirmada' },
  { id: '3', space: 'Quadra B', member: 'Carlos Santos', time: '14:00', status: 'pendente' },
  { id: '4', space: 'Churrasqueira', member: 'Ana Oliveira', time: '12:00', status: 'confirmada' },
];

export default function OfficeDashboardPage() {
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
            <div className="text-2xl font-bold">{todayStats.reservationsToday}</div>
            <p className="text-xs text-muted-foreground">+5 vs. ontem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Associados Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.activeMembers}</div>
            <p className="text-xs text-muted-foreground">de 500</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Ocupação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.occupancyRate}%</div>
            <p className="text-xs text-green-600">+5% vs. semana passada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inadimplentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.defaulters}</div>
            <p className="text-xs text-muted-foreground">R$ 2.450 pendente</p>
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
                <CardDescription>23/06/2026</CardDescription>
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
            <div className="space-y-3">
              {recentReservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Building className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{r.space}</p>
                      <p className="text-sm text-muted-foreground">{r.member} • {r.time}</p>
                    </div>
                  </div>
                  <Badge className={r.status === 'confirmada' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
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
                href="/escritorio/reservas/nova"
                className="inline-flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent"
              >
                <Calendar className="h-6 w-6" />
                <span>Nova Reserva</span>
              </Link>
              <Link
                href="/escritorio/associados/novo"
                className="inline-flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent"
              >
                <Users className="h-6 w-6" />
                <span>Novo Associado</span>
              </Link>
              <Link
                href="/escritorio/associados"
                className="inline-flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent"
              >
                <Users className="h-6 w-6" />
                <span>Buscar Associado</span>
              </Link>
              <Link
                href="/escritorio/financeiro"
                className="inline-flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent"
              >
                <CreditCard className="h-6 w-6" />
                <span>Baixa Pagamento</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Ações</CardTitle>
          <CardDescription>Atividades recentes no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Nova reserva: Quadra A — Maria Costa — 25/06 14:00</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Baixa: Mensalidade — Pedro Santos</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span>Cadastro: Novo associado — Fulano de Tal</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span>Reserva cancelada: Churrasqueira — João Silva</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
