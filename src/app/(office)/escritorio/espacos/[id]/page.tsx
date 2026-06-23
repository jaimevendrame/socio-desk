'use client';

import { useState } from 'react';
import { ArrowLeft, Save, Calendar, Clock, DollarSign, Users, Image } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mockSpace = {
  id: '1',
  name: 'Quadra Poliesportiva A',
  description: 'Quadra coberta para futsal, vôlei e basquete. Piso de madeira, iluminação LED e arquibancada para 100 pessoas.',
  category: 'esportivo',
  photoUrl: null,
  openTime: '06:00',
  closeTime: '22:00',
  bufferMinutes: 15,
  minReservationMinutes: 60,
  maxReservationMinutes: 240,
  maxAdvanceDays: 30,
  maxReservationsPerDay: 4,
  hasCost: true,
  costAmount: '50.00',
  isActive: true,
};

const recentReservations = [
  { id: '1', member: 'Maria Oliveira', date: '23/06/2026', time: '14:00 - 16:00', status: 'confirmada' },
  { id: '2', member: 'Carlos Santos', date: '23/06/2026', time: '16:00 - 18:00', status: 'confirmada' },
  { id: '3', member: 'João Silva', date: '24/06/2026', time: '08:00 - 10:00', status: 'pendente' },
  { id: '4', member: 'Ana Costa', date: '24/06/2026', time: '14:00 - 16:00', status: 'confirmada' },
  { id: '5', member: 'Pedro Mendes', date: '25/06/2026', time: '10:00 - 12:00', status: 'confirmada' },
];

const statusColors = {
  confirmada: 'bg-green-100 text-green-800',
  pendente: 'bg-yellow-100 text-yellow-800',
  cancelada: 'bg-gray-100 text-gray-600',
};

export default function SpaceDetailPage() {
  const [isEditing, setIsEditing] = useState(false);

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
              <AvatarImage src={mockSpace.photoUrl ?? undefined} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {mockSpace.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{mockSpace.name}</h1>
                <Badge variant={mockSpace.isActive ? 'default' : 'destructive'}>
                  {mockSpace.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <p className="text-muted-foreground capitalize">{mockSpace.category}</p>
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

      {/* Tabs */}
      <Tabs defaultValue="configuracoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="horarios">Horários</TabsTrigger>
        </TabsList>

        {/* Configurações */}
        <TabsContent value="configuracoes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Gerais</CardTitle>
                <CardDescription>Dados básicos do espaço</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Espaço</Label>
                  <Input value={mockSpace.name} disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={mockSpace.description} disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input value={mockSpace.category} disabled className="capitalize" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Custos</CardTitle>
                <CardDescription>Configuração de valores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Possui custo de reserva</Label>
                    <p className="text-sm text-muted-foreground">
                      Cobrar taxa ao reservar este espaço
                    </p>
                  </div>
                  <Switch checked={mockSpace.hasCost} disabled={!isEditing} />
                </div>
                {mockSpace.hasCost && (
                  <div className="space-y-2">
                    <Label>Valor da Reserva</Label>
                    <Input value={`R$ ${mockSpace.costAmount}`} disabled={!isEditing} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Regras de Reserva</CardTitle>
                <CardDescription>Configurações de tempo e frequência</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tempo mínimo (min)</Label>
                    <Input type="number" value={mockSpace.minReservationMinutes} disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tempo máximo (min)</Label>
                    <Input type="number" value={mockSpace.maxReservationMinutes} disabled={!isEditing} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tempo buffer (min)</Label>
                    <Input type="number" value={mockSpace.bufferMinutes} disabled={!isEditing} />
                    <p className="text-xs text-muted-foreground">
                      Intervalo entre reservas
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Máx. reservas/dia</Label>
                    <Input type="number" value={mockSpace.maxReservationsPerDay} disabled={!isEditing} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Antecedência máxima (dias)</Label>
                  <Input type="number" value={mockSpace.maxAdvanceDays} disabled={!isEditing} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
                <CardDescription>Ativar ou desativar o espaço</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Espaço Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      {mockSpace.isActive
                        ? 'Espaço disponível para reservas'
                        : 'Espaço desativado, não permite reservas'}
                    </p>
                  </div>
                  <Switch checked={mockSpace.isActive} disabled={!isEditing} />
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
                <CardTitle className="text-lg">Reservas Recentes</CardTitle>
                <CardDescription>Proximas reservas deste espaco</CardDescription>
              </div>
              <Link href={`/escritorio/reservas/nova?spaceId=${mockSpace.id}`}>
                <Button>
                  <Calendar className="mr-2 h-4 w-4" />
                  Nova Reserva
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReservations.map((res) => (
                  <div key={res.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {res.member.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{res.member}</p>
                        <p className="text-sm text-muted-foreground">
                          {res.date} • {res.time}
                        </p>
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

        {/* Horários */}
        <TabsContent value="horarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Horário de Funcionamento</CardTitle>
              <CardDescription>Configure os horários de funcionamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Abertura</Label>
                  <Input type="time" value={mockSpace.openTime} disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label>Encerramento</Label>
                  <Input type="time" value={mockSpace.closeTime} disabled={!isEditing} />
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Horários de almoço</h4>
                <p className="text-sm text-muted-foreground">
                  Configure períodos de almoço (opcional)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
