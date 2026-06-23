'use client';

import { useState } from 'react';
import { ArrowLeft, Save, Loader2, Calendar, Clock, MapPin, DollarSign, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const spaces = [
  { id: '1', name: 'Quadra Poliesportiva A', description: 'Quadra coberta para futsal, volei e basquete', cost: 50 },
  { id: '2', name: 'Quadra de Tenis', description: '2 quadras de tenis com iluminacao', cost: 30 },
  { id: '3', name: 'Salao de Festas', description: 'Salao para eventos com capacidade para 150 pessoas', cost: 300 },
  { id: '4', name: 'Sala de Jogos', description: 'Sinuca, pebolim e tavla', cost: 0 },
  { id: '5', name: 'Churrasqueira 1', description: 'Churrasqueira com area verde', cost: 80 },
  { id: '6', name: 'Piscina', description: 'Piscina semiolimpica com raia', cost: 25 },
];

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
];

export default function NewReservationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    spaceId: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const selectedSpace = spaces.find((s) => s.id === formData.spaceId);

  const handleSubmit = async () => {
    if (!formData.spaceId || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Preencha todos os campos obrigatorios');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('Horario de fim deve ser apos o inicio');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Reserva solicitada com sucesso!');
      router.push('/dashboard');
    } catch {
      toast.error('Erro ao criar reserva');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.spaceId) {
      toast.error('Selecione um espaco');
      return;
    }
    if (step === 2 && (!formData.date || !formData.startTime || !formData.endTime)) {
      toast.error('Preencha a data e horario');
      return;
    }
    setStep(step + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nova Reserva</h1>
          <p className="text-muted-foreground">Escolha o espaco, data e horario</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Espaco' : s === 2 ? 'Horario' : 'Confirmacao'}
            </span>
            {s < 3 && <div className="h-px w-12 bg-border" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Selecione o Espaco</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {spaces.map((space) => (
              <Card
                key={space.id}
                className={`cursor-pointer transition-all ${
                  formData.spaceId === space.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setFormData({ ...formData, spaceId: space.id })}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{space.name}</CardTitle>
                    {space.cost > 0 ? (
                      <Badge variant="outline">R$ {space.cost.toFixed(2)}</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">Gratis</Badge>
                    )}
                  </div>
                  <CardDescription>{space.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={nextStep}>Proximo</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data e Horario</CardTitle>
            <CardDescription>
              Reservando: <span className="font-semibold">{selectedSpace?.name}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Horario de Inicio *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Horario de Termino *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observacoes (opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Alguma observacao?"
                rows={3}
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={nextStep}>Proximo</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Confirme sua Reserva</CardTitle>
              <CardDescription>Revise os dados antes de confirmar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedSpace?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedSpace?.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">{formData.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">{formData.startTime} - {formData.endTime}</p>
                </div>
                {selectedSpace && selectedSpace.cost > 0 && (
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">R$ {selectedSpace.cost.toFixed(2)}</p>
                  </div>
                )}
                {formData.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Observacoes:</p>
                    <p className="text-sm">{formData.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Confirmar Reserva
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
