'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

const mockReservations = [
  { id: '1', space: 'Quadra Poliesportiva A', date: '24/06/2026', dayName: 'quarta-feira', time: '14:00 - 16:00', status: 'confirmada', amount: 50, paid: true },
  { id: '2', space: 'Sala de Jogos', date: '25/06/2026', dayName: 'quinta-feira', time: '19:00 - 22:00', status: 'pendente', amount: 0, paid: false },
  { id: '3', space: 'Churrasqueira 1', date: '01/07/2026', dayName: 'terca-feira', time: '12:00 - 18:00', status: 'confirmada', amount: 80, paid: true },
  { id: '4', space: 'Quadra de Tenis', date: '15/06/2026', dayName: 'domingo', time: '08:00 - 10:00', status: 'concluida', amount: 30, paid: true },
  { id: '5', space: 'Piscina', date: '10/06/2026', dayName: 'terca-feira', time: '06:00 - 08:00', status: 'concluida', amount: 25, paid: true },
  { id: '6', space: 'Salao de Festas', date: '05/06/2026', dayName: 'quinta-feira', time: '19:00 - 23:00', status: 'cancelada', amount: 300, paid: false },
];

const statusConfig = {
  confirmada: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800' },
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  concluida: { label: 'Concluida', color: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600' },
};

export default function ReservationsPage() {
  const [filter, setFilter] = useState('all');

  const upcomingReservations = mockReservations.filter(
    (r) => ['confirmada', 'pendente'].includes(r.status)
  );

  const pastReservations = mockReservations.filter(
    (r) => ['concluida', 'cancelada'].includes(r.status)
  );

  const filteredUpcoming = filter === 'all' ? upcomingReservations : upcomingReservations.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas Reservas</h1>
          <p className="text-muted-foreground">Visualize e gerencie suas reservas</p>
        </div>
        <Link href="/reservar">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Reserva
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Proximas ({upcomingReservations.length})</TabsTrigger>
          <TabsTrigger value="past">Anteriores ({pastReservations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {filteredUpcoming.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma reserva upcoming</p>
                <Link href="/reservar">
                  <Button className="mt-4">Fazer uma reserva</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredUpcoming.map((res) => (
                <Card key={res.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{res.space}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="capitalize">{res.dayName}, {res.date}</span>
                            <span>-</span>
                            <Clock className="h-4 w-4" />
                            <span>{res.time}</span>
                          </div>
                          {res.amount > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={res.paid ? 'default' : 'outline'}>
                                {res.paid ? 'Pago' : 'Pendente'}
                              </Badge>
                              <span className="text-sm font-medium">R$ {res.amount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusConfig[res.status as keyof typeof statusConfig].color}>
                          {statusConfig[res.status as keyof typeof statusConfig].label}
                        </Badge>
                        {res.status === 'confirmada' && (
                          <Button variant="outline" size="sm" className="text-destructive">Cancelar</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastReservations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma reserva anterior</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastReservations.map((res) => (
                <Card key={res.id} className={res.status === 'cancelada' ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`rounded-lg p-3 ${res.status === 'concluida' ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <MapPin className={`h-6 w-6 ${res.status === 'concluida' ? 'text-green-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{res.space}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{res.date}</span>
                            <span>-</span>
                            <Clock className="h-4 w-4" />
                            <span>{res.time}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={statusConfig[res.status as keyof typeof statusConfig].color}>
                        {statusConfig[res.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
