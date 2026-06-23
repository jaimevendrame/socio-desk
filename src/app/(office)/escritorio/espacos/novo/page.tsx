'use client';

import { useState } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function NewSpacePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'esportivo',
    openTime: '06:00',
    closeTime: '22:00',
    bufferMinutes: 15,
    minReservationMinutes: 60,
    maxReservationMinutes: 240,
    maxAdvanceDays: 30,
    maxReservationsPerDay: 4,
    hasCost: false,
    costAmount: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Espaço criado com sucesso!');
      router.push('/escritorio/espacos');
    } catch {
      toast.error('Erro ao criar espaço');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/escritorio/espacos" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Novo Espaço</h1>
          <p className="text-muted-foreground">Cadastre um novo espaço na associação</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Gerais</CardTitle>
            <CardDescription>Dados básicos do espaço</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Espaço *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Quadra Poliesportiva"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v ?? '' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="esportivo">Esportivo</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="equipamento">Equipamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o espaço..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Horário de Funcionamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Horário de Funcionamento</CardTitle>
            <CardDescription>Configure os horários de funcionamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="openTime">Abertura</Label>
                <Input
                  id="openTime"
                  type="time"
                  value={formData.openTime}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeTime">Encerramento</Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regras de Reserva */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Regras de Reserva</CardTitle>
            <CardDescription>Configure as regras para reservas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minReservationMinutes">Tempo mínimo de reserva (min)</Label>
                <Input
                  id="minReservationMinutes"
                  type="number"
                  value={formData.minReservationMinutes}
                  onChange={(e) => setFormData({ ...formData, minReservationMinutes: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxReservationMinutes">Tempo máximo de reserva (min)</Label>
                <Input
                  id="maxReservationMinutes"
                  type="number"
                  value={formData.maxReservationMinutes}
                  onChange={(e) => setFormData({ ...formData, maxReservationMinutes: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bufferMinutes">Tempo buffer (min)</Label>
                <Input
                  id="bufferMinutes"
                  type="number"
                  value={formData.bufferMinutes}
                  onChange={(e) => setFormData({ ...formData, bufferMinutes: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Intervalo entre reservas</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAdvanceDays">Antecedência máxima (dias)</Label>
                <Input
                  id="maxAdvanceDays"
                  type="number"
                  value={formData.maxAdvanceDays}
                  onChange={(e) => setFormData({ ...formData, maxAdvanceDays: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxReservationsPerDay">Máx. reservas/dia</Label>
                <Input
                  id="maxReservationsPerDay"
                  type="number"
                  value={formData.maxReservationsPerDay}
                  onChange={(e) => setFormData({ ...formData, maxReservationsPerDay: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custos</CardTitle>
            <CardDescription>Configure os custos de reserva</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Possui custo de reserva</Label>
                <p className="text-sm text-muted-foreground">
                  Cobrar taxa ao reservar este espaço
                </p>
              </div>
              <Switch
                checked={formData.hasCost}
                onCheckedChange={(checked) => setFormData({ ...formData, hasCost: checked })}
              />
            </div>
            {formData.hasCost && (
              <div className="space-y-2">
                <Label htmlFor="costAmount">Valor da Reserva (R$)</Label>
                <Input
                  id="costAmount"
                  type="number"
                  step="0.01"
                  value={formData.costAmount}
                  onChange={(e) => setFormData({ ...formData, costAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status */}
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
                  {formData.isActive
                    ? 'Espaço disponível para reservas'
                    : 'Espaço desativado, não permite reservas'}
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/escritorio/espacos">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Criar Espaço
          </Button>
        </div>
      </form>
    </div>
  );
}
