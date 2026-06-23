'use client';

import { useState } from 'react';
import { ArrowLeft, Save, Loader2, Calendar, Clock, User, DollarSign, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const spaces = [
  { id: '1', name: 'Quadra Poliesportiva A', cost: 50 },
  { id: '2', name: 'Quadra de Tênis', cost: 30 },
  { id: '3', name: 'Salão de Festas', cost: 300 },
  { id: '4', name: 'Sala de Jogos', cost: 0 },
  { id: '5', name: 'Churrasqueira 1', cost: 80 },
  { id: '6', name: 'Piscina', cost: 25 },
];

const members = [
  { id: '1', name: 'Maria Oliveira', cpf: '123.456.789-00' },
  { id: '2', name: 'Carlos Santos', cpf: '987.654.321-00' },
  { id: '3', name: 'Ana Costa', cpf: '456.789.123-00' },
  { id: '4', name: 'Pedro Mendes', cpf: '321.654.987-00' },
  { id: '5', name: 'Juliana Ferreira', cpf: '654.321.789-00' },
];

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
];

export default function NewReservationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    spaceId: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
    isPaid: false,
  });

  const selectedSpace = spaces.find((s) => s.id === formData.spaceId);
  const selectedMember = members.find((m) => m.id === formData.memberId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startTime || !formData.endTime) {
      toast.error('Selecione o horário de início e fim');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('Horário de fim deve ser após o início');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Reserva criada com sucesso!');
      router.push('/escritorio/reservas');
    } catch {
      toast.error('Erro ao criar reserva');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/escritorio/reservas" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nova Reserva</h1>
          <p className="text-muted-foreground">Cadastre uma nova reserva</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados da Reserva */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados da Reserva</CardTitle>
                <CardDescription>Informações da reserva</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="member">Associado *</Label>
                    <Select value={formData.memberId} onValueChange={(v) => setFormData({ ...formData, memberId: v ?? '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o associado" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} - {member.cpf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="space">Espaço *</Label>
                    <Select value={formData.spaceId} onValueChange={(v) => setFormData({ ...formData, spaceId: v ?? '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o espaço" />
                      </SelectTrigger>
                      <SelectContent>
                        {spaces.map((space) => (
                          <SelectItem key={space.id} value={space.id}>
                            {space.name} {space.cost > 0 && `- R$ ${space.cost.toFixed(2)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Horário de Início *</Label>
                    <Select value={formData.startTime} onValueChange={(v) => setFormData({ ...formData, startTime: v ?? '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Horário de Término *</Label>
                    <Select value={formData.endTime} onValueChange={(v) => setFormData({ ...formData, endTime: v ?? '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSpace && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Espaço</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedSpace.name}</Badge>
                    </div>
                  </div>
                )}

                {selectedMember && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Associado</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedMember.name}</span>
                    </div>
                  </div>
                )}

                {formData.date && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Data</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(formData.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                  </div>
                )}

                {formData.startTime && formData.endTime && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Horário</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.startTime} - {formData.endTime}</span>
                    </div>
                  </div>
                )}

                {selectedSpace && selectedSpace.cost > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-muted-foreground">Valor</Label>
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <DollarSign className="h-5 w-5" />
                      <span>R$ {selectedSpace.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPaid"
                        checked={formData.isPaid}
                        onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="isPaid" className="font-normal">Pago no ato da reserva</Label>
                    </div>
                  </div>
                )}

                {!selectedSpace?.cost && formData.spaceId && (
                  <div className="flex items-center gap-2 pt-4 border-t text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>Este espaço não possui custo</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Confirmar Reserva
              </Button>
              <Link href="/escritorio/reservas">
                <Button variant="outline" type="button" className="w-full">Cancelar</Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
