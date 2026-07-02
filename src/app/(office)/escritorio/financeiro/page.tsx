'use client';

import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, AlertTriangle, Loader2, BarChart3, CheckCircle, PieChart as PieChartIcon, TrendingDown as TrendDownIcon, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';
import { PaymentDialog } from '@/components/payments/PaymentDialog';
import { RegisterPaymentDialog } from '@/components/payments/RegisterPaymentDialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { motion } from 'framer-motion';
import { FadeIn, StaggerContainer, fadeVariants, MotionCard } from '@/components/animations/fade-in';

interface Payment {
  id: string;
  memberId: string;
  memberName?: string;
  description: string;
  amount: string;
  dueDate: string;
  paidDate: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod: string | null;
  createdAt: string;
}

interface PaymentsApiResponse {
  data: Payment[];
}

const paymentMethodLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_credito: 'Cartao de Credito',
  cartao_debito: 'Cartao de Debito',
  transferencia: 'Transferencia',
  boleto: 'Boleto',
};

export default function FinancialPage() {
  const { tenantId } = useTenant();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    totalReceived: 0,
    totalPending: 0,
    totalOverdue: 0,
    defaultersCount: 0,
    totalAmount: 0,
    paymentRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(5, 7));
  const handleMonthFilterChange = (value: string | null) => {
    if (value) setMonthFilter(value);
  };

  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true);
        const url = buildApiUrl('/api/payments', tenantId);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao carregar pagamentos');
        const data: PaymentsApiResponse = await response.json();
        setPayments(data.data || []);
      } catch (err) {
        console.error('Erro ao carregar pagamentos:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [tenantId]);

  useEffect(() => {
    const newStats = {
      totalReceived: payments
        .filter((p) => p.status === 'paid')
        .reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0),
      totalPending: payments
        .filter((p) => p.status === 'pending')
        .reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0),
      totalOverdue: payments
        .filter((p) => p.status === 'overdue')
        .reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0),
      defaultersCount: new Set(
        payments.filter((p) => p.status === 'overdue').map((p) => p.memberId)
      ).size,
      totalAmount: payments.reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0),
      paymentRate: payments.length > 0
        ? (payments.filter(p => p.status === 'paid').length / payments.length) * 100
        : 0,
    };
    setStats(newStats);
  }, [payments]);

  const pieChartData = useMemo(() => {
    const statusData = [
      { name: 'Pagos', value: payments.filter(p => p.status === 'paid').length, color: '#16a34a' },
      { name: 'Pendentes', value: payments.filter(p => p.status === 'pending').length, color: '#ca8a04' },
      { name: 'Atrasados', value: payments.filter(p => p.status === 'overdue').length, color: '#dc2626' },
      { name: 'Cancelados', value: payments.filter(p => p.status === 'cancelled').length, color: '#71717a' },
    ];
    return statusData.filter(item => item.value > 0);
  }, [payments]);

  const lineChartData = useMemo(() => {
    // Tendência de inadimplência nos últimos 6 meses
    const monthlyTrend: Record<string, { month: string; inadimplentes: number; total: number }> = {};

    payments.forEach((payment) => {
      const date = new Date(payment.dueDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' });

      if (!monthlyTrend[monthKey]) {
        monthlyTrend[monthKey] = {
          month: monthLabel,
          inadimplentes: 0,
          total: 0,
        };
      }

      monthlyTrend[monthKey].total += parseFloat(payment.amount || '0');
      if (payment.status === 'overdue') {
        monthlyTrend[monthKey].inadimplentes += parseFloat(payment.amount || '0');
      }
    });

    return Object.values(monthlyTrend)
      .reverse()
      .slice(-6)
      .map(item => ({
        month: item.month,
        inadimplentes: item.inadimplentes,
        total: item.total,
        porcentagem: item.total > 0 ? (item.inadimplentes / item.total) * 100 : 0,
      }));
  }, [payments]);

  const monthlyData = useMemo(() => {
    const data: Record<string, { month: string; recebidos: number; pendentes: number; inadimplentes: number }> = {};

    payments.forEach((payment) => {
      const date = new Date(payment.dueDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' });

      if (!data[monthKey]) {
        data[monthKey] = {
          month: monthLabel,
          recebidos: 0,
          pendentes: 0,
          inadimplentes: 0,
        };
      }

      const amount = parseFloat(payment.amount || '0');
      switch (payment.status) {
        case 'paid':
          data[monthKey].recebidos += amount;
          break;
        case 'pending':
          data[monthKey].pendentes += amount;
          break;
        case 'overdue':
          data[monthKey].inadimplentes += amount;
          break;
      }
    });

    return Object.values(data).reverse().slice(-6);
  }, [payments]);

  const defaulters = payments
    .filter((p) => p.status === 'overdue')
    .reduce((acc, p) => {
      const existing = acc.find((d) => d.memberId === p.memberId);
      if (existing) {
        existing.totalAmount += parseFloat(p.amount || '0');
      } else {
        acc.push({
          memberId: p.memberId,
          memberName: p.memberName || 'Membro',
          totalAmount: parseFloat(p.amount || '0'),
        });
      }
      return acc;
    }, [] as { memberId: string; memberName: string; totalAmount: number }[]);

  const handlePaymentSuccess = () => {
    window.location.reload();
  };

  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      const url = buildApiUrl('/api/reports/financial/export-pdf', tenantId);
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao exportar');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      const url = buildApiUrl('/api/reports/financial', tenantId, { format: 'csv' });
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao exportar');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const statsData = [
    { label: 'Recebido', value: stats.totalReceived, count: payments.filter(p => p.status === 'paid').length, icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', valueColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Pendente', value: stats.totalPending, count: payments.filter(p => p.status === 'pending').length, icon: DollarSign, color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400', valueColor: 'text-amber-600 dark:text-amber-400' },
    { label: 'Inadimplencia', value: stats.totalOverdue, count: stats.defaultersCount, icon: TrendingDown, color: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400', valueColor: 'text-red-600 dark:text-red-400' },
    { label: 'Taxa Cobranca', value: stats.paymentRate, isPercent: true, icon: CreditCard, color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400', valueColor: 'text-foreground' },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <StaggerContainer>
          <motion.div variants={fadeVariants} className="flex items-center justify-between">
            <div>
              <div className="label mb-1">Financeiro</div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Controle de Mensalidades
              </h1>
              <p className="text-muted-foreground mt-1">
                Acompanhe pagamentos e inadimplencia
              </p>
            </div>
            <div className="flex gap-3">
              <Select value={monthFilter} onValueChange={handleMonthFilterChange}>
                <SelectTrigger className="w-[160px] h-10 bg-background border-border rounded-lg">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06">Junho 2026</SelectItem>
                  <SelectItem value="05">Maio 2026</SelectItem>
                  <SelectItem value="04">Abril 2026</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportCSV} disabled={exportLoading || loading}>
                  {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span className="ml-2">CSV</span>
                </Button>
                <Button variant="outline" onClick={handleExportPDF} disabled={exportLoading || loading}>
                  {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span className="ml-2">PDF</span>
                </Button>
              </div>
              <RegisterPaymentDialog onSuccess={handlePaymentSuccess} />
            </div>
          </motion.div>
        </StaggerContainer>

        {/* Stats */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, i) => (
            <motion.div key={i} variants={fadeVariants}>
              <MotionCard className="bg-card border-border rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <div className={`text-2xl font-semibold tracking-tight mt-1 ${stat.valueColor}`}>
                      {loading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : stat.isPercent ? (
                        `${stat.value.toFixed(1)}%`
                      ) : (
                        `R$ ${stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.isPercent ? 'taxa de cobranca' : `${stat.count} ${stat.count === 1 ? 'registro' : 'registros'}`}
                    </p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                {stat.isPercent && !loading && (
                  <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(stat.value, 100)}%` }}
                    />
                  </div>
                )}
              </MotionCard>
            </motion.div>
          ))}
        </StaggerContainer>

        {/* Tabs */}
        <Tabs defaultValue="pagamentos" className="space-y-6">
          <TabsList className="bg-card border border-border rounded-lg p-1 h-auto gap-1">
            <TabsTrigger
              value="pagamentos"
              className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Pagamentos
            </TabsTrigger>
            <TabsTrigger
              value="inadimplentes"
              className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Inadimplentes
            </TabsTrigger>
            <TabsTrigger
              value="resumo"
              className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Resumo Mensal
            </TabsTrigger>
          </TabsList>

          {/* Pagamentos */}
          <TabsContent value="pagamentos" className="space-y-4">
            <Card className="bg-card border-border rounded-xl">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold tracking-tight">Ultimos Pagamentos</CardTitle>
                    <CardDescription className="text-muted-foreground">Pagamentos registrados recentemente</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Nenhum pagamento registrado</p>
                  </div>
                ) : (
                  <StaggerContainer className="space-y-3">
                    {payments.map((payment) => (
                      <motion.div
                        key={payment.id}
                        variants={fadeVariants}
                        className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-border-hover hover:bg-muted/30 transition-all"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{payment.memberName || 'Membro'}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {payment.description} &middot; Venc: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                          {payment.status === 'paid' && payment.paymentMethod && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Pago via {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              R$ {parseFloat(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <Badge
                              className={`mt-1 text-xs ${payment.status === 'paid' ? 'badge-success' : payment.status === 'pending' ? 'badge-warning' : payment.status === 'overdue' ? 'badge-error' : 'bg-muted text-muted-foreground'}`}
                            >
                              {payment.status === 'paid' ? 'Pago' : payment.status === 'pending' ? 'Pendente' : payment.status === 'overdue' ? 'Atrasado' : 'Cancelado'}
                            </Badge>
                          </div>
                          {payment.status !== 'paid' && payment.status !== 'cancelled' && (
                            <PaymentDialog
                              payment={{
                                id: payment.id,
                                memberName: payment.memberName || 'Membro',
                                description: payment.description,
                                amount: payment.amount,
                                dueDate: payment.dueDate,
                              }}
                              onSuccess={handlePaymentSuccess}
                            />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </StaggerContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inadimplentes */}
          <TabsContent value="inadimplentes" className="space-y-4">
            <Card className="bg-card border-border rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border">
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight">Associados Inadimplentes</CardTitle>
                  <CardDescription className="text-muted-foreground">Associados com pagamentos atrasados</CardDescription>
                </div>
                <Button variant="outline" className="h-9 border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Enviar Cobranca
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                  </div>
                ) : defaulters.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 mb-4">
                      <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-muted-foreground">Nenhum inadimplente</p>
                    <p className="text-sm text-muted-foreground mt-1">Todos os associados estao com as contas em dia</p>
                  </div>
                ) : (
                  <StaggerContainer className="space-y-3">
                    {defaulters.map((defaulter) => (
                      <motion.div
                        key={defaulter.memberId}
                        variants={fadeVariants}
                        className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-border-hover transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 dark:bg-red-500/20">
                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{defaulter.memberName}</p>
                            <p className="text-sm text-muted-foreground">Pagamento atrasado</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-red-600 dark:text-red-400">
                              R$ {defaulter.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground">em aberto</p>
                          </div>
                          <Button size="sm" variant="outline" className="border-border hover:bg-muted">
                            Negociar
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </StaggerContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resumo */}
          <TabsContent value="resumo" className="space-y-6">
            {/* Chart */}
            <Card className="bg-card border-border rounded-xl">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Tendencia de Pagamentos
                </CardTitle>
                <CardDescription className="text-muted-foreground">Receita mensal dos ultimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <Skeleton className="h-[300px] w-full rounded-xl" />
                ) : monthlyData.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                        />
                        <Tooltip
                          formatter={(value) => [
                            `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                          ]}
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid rgba(0,0,0,0.06)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 10px 15px rgba(0,0,0,0.05)',
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                        />
                        <Bar
                          dataKey="recebidos"
                          name="Recebidos"
                          fill="#16a34a"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                        <Bar
                          dataKey="pendentes"
                          name="Pendentes"
                          fill="#ca8a04"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                        <Bar
                          dataKey="inadimplentes"
                          name="Inadimplentes"
                          fill="#dc2626"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[200px] items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Sem dados suficientes para exibir o grafico</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10 dark:border-emerald-500/20 rounded-xl">
                <CardContent className="p-5">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Total Recebido</p>
                  <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    R$ {stats.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/10 dark:border-amber-500/20 rounded-xl">
                <CardContent className="p-5">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Total Pendente</p>
                  <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-1">
                    R$ {stats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-red-500/5 dark:bg-red-500/10 border-red-500/10 dark:border-red-500/20 rounded-xl">
                <CardContent className="p-5">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Total Inadimplente</p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">
                    R$ {stats.totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Status + Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-card border-border rounded-xl">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-primary" />
                    Distribuicao de Status
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Visao geral dos pagamentos</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {pieChartData.length > 0 ? (
                    <div className="flex items-center gap-6">
                      <div className="h-[180px] w-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name) => [`${value} pagamentos`, name]}
                              contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid rgba(0,0,0,0.06)',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-3">
                        {pieChartData.map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-foreground">
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                              {item.name}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-foreground">{item.value}</span>
                              <span className="text-xs text-muted-foreground">
                                ({((item.value / payments.length) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-[180px] items-center justify-center">
                      <p className="text-muted-foreground">Sem dados para exibir</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border rounded-xl">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                    <TrendDownIcon className="h-5 w-5 text-red-500" />
                    Tendencia de Inadimplencia
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Evolucao mensal da inadimplencia</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {lineChartData.length > 1 ? (
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip
                            formatter={(value, name) => {
                              if (name === 'porcentagem') return [`${Number(value).toFixed(1)}%`, 'Taxa Inadimplência'];
                              return [`R$ ${Number(value).toLocaleString('pt-BR')}`, name === 'inadimplentes' ? 'Valor Inadimplente' : 'Total'];
                            }}
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid rgba(0,0,0,0.06)',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="porcentagem"
                            name="Taxa"
                            stroke="#dc2626"
                            strokeWidth={2}
                            dot={{ fill: '#dc2626', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-[180px] items-center justify-center">
                      <p className="text-muted-foreground">Dados insuficientes para tendencia</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
