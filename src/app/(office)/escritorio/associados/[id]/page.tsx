'use client';

import { useState } from 'react';
import { ArrowLeft, Save, Calendar, CreditCard, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mockMember = {
  id: '1',
  name: 'Maria Oliveira',
  cpf: '123.456.789-00',
  rg: '12.345.678-9',
  birthDate: '15/03/1985',
  email: 'maria.oliveira@email.com',
  phoneMobile: '(11) 98765-4321',
  phoneHome: '(11) 3456-7890',
  phoneWork: '(11) 98765-0001',
  civilState: 'casada',
  type: 'afiliado',
  status: 'ativo',
  workplace: 'Secretaria de Educacao',
  jobTitle: 'Professora',
  admissionDate: '15/01/2020',
  registrationNumber: '001234',
  address: {
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 45',
    district: 'Jardim Primavera',
    city: 'Sao Paulo',
    state: 'SP',
    zipCode: '01234-567',
  },
  photoUrl: null as string | null,
};

const mockDependents = [
  { id: '1', name: 'Roberto Oliveira', type: 'conjuge', birthDate: '20/08/1983' },
  { id: '2', name: 'Lucas Oliveira', type: 'filho', birthDate: '10/12/2010' },
  { id: '3', name: 'Sofia Oliveira', type: 'filho', birthDate: '25/05/2015' },
];

const mockReservations = [
  { id: '1', space: 'Quadra Poliesportiva A', date: '24/06/2026', time: '14:00 - 16:00', status: 'confirmada' },
  { id: '2', space: 'Sala de Jogos', date: '25/06/2026', time: '19:00 - 22:00', status: 'pendente' },
  { id: '3', space: 'Churrasqueira 1', date: '15/06/2026', time: '12:00 - 18:00', status: 'concluida' },
];

const mockPayments = [
  { id: '1', description: 'Mensalidade Junho 2026', amount: 'R$ 80,00', dueDate: '10/06/2026', status: 'paid' },
  { id: '2', description: 'Mensalidade Maio 2026', amount: 'R$ 80,00', dueDate: '10/05/2026', status: 'paid' },
  { id: '3', description: 'Reserva Quadra A', amount: 'R$ 50,00', dueDate: '24/06/2026', status: 'pending' },
];

const statusColors = {
  ativo: 'bg-green-100 text-green-800',
  inadimplente: 'bg-red-100 text-red-800',
  suspenso: 'bg-yellow-100 text-yellow-800',
  cancelado: 'bg-gray-100 text-gray-600',
  confirmanda: 'bg-blue-100 text-blue-800',
  pendente: 'bg-yellow-50 text-yellow-700',
  concluida: 'bg-green-50 text-green-700',
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-50 text-yellow-700',
  overdue: 'bg-red-100 text-red-800',
};

export default function MemberDetailPage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/escritorio/associados"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {mockMember.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{mockMember.name}</h1>
                <Badge className={statusColors[mockMember.status as keyof typeof statusColors]}>
                  {mockMember.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {mockMember.type === 'afiliado' ? 'Afiliado' : 'Convidado'} - {mockMember.registrationNumber}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancelar' : 'Editar'}
          </Button>
          {isEditing && (
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="dependentes">Dependentes</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documentos</CardTitle>
                <CardDescription>Informacoes de identificacao</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">CPF</Label>
                    <Input value={mockMember.cpf} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">RG</Label>
                    <Input value={mockMember.rg} disabled={!isEditing} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Data de Nascimento</Label>
                    <Input value={mockMember.birthDate} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Estado Civil</Label>
                    <Input value={mockMember.civilState} disabled={!isEditing} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contato</CardTitle>
                <CardDescription>Canais de comunicacao</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">E-mail</Label>
                  <Input type="email" value={mockMember.email} disabled={!isEditing} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Celular</Label>
                    <Input value={mockMember.phoneMobile} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Telefone Residencial</Label>
                    <Input value={mockMember.phoneHome} disabled={!isEditing} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Endereco</CardTitle>
                <CardDescription>Endereco residencial</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-muted-foreground">Logradouro</Label>
                    <Input value={mockMember.address.street} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Numero</Label>
                    <Input value={mockMember.address.number} disabled={!isEditing} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Complemento</Label>
                    <Input value={mockMember.address.complement} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Bairro</Label>
                    <Input value={mockMember.address.district} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">CEP</Label>
                    <Input value={mockMember.address.zipCode} disabled={!isEditing} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Cidade</Label>
                    <Input value={mockMember.address.city} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Estado</Label>
                    <Input value={mockMember.address.state} disabled={!isEditing} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Informacoes Profissionais</CardTitle>
                <CardDescription>Dados de vinculo com a associacao</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Local de Trabalho</Label>
                    <Input value={mockMember.workplace} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Cargo</Label>
                    <Input value={mockMember.jobTitle} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Data de Admissao</Label>
                    <Input value={mockMember.admissionDate} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dependentes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Dependentes</CardTitle>
                <CardDescription>Familiares cadastrados</CardDescription>
              </div>
              <Button size="sm">
                <Users className="mr-2 h-4 w-4" />
                Adicionar Dependente
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDependents.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>{dep.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{dep.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dep.type === 'conjuge' ? 'Conjuge' : dep.type === 'filho' ? 'Filho(a)' : dep.type} - {dep.birthDate}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Historico de Reservas</CardTitle>
                <CardDescription>Reservas feitas por este membro</CardDescription>
              </div>
              <Link href={`/escritorio/reservas/nova?memberId=${mockMember.id}`}>
                <Button size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Nova Reserva
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReservations.map((res) => (
                  <div key={res.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{res.space}</p>
                        <p className="text-sm text-muted-foreground">{res.date} - {res.time}</p>
                      </div>
                    </div>
                    <Badge className={statusColors[res.status as keyof typeof statusColors]}>
                      {res.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Mensalidades e Pagamentos</CardTitle>
                <CardDescription>Historico financeiro</CardDescription>
              </div>
              <Button>
                <CreditCard className="mr-2 h-4 w-4" />
                Registrar Pagamento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">Vencimento: {payment.dueDate}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{payment.amount}</span>
                      <Badge className={statusColors[payment.status as keyof typeof statusColors]}>
                        {payment.status === 'paid' ? 'Pago' : payment.status === 'pending' ? 'Pendente' : 'Atrasado'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
