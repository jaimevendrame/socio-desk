'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Calendar, Clock, DollarSign, Users, Image } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { buildApiUrl } from '@/lib/context/tenant-context';

interface Space {
  id: string;
  name: string;
  description: string | null;
  category: 'esportivo' | 'social' | 'equipamento';
  photoUrl: string | null;
  openTime: string;
  closeTime: string;
  bufferMinutes: number;
  minReservationMinutes: number;
  maxReservationMinutes: number;
  maxAdvanceDays: number;
  maxReservationsPerDay: number | null;
  hasCost: boolean;
  costAmount: string | null;
  isActive: boolean;
}

interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  memberName?: string;
}

const statusColors: Record<string, string> = {
  confirmada: 'bg-green-100 text-green-800',
  pendente: 'bg-yellow-100 text-yellow-800',
  cancelada: 'bg-gray-100 text-gray-600',
  concluida: 'bg-blue-100 text-blue-800',
};

const categoryLabels: Record<string, string> = {
  esportivo: 'Esportivo',
  social: 'Social',
  equipamento: 'Equipamento',
};

export default function SpaceDetailPage() {
  const params = useParams();
  const [space, setSpace] = useState<Space | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function fetchSpaceData() {
      try {
        setLoading(true);
        const [spaceRes, resRes] = await Promise.all([
          fetch(buildApiUrl(`/api/spaces/${params.id}`)),
          fetch(buildApiUrl('/api/reservations', { spaceId: params.id as string })),
        ]);

        if (spaceRes.ok) {
          const data = await spaceRes.json();
          setSpace(data);
        }

        if (resRes.ok) {
          const data = await resRes.json();
          setReservations(data.data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      fetchSpaceData();
    }
  }, [params.id]);

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    return timeStr.slice(0, 5);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Espaco nao encontrado</p>
        <Link href="/escritorio/espacos" className="mt-4">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/escritorio/espacos" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-lg">
              <AvatarImage src={space.photoUrl ?? undefined} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {space.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{space.name}</h1>
                <Badge variant={space.isActive ? 'default' : 'destructive'}>
                  {space.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <p className="text-muted-foreground">{categoryLabels[space.category]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="configuracoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuracoes">Configuracoes</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="horarios">Horarios</TabsTrigger>
        </TabsList>

        {/* Configuracoes */}
        <TabsContent value="configuracoes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informacoes Gerais</CardTitle>
                <CardDescription>Dados basicos do espaco</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Espaco</Label>
                  <Input value={space.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Descricao</Label>
                  <Input value={space.description || '-'} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input value={categoryLabels[space.category]} disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Custos</CardTitle>
                <CardDescription>Configuracao de valores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Possui custo de reserva</Label>
                    <p className="text-sm text-muted-foreground">
                      {space.hasCost ? 'Cobra taxa ao reservar' : 'Reserva gratuita'}
                    </p>
                  </div>
                  <Switch checked={space.hasCost} disabled />
                </div>
                {space.hasCost && space.costAmount && (
                  <div className="space-y-2">
                    <Label>Valor da Reserva</Label>
                    <Input value={`R$ ${parseFloat(space.costAmount).toFixed(2)}`} disabled />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Regras de Reserva</CardTitle>
                <CardDescription>Configuracoes de tempo e frequencia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tempo minimo (min)</Label>
                    <Input type="number" value={space.minReservationMinutes} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Tempo maximo (min)</Label>
                    <Input type="number" value={space.maxReservationMinutes} disabled />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tempo buffer (min)</Label>
                    <Input type="number" value={space.bufferMinutes} disabled />
                    <p className="text-xs text-muted-foreground">Intervalo entre reservas</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Max. reservas/dia</Label>
                    <Input type="number" value={space.maxReservationsPerDay || 'Sem limite'} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Antecedencia maxima (dias)</Label>
                  <Input type="number" value={space.maxAdvanceDays} disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
                <CardDescription>Ativar ou desativar o espaco</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Espaco Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      {space.isActive
                        ? 'Espaco disponivel para reservas'
                        : 'Espaco desativado, nao permite reservas'}
                    </p>
                  </div>
                  <Switch checked={space.isActive} disabled />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reservas */}
        <TabsContent value="reservas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Reservas</CardTitle>
                <CardDescription>Reservas deste espaco</CardDescription>
              </div>
              <Link href={`/escritorio/reservas/nova?spaceId=${space.id}`}>
                <Button>
                  <Calendar className="mr-2 h-4 w-4" />
                  Nova Reserva
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma reserva encontrada</p>
              ) : (
                <div className="space-y-4">
                  {reservations.map((res) => (
                    <div key={res.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {res.memberName?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{res.memberName || 'Membro'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(res.date).toLocaleDateString('pt-BR')} - {formatTime(res.startTime)} as {formatTime(res.endTime)}
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

        {/* Horarios */}
        <TabsContent value="horarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Horario de Funcionamento</CardTitle>
              <CardDescription>Horarios de abertura e encerramento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Abertura</Label>
                  <Input type="time" value={formatTime(space.openTime)} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Encerramento</Label>
                  <Input type="time" value={formatTime(space.closeTime)} disabled />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Tempo buffer</Label>
                <p className="text-sm text-muted-foreground">
                  Intervalo de {space.bufferMinutes} minutos entre reservas para limpeza/Preparacao
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
