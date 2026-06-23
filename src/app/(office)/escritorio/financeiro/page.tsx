'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Users, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const monthlyData = [
  { month: 'Jan', revenue: 38500, expected: 40000 },
  { month: 'Fev', revenue: 37200, expected: 40000 },
  { month: 'Mar', revenue: 39800, expected: 40000 },
  { month: 'Abr', revenue: 41000, expected: 40000 },
  { month: 'Mai', revenue: 39500, expected: 40000 },
  { month: 'Jun', revenue: 38500, expected: 40000 },
];

const mockPayments = [
  { id: '1', member: 'Maria Oliveira', description: 'Mensalidade Junho 2026', amount: 'R$ 80,00', dueDate: '10/06/2026', status: 'paid' },
  { id: '2', member: 'Carlos Santos', description: 'Mensalidade Junho 2026', amount: 'R$ 80,00', dueDate: '10/06/2026', status: 'pending' },
  { id: '3', member: 'Ana Costa', description: 'Mensalidade Junho 2026', amount: 'R$ 80,00', dueDate: '10/06/2026', status: 'overdue' },
  { id: '4', member: 'Pedro Mendes', description: 'Reserva Quadra A', amount: 'R$ 50,00', dueDate: '23/06/2026', status: 'paid' },
  { id: '5', member: 'Juliana Ferreira', description: 'Reserva Churrasqueira', amount: 'R$ 80,00', dueDate: '25/06/2026', status: 'pending' },
  { id: '6', member: 'Roberto Silva', description: 'Mensalidade Maio 2026', amount: 'R$ 80,00', dueDate: '10/05/2026', status: 'overdue' },
];

const mockDefaulters = [
  { id: '1', name: 'Ana Costa', amount: 'R$ 240,00', since: 'Março 2026', months: 3 },
  { id: '2', name: 'Roberto Silva', amount: 'R$ 160,00', since: 'Abril 2026', months: 2 },
  { id: '3', name: 'Fernanda Lima', amount: 'R$ 80,00', since: 'Maio 2026', months: 1 },
];

const statusColors = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-50 text-yellow-700',
  overdue: 'bg-red-100 text-red-800',
};

export default function FinancialPage() {
  const [monthFilter, setMonthFilter] = useState<string | null>('06');

  const stats = {
    totalReceived: 38500,
    totalExpected: 40000,
    totalPending: 1500,
    totalOverdue: 320,
    collectionRate: 96.25,
    defaultersCount: 3,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Controle de mensalidades e pagamentos</p>
        </div>
        <div className="flex gap-2">
          <Select value={monthFilter} onValueChange={(v) => setMonthFilter(v ?? '06')}>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Arrecadação</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalReceived.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">de R$ {stats.totalExpected.toLocaleString('pt-BR')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">R$ {stats.totalPending.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inadimplência</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {stats.totalOverdue.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">{stats.defaultersCount} associados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa Cobrança</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.collectionRate}%</div>
            <div className="h-2 bg-muted rounded-full mt-2">
              <div
                className="h-2 bg-primary rounded-full transition-all"
                style={{ width: `${stats.collectionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Associados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">487</div>
            <p className="text-xs text-muted-foreground">de 500 capacidade</p>
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
                {mockPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{payment.member}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.description} • Venc: {payment.dueDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{payment.amount}</span>
                      <Badge className={statusColors[payment.status as keyof typeof statusColors]}>
                        {payment.status === 'paid' ? 'Pago' : payment.status === 'pending' ? 'Pendente' : 'Atrasado'}
                      </Badge>
                      {payment.status !== 'paid' && (
                        <Button size="sm" variant="outline">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Baixar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
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
                {mockDefaulters.map((defaulter) => (
                  <div key={defaulter.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-red-100 p-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">{defaulter.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Inadimplente desde {defaulter.since} • {defaulter.months} mês(es)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-red-600">{defaulter.amount}</p>
                        <p className="text-xs text-muted-foreground">em aberto</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Negociar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resumo */}
        <TabsContent value="resumo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Arrecadação Mensal</CardTitle>
              <CardDescription>Comparativo entre valor esperado e arrecadado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((data) => (
                  <div key={data.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{data.month} 2026</span>
                      <div className="flex items-center gap-4">
                        <span className="text-green-600">R$ {data.revenue.toLocaleString('pt-BR')}</span>
                        <span className="text-muted-foreground">/ R$ {data.expected.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          data.revenue >= data.expected ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${(data.revenue / data.expected) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formas de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PIX</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dinheiro</span>
                    <span className="font-medium">30%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Transferência</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Boleto</span>
                    <span className="font-medium">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Projeção Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Valor esperado (500 associados)</span>
                    <span className="font-medium">R$ 40.000,00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Associados esperados</span>
                    <span className="font-medium">500</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Associados atuais</span>
                    <span className="font-medium text-yellow-600">487</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ticket médio</span>
                    <span className="font-medium">R$ 80,00</span>
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
