'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Calendar, CreditCard, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';
import { DependentDialog, DeleteDependentDialog } from '@/components/office/members/dependent-dialog';

interface Member {
  id: string;
  name: string;
  cpf: string;
  email: string | null;
  phoneHome: string | null;
  phoneMobile: string | null;
  type: 'afiliado' | 'convidado' | 'dependente_maior';
  status: 'ativo' | 'inadimplente' | 'suspenso' | 'cancelado';
  birthDate: string | null;
  civilState: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipCode: string | null;
  workplaceId: string | null;
  registrationNumber: string | null;
  admissionDate: string | null;
  jobTitle: string | null;
}

interface Dependent {
  id: string;
  memberId: string;
  type: 'conjuge' | 'filho' | 'enteado' | 'pais' | 'irmao' | 'outro';
  name: string;
  birthDate: string;
  documentType?: 'rg' | 'cpf' | 'passaporte' | null;
  documentNumber?: string | null;
  status: 'ativo' | 'inativo' | 'migrado';
}

interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  spaceName?: string;
}

interface Payment {
  id: string;
  description: string;
  amount: string;
  dueDate: string;
  status: string;
}

const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800',
  inadimplente: 'bg-red-100 text-red-800',
  suspenso: 'bg-yellow-100 text-yellow-800',
  cancelado: 'bg-gray-100 text-gray-600',
  confirmada: 'bg-green-100 text-green-800',
  pendente: 'bg-yellow-100 text-yellow-800',
  cancelada: 'bg-gray-100 text-gray-600',
  concluida: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-50 text-yellow-700',
  overdue: 'bg-red-100 text-red-800',
};

const typeLabels: Record<string, string> = {
  afiliado: 'Afiliado',
  convidado: 'Convidado',
  dependente_maior: 'Dependente',
  conjuge: 'Cônjuge',
  filho: 'Filho(a)',
  enteado: 'Enteado(a)',
  pais: 'Pais',
  irmao: 'Irmão(ã)',
  outro: 'Outro',
};

export default function MemberDetailPage() {
  const params = useParams();
  const { tenantId } = useTenant();
  const [member, setMember] = useState<Member | null>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchDependents = useCallback(async () => {
    if (!params.id || !tenantId) return;
    try {
      const depsRes = await fetch(
        buildApiUrl('/api/dependents', tenantId, { memberId: params.id as string })
      );
      if (depsRes.ok) {
        const data = await depsRes.json();
        setDependents(data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dependentes:', err);
    }
  }, [params.id, tenantId]);

  useEffect(() => {
    async function fetchMemberData() {
      try {
        setLoading(true);
        const [memberRes, resRes, payRes] = await Promise.all([
          fetch(buildApiUrl(`/api/members/${params.id}`, tenantId)),
          fetch(buildApiUrl('/api/reservations', tenantId, { memberId: params.id as string })),
          fetch(buildApiUrl('/api/payments', tenantId, { memberId: params.id as string })),
        ]);

        if (memberRes.ok) {
          const data = await memberRes.json();
          setMember(data);
        }

        if (resRes.ok) {
          const data = await resRes.json();
          setReservations(data.data || []);
        }

        if (payRes.ok) {
          const data = await payRes.json();
          setPayments(data.data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      fetchMemberData();
      fetchDependents();
    }
  }, [params.id, tenantId, fetchDependents]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-16 w-16" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Associado nao encontrado</p>
        <Link href="/escritorio/associados" className="mt-4">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/escritorio/associados" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{member.name}</h1>
                <Badge className={statusColors[member.status]}>
                  {member.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {typeLabels[member.type]} {member.registrationNumber ? `- ${member.registrationNumber}` : ''}
              </p>
            </div>
          </div>
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
                    <Input value={member.cpf} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Nascimento</Label>
                    <Input value={formatDate(member.birthDate)} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Estado Civil</Label>
                  <Input value={member.civilState || '-'} disabled />
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
                  <Input value={member.email || '-'} disabled />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Celular</Label>
                    <Input value={member.phoneMobile || '-'} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Telefone</Label>
                    <Input value={member.phoneHome || '-'} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Endereco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Logradouro</Label>
                    <Input value={member.addressStreet || '-'} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Numero</Label>
                    <Input value={member.addressNumber || '-'} disabled />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3 mt-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Bairro</Label>
                    <Input value={member.addressDistrict || '-'} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Cidade</Label>
                    <Input value={member.addressCity || '-'} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Estado</Label>
                    <Input value={member.addressState || '-'} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Informacoes Profissionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Cargo</Label>
                    <Input value={member.jobTitle || '-'} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Data Admissao</Label>
                    <Input value={formatDate(member.admissionDate)} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Matricula</Label>
                    <Input value={member.registrationNumber || '-'} disabled />
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
              <DependentDialog
                memberId={params.id as string}
                onSave={fetchDependents}
              />
            </CardHeader>
            <CardContent>
              {dependents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum dependente cadastrado</p>
              ) : (
                <div className="space-y-4">
                  {dependents.map((dep) => (
                    <div key={dep.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>{dep.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{dep.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {typeLabels[dep.type] || dep.type} - {formatDate(dep.birthDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <DependentDialog
                          memberId={params.id as string}
                          dependent={dep}
                          onSave={fetchDependents}
                          trigger={
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          }
                        />
                        <DeleteDependentDialog
                          dependent={dep}
                          onDelete={fetchDependents}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historico de Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma reserva encontrada</p>
              ) : (
                <div className="space-y-4">
                  {reservations.map((res) => (
                    <div key={res.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{res.spaceName || 'Espaco'}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(res.date)} - {res.startTime.slice(0, 5)} as {res.endTime.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusColors[res.status]}>
                        {res.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mensalidades e Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum pagamento encontrado</p>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{payment.description}</p>
                        <p className="text-sm text-muted-foreground">Venc: {formatDate(payment.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">R$ {parseFloat(payment.amount).toFixed(2)}</span>
                        <Badge className={statusColors[payment.status]}>
                          {payment.status === 'paid' ? 'Pago' : payment.status === 'pending' ? 'Pendente' : 'Atrasado'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
