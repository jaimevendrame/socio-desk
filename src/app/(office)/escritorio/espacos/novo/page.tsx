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
import { useTenant } from '@/lib/context/tenant-context';

export default function NewSpacePage() {
  const router = useRouter();
  const { tenantId } = useTenant();
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

    if (!formData.name) {
      toast.error('Preencha o nome do espaco');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category as 'esportivo' | 'social' | 'equipamento',
          openTime: formData.openTime,
          closeTime: formData.closeTime,
          bufferMinutes: formData.bufferMinutes,
          minReservationMinutes: formData.minReservationMinutes,
          maxReservationMinutes: formData.maxReservationMinutes,
          maxAdvanceDays: formData.maxAdvanceDays,
          maxReservationsPerDay: formData.maxReservationsPerDay || undefined,
          hasCost: formData.hasCost,
          costAmount: formData.hasCost && formData.costAmount
            ? parseFloat(formData.costAmount)
            : undefined,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar espaco');
      }

      toast.success('Espaco criado com sucesso!');
      router.push('/escritorio/espacos');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar espaco');
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
          <h1 className="text-2xl font-bold">Novo Espaco</h1>
          <p className="text-muted-foreground">Cadastre um novo espaco na associacao</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informacoes Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informacoes Gerais</CardTitle>
            <CardDescription>Dados basicos do espaco</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Espaco *</Label>
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
              <Label htmlFor="description">Descricao</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o espaco..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Horario de Funcionamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Horario de Funcionamento</CardTitle>
            <CardDescription>Configure os horarios de funcionamento</CardDescription>
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
                <Label htmlFor="minReservationMinutes">Tempo minimo de reserva (min)</Label>
                <Input
                  id="minReservationMinutes"
                  type="number"
                  value={formData.minReservationMinutes}
                  onChange={(e) => setFormData({ ...formData, minReservationMinutes: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxReservationMinutes">Tempo maximo de reserva (min)</Label>
                <Input
                  id="maxReservationMinutes"
                  type="number"
                  value={formData.maxReservationMinutes}
                  onChange={(e) => setFormData({ ...formData, maxReservationMinutes: parseInt(e.target.value) || 0 })}
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
                  onChange={(e) => setFormData({ ...formData, bufferMinutes: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Intervalo entre reservas</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAdvanceDays">Antecedencia maxima (dias)</Label>
                <Input
                  id="maxAdvanceDays"
                  type="number"
                  value={formData.maxAdvanceDays}
                  onChange={(e) => setFormData({ ...formData, maxAdvanceDays: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxReservationsPerDay">Max. reservas/dia</Label>
                <Input
                  id="maxReservationsPerDay"
                  type="number"
                  value={formData.maxReservationsPerDay}
                  onChange={(e) => setFormData({ ...formData, maxReservationsPerDay: parseInt(e.target.value) || 0 })}
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
                  Cobrar taxa ao reservar este espaco
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
            <CardDescription>Ativar ou desativar o espaco</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Espaco Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.isActive
                    ? 'Espaco disponivel para reservas'
                    : 'Espaco desativado, nao permite reservas'}
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
            Criar Espaco
          </Button>
        </div>
      </form>
    </div>
  );
}
