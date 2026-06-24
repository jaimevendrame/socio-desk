'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Users, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';

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

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-50 text-yellow-700',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const statusLabels: Record<string, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  overdue: 'Atrasado',
  cancelled: 'Cancelado',
};

export default function FinancialPage() {
  const { tenantId } = useTenant();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(5, 7));

  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true);
        const url = buildApiUrl('/api/payments');
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

  // Calcular estatísticas
  const stats = {
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
  };

  // Filtrar pagamentos inadimplentes
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Controle de mensalidades e pagamentos</p>
        </div>
        <div className="flex gap-2">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="06">Junho 2026</SelectItem>
              <SelectItem value="05">Maio 2026</SelectItem>
              <SelectItem value="04">Abril 2026</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <CreditCard className="mr-2 h-4 w-4" />
            Registrar Pagamento
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">R$ {stats.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">{payments.filter(p => p.status === 'paid').length} pagamentos</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">R$ {stats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">{payments.filter(p => p.status === 'pending').length} pendentes</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inadimplência</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">R$ {stats.totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">{stats.defaultersCount} associados</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa Cobrança</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {payments.length > 0
                    ? ((payments.filter(p => p.status === 'paid').length / payments.length) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="h-2 bg-muted rounded-full mt-2">
                  <div
                    className="h-2 bg-primary rounded-full transition-all"
                    style={{ width: `${payments.length > 0 ? (payments.filter(p => p.status === 'paid').length / payments.length) * 100 : 0}%` }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  R$ {payments.reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">{payments.length} registros</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pagamentos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="inadimplentes">Inadimplentes</TabsTrigger>
          <TabsTrigger value="resumo">Resumo Mensal</TabsTrigger>
        </TabsList>

        {/* Pagamentos */}
        <TabsContent value="pagamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Últimos Pagamentos</CardTitle>
              <CardDescription>Pagamentos registrados recentemente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum pagamento registrado</p>
                  </div>
                ) : (
                  payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{payment.memberName || 'Membro'}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.description} • Venc: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">R$ {parseFloat(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <Badge className={statusColors[payment.status]}>
                          {statusLabels[payment.status]}
                        </Badge>
                        {payment.status !== 'paid' && (
                          <Button size="sm" variant="outline">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Baixar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inadimplentes */}
        <TabsContent value="inadimplentes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Associados Inadimplentes</CardTitle>
                <CardDescription>Associados com pagamentos atrasados</CardDescription>
              </div>
              <Button variant="outline">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Enviar Cobrança
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))
                ) : defaulters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BadgeCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum inadimplente</p>
                  </div>
                ) : (
                  defaulters.map((defaulter) => (
                    <div key={defaulter.memberId} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-red-100 p-3">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{defaulter.memberName}</p>
                          <p className="text-sm text-muted-foreground">
                            Pagamento atrasado
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-red-600">R$ {defaulter.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p className="text-xs text-muted-foreground">em aberto</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Negociar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resumo */}
        <TabsContent value="resumo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Geral</CardTitle>
              <CardDescription>Visão geral das finanças</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-sm text-green-700">Total Recebido</p>
                    <p className="text-2xl font-bold text-green-600">R$ {stats.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-700">Total Pendente</p>
                    <p className="text-2xl font-bold text-yellow-600">R$ {stats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4">
                    <p className="text-sm text-red-700">Total Inadimplente</p>
                    <p className="text-2xl font-bold text-red-600">R$ {stats.totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status dos Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500"></span>
                          Pagos
                        </span>
                        <span className="font-medium">{payments.filter(p => p.status === 'paid').length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                          Pendentes
                        </span>
                        <span className="font-medium">{payments.filter(p => p.status === 'pending').length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500"></span>
                          Atrasados
                        </span>
                        <span className="font-medium">{payments.filter(p => p.status === 'overdue').length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                          Cancelados
                        </span>
                        <span className="font-medium">{payments.filter(p => p.status === 'cancelled').length}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total de registros</span>
                    <span className="font-medium">{payments.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Associados inadimplentes</span>
                    <span className="font-medium text-red-600">{stats.defaultersCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper para BadgeCheck
function BadgeCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
