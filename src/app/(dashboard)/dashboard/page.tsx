'use client';

import { Calendar, Clock, Users, CheckCircle, ChevronRight } from 'lucide-react';
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
  { id: '1', message: 'Reserva confirmada para amanha', time: '2 horas atras', unread: true },
  { id: '2', message: 'Nova mensagem do escritorio', time: '1 dia atras', unread: true },
  { id: '3', message: 'Mensalidade confirmada', time: '3 dias atras', unread: false },
];

const stats = [
  { label: 'Proximas reservas', value: '3', icon: Calendar, color: 'dark:bg-emerald-500/10 dark:text-emerald-400 bg-emerald-500/10 text-emerald-600' },
  { label: 'Horas este mes', value: '12h', icon: Clock, color: 'dark:bg-amber-500/10 dark:text-amber-400 bg-amber-500/10 text-amber-600' },
  { label: 'Dependentes', value: '3', icon: Users, color: 'dark:bg-blue-500/10 dark:text-blue-400 bg-blue-500/10 text-blue-600' },
  { label: 'Status', value: 'Ok', icon: CheckCircle, color: 'dark:bg-emerald-500/10 dark:text-emerald-400 bg-emerald-500/10 text-emerald-600' },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="label mb-1 text-muted-foreground">Dashboard</div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Bem-vindo, Joao
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe suas reservas e atividades recentes
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i}>
              <Card className="bg-card border-border rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Reservations */}
          <Card className="lg:col-span-3 bg-card border-border rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-border">
              <div>
                <CardTitle className="text-lg font-semibold tracking-tight text-foreground">Proximas Reservas</CardTitle>
                <CardDescription className="text-muted-foreground">Seus compromissos agendados</CardDescription>
              </div>
              <Link
                href="/reservas"
                className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors"
              >
                Ver todas
                <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {upcomingReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-4 rounded-xl border-border hover:border-border-hover hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        reservation.status === 'confirmada'
                          ? 'dark:bg-emerald-500/10 dark:text-emerald-400 bg-emerald-500/10 text-emerald-600'
                          : 'dark:bg-amber-500/10 dark:text-amber-400 bg-amber-500/10 text-amber-600'
                      }`}>
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{reservation.space}</p>
                        <p className="text-sm text-muted-foreground">
                          {reservation.date} &middot; {reservation.time}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        reservation.status === 'confirmada'
                          ? 'badge-success'
                          : 'badge-warning'
                      }
                    >
                      {reservation.status === 'confirmada' ? 'Confirmada' : 'Pendente'}
                    </Badge>
                  </div>
                ))}
              </div>

              <Link
                href="/reservar"
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-medium transition-all hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
              >
                <Calendar className="h-5 w-5" />
                Nova Reserva
              </Link>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notifications */}
            <Card className="bg-card border-border rounded-xl">
              <CardHeader className="pb-4 border-border">
                <CardTitle className="text-lg font-semibold tracking-tight text-foreground">Notificacoes</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      notification.unread ? 'dark:bg-emerald-500/5 bg-emerald-500/5' : ''
                    }`}
                  >
                    {notification.unread && (
                      <div className="mt-1.5 h-2 w-2 rounded-full dark:bg-emerald-400 bg-emerald-600" />
                    )}
                    {!notification.unread && <div className="mt-1.5 h-2 w-2" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notification.unread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notification.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card border-border rounded-xl">
              <CardHeader className="pb-4 border-border">
                <CardTitle className="text-lg font-semibold tracking-tight text-foreground">Acoes Rapidas</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {[
                  { href: '/reservar', icon: Calendar, label: 'Fazer Reserva', color: 'dark:bg-emerald-500/10 dark:text-emerald-400 bg-emerald-500/10 text-emerald-600' },
                  { href: '/perfil', icon: Users, label: 'Gerenciar Dependentes', color: 'dark:bg-blue-500/10 dark:text-blue-400 bg-blue-500/10 text-blue-600' },
                  { href: '/perfil/senha', icon: CheckCircle, label: 'Alterar Senha', color: 'dark:bg-amber-500/10 dark:text-amber-400 bg-amber-500/10 text-amber-600' },
                ].map((action, i) => (
                  <div key={i}>
                    <Link
                      href={action.href}
                      className="flex items-center gap-3 p-3 rounded-xl border-border hover:border-border-hover hover:bg-muted/50 transition-all"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-foreground">{action.label}</span>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
