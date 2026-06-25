'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, Building, CreditCard, TrendingUp, AlertTriangle, ChevronRight, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';
import { StaggerContainer, fadeVariants, MotionCard } from '@/components/animations/fade-in';

export default function OfficeDashboardPage() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    reservationsToday: 0,
    activeMembers: 0,
    occupancyRate: 0,
    defaulters: 0,
  });
  const [todayReservations, setTodayReservations] = useState<any[]>([]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function fetchData() {
      if (!tenantId) return;

      try {
        setLoading(true);

        const reservationsUrl = buildApiUrl('/api/reservations', {
          tenantId,
          startDate: today,
          endDate: today,
        });
        const reservationsRes = await fetch(reservationsUrl);
        const reservationsData = reservationsRes.ok ? await reservationsRes.json() : { data: [] };

        const membersUrl = buildApiUrl('/api/members', { tenantId, status: 'ativo' });
        const membersRes = await fetch(membersUrl);
        const membersData = membersRes.ok ? await membersRes.json() : { data: [] };

        const defaultersUrl = buildApiUrl('/api/members', { tenantId, status: 'inadimplente' });
        const defaultersRes = await fetch(defaultersUrl);
        const defaultersData = defaultersRes.ok ? await defaultersRes.json() : { data: [] };

        const spacesUrl = buildApiUrl('/api/spaces', { tenantId });
        const spacesRes = await fetch(spacesUrl);
        const spacesData = spacesRes.ok ? await spacesRes.json() : { data: [] };

        const totalSlots = (spacesData.data || []).length * 8;
        const occupiedSlots = (reservationsData.data || []).length;
        const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

        setStats({
          reservationsToday: (reservationsData.data || []).length,
          activeMembers: (membersData.data || []).length,
          occupancyRate,
          defaulters: (defaultersData.data || []).length,
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

  const statsData = [
    { label: 'Reservas Hoje', value: stats.reservationsToday, sub: `${stats.occupancyRate}% ocupacao`, icon: Calendar, color: 'dark:bg-emerald-500/10 dark:text-emerald-400 bg-emerald-500/10 text-emerald-600' },
    { label: 'Associados Ativos', value: stats.activeMembers, sub: 'registrados', icon: Users, color: 'dark:bg-blue-500/10 dark:text-blue-400 bg-blue-500/10 text-blue-600' },
    { label: 'Taxa Ocupacao', value: `${stats.occupancyRate}%`, sub: 'baseado em reservas', icon: TrendingUp, color: 'dark:bg-amber-500/10 dark:text-amber-400 bg-amber-500/10 text-amber-600' },
    { label: 'Inadimplentes', value: stats.defaulters, sub: 'bloqueados', icon: AlertTriangle, color: 'dark:bg-red-500/10 dark:text-red-400 bg-red-500/10 text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <StaggerContainer>
          <motion.div variants={fadeVariants}>
            <div className="label mb-1 text-muted-foreground">Painel do Escritorio</div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Resumo Operacional
            </h1>
            <p className="text-muted-foreground mt-1">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </motion.div>
        </StaggerContainer>

        {/* Stats Grid */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, i) => (
            <motion.div key={i} variants={fadeVariants}>
              <MotionCard className="bg-card border-border rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-foreground">
                      {loading ? <Skeleton className="h-8 w-16" /> : stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">{stat.sub}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </MotionCard>
            </motion.div>
          ))}
        </StaggerContainer>

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Reservations */}
          <Card className="lg:col-span-3 bg-card border-border rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
              <div>
                <CardTitle className="text-lg font-semibold tracking-tight text-foreground">Reservas de Hoje</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </CardDescription>
              </div>
              <Link
                href="/escritorio/reservas"
                className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors"
              >
                Ver calendario
                <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : todayReservations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">Nenhuma reserva para hoje</p>
                  <Link
                    href="/escritorio/reservas"
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors"
                  >
                    Criar nova reserva
                  </Link>
                </div>
              ) : (
                <StaggerContainer className="space-y-3 max-h-[300px] overflow-y-auto">
                  {todayReservations.map((r) => (
                    <motion.div
                      key={r.id}
                      variants={fadeVariants}
                      className="flex items-center justify-between p-4 rounded-xl border-border hover:border-border-hover hover:bg-muted/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl dark:bg-emerald-500/10 dark:text-emerald-400 bg-emerald-500/10 text-emerald-600">
                          <Building className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{r.spaceName || 'Espaco'}</p>
                          <p className="text-sm text-muted-foreground">
                            {r.memberName || 'Membro'} &middot; {r.startTime?.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          r.status === 'confirmada'
                            ? 'badge-success'
                            : r.status === 'pendente'
                            ? 'badge-warning'
                            : 'dark:bg-muted dark:text-muted-foreground bg-muted text-muted-foreground'
                        }
                      >
                        {r.status === 'confirmada' ? 'Confirmada' : r.status === 'pendente' ? 'Pendente' : r.status}
                      </Badge>
                    </motion.div>
                  ))}
                </StaggerContainer>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-2 bg-card border-border rounded-xl">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-lg font-semibold tracking-tight text-foreground">Acoes Rapidas</CardTitle>
              <CardDescription className="text-muted-foreground">Atalhos para funcoes do escritorio</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {[
                { href: '/escritorio/reservas', icon: Calendar, label: 'Nova Reserva', color: 'dark:bg-emerald-500/10 dark:text-emerald-400 bg-emerald-500/10 text-emerald-600' },
                { href: '/escritorio/associados/novo', icon: Users, label: 'Novo Associado', color: 'dark:bg-blue-500/10 dark:text-blue-400 bg-blue-500/10 text-blue-600' },
                { href: '/escritorio/associados', icon: Search, label: 'Buscar Associado', color: 'dark:bg-violet-500/10 dark:text-violet-400 bg-violet-500/10 text-violet-600' },
                { href: '/escritorio/financeiro', icon: CreditCard, label: 'Baixa Pagamento', color: 'dark:bg-amber-500/10 dark:text-amber-400 bg-amber-500/10 text-amber-600' },
              ].map((action, i) => (
                <motion.div key={i} variants={fadeVariants}>
                  <Link
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-xl border-border hover:border-border-hover hover:bg-muted/50 transition-all"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="flex-1 font-medium text-foreground">{action.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="bg-card border-border rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {[
                { href: '/escritorio/reservas', icon: Calendar, label: 'Calendario', color: 'dark:bg-emerald-500/10 dark:text-emerald-400 bg-emerald-500/10 text-emerald-600' },
                { href: '/escritorio/espacos', icon: Building, label: 'Espacos', color: 'dark:bg-blue-500/10 dark:text-blue-400 bg-blue-500/10 text-blue-600' },
                { href: '/escritorio/associados', icon: Users, label: 'Associados', color: 'dark:bg-violet-500/10 dark:text-violet-400 bg-violet-500/10 text-violet-600' },
                { href: '/escritorio/financeiro', icon: CreditCard, label: 'Financeiro', color: 'dark:bg-amber-500/10 dark:text-amber-400 bg-amber-500/10 text-amber-600' },
              ].map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-[1.02] ${link.color} hover:opacity-90`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
