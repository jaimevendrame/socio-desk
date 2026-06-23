'use client';

import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Mock data
const upcomingReservations = [
  {
    id: '1',
    space: 'Quadra Poliesportiva A',
    date: '24/06/2026',
    time: '14:00 - 16:00',
    status: 'confirmada',
  },
  {
    id: '2',
    space: 'Sala de Jogos',
    date: '25/06/2026',
    time: '19:00 - 22:00',
    status: 'pendente',
  },
  {
    id: '3',
    space: 'Churrasqueira 1',
    date: '01/07/2026',
    time: '12:00 - 18:00',
    status: 'confirmada',
  },
];

const notifications = [
  { id: '1', message: 'Reserva confirmada para amanhã', time: '2 horas atrás', unread: true },
  { id: '2', message: 'Nova mensagem do escritório', time: '1 dia atrás', unread: true },
  { id: '3', message: 'Mensalidade confirmada', time: '3 dias atrás', unread: false },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Bem-vindo, João!</h1>
        <p className="text-muted-foreground">Aqui está o resumo da sua conta</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Reservadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12h</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dependentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-100 text-green-800">Adimplente</Badge>
            <p className="text-xs text-muted-foreground mt-1">Conta em dia</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Reservations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Próximas Reservas</CardTitle>
                <CardDescription>Seus próximos compromissos</CardDescription>
              </div>
              <Link
                href="/reservas"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent h-7"
              >
                Ver todas
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{reservation.space}</p>
                    <p className="text-sm text-muted-foreground">
                      {reservation.date} • {reservation.time}
                    </p>
                  </div>
                  <Badge
                    className={
                      reservation.status === 'confirmada'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {reservation.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Link
              href="/reservar"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Nova Reserva
            </Link>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>Últimas atualizações da sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    notification.unread ? 'bg-accent' : ''
                  }`}
                >
                  {notification.unread && (
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                  <div className="space-y-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Atalhos para funções mais utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/reservar"
              className="inline-flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent"
            >
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Fazer Reserva</span>
            </Link>
            <Link
              href="/perfil"
              className="inline-flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Gerenciar Dependentes</span>
            </Link>
            <Link
              href="/perfil/senha"
              className="inline-flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent"
            >
              <CheckCircle className="h-6 w-6" />
              <span className="text-sm">Alterar Senha</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
