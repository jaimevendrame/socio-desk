'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, Calendar, Clock, MapPin, DollarSign, Check, AlertTriangle, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';
import { useAuth } from '@/lib/auth/client';

interface Space {
  id: string;
  name: string;
  description: string | null;
  costAmount: string | null;
  hasCost: boolean;
  openTime: string;
  closeTime: string;
}

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
];

interface ConflictInfo {
  id: string;
  memberName: string;
  date: string;
  startTime: string;
  endTime: string;
}

export default function NewReservationPage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [spacesLoading, setSpacesLoading] = useState(true);
  const isInitialLoading = memberLoading || spacesLoading;
  const [formData, setFormData] = useState({
    spaceId: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [showWaitlistPrompt, setShowWaitlistPrompt] = useState(false);

  // Buscar memberId quando user estiver disponível
  useEffect(() => {
    if (!user?.id) {
      setMemberLoading(false);
      return;
    }
    setMemberLoading(true);
    async function fetchMemberId() {
      try {
        const userId = user?.id;
        if (!userId) return;
        const meRes = await fetch(`/api/members?userId=${userId}`, { credentials: 'include' });
        if (meRes.ok) {
          const meData = await meRes.json();
          setMemberId(meData.data?.[0]?.id || null);
        } else {
          console.warn('[reservar] /api/members status:', meRes.status);
        }
      } catch (err) {
        console.error('[reservar] fetchMemberId error:', err);
      } finally {
        setMemberLoading(false);
      }
    }
    fetchMemberId();
  }, [user?.id]);

  // Buscar espaços do backend
  useEffect(() => {
    async function fetchSpaces() {
      try {
        setSpacesLoading(true);
        const url = buildApiUrl('/api/spaces', tenantId);
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error('Erro ao carregar espaços');
        const data = await response.json();
        setSpaces(data.data || []);
      } catch (err) {
        toast.error('Erro ao carregar espaços');
      } finally {
        setIsLoading(false);
        setSpacesLoading(false);
      }
    }
    fetchSpaces();
  }, [tenantId]);

  // Quando memberLoading termina mas não encontrou memberId, o usuário não tem cadastro
  const hasNoMember = !memberLoading && !memberId;

  const selectedSpace = spaces.find((s) => s.id === formData.spaceId);
  const spaceCost = selectedSpace?.hasCost && selectedSpace?.costAmount
    ? parseFloat(selectedSpace.costAmount)
    : 0;

  const handleSubmit = async () => {
    console.log('[reservar] handleSubmit called');
    console.log('[reservar] memberId:', memberId, '| spaceId:', formData.spaceId, '| date:', formData.date, '| startTime:', formData.startTime, '| endTime:', formData.endTime);

    if (!memberId) {
      toast.error('Não foi possível identificar seu cadastro. Faça login novamente.');
      return;
    }

    // Validar UUIDs antes de enviar
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(memberId)) {
      console.error('[reservar] Invalid memberId:', memberId);
      toast.error('ID do membro inválido. Faça login novamente.');
      return;
    }
    if (!uuidRegex.test(formData.spaceId)) {
      console.error('[reservar] Invalid spaceId:', formData.spaceId);
      toast.error('Espaço inválido. Selecione novamente.');
      return;
    }
    if (!formData.spaceId || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Preencha todos os campos obrigatorios');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('Horario de fim deve ser apos o inicio');
      return;
    }

    setSubmitLoading(true);
    setConflicts([]);
    setShowWaitlistPrompt(false);
    try {
      const url = buildApiUrl('/api/reservations', tenantId);
      const payload = {
        tenantId,
        spaceId: formData.spaceId,
        memberId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        notes: formData.notes || undefined,
        amount: spaceCost || undefined,
      };
      console.log('[reservar] POST body:', JSON.stringify(payload));
      console.log('[reservar] memberId value:', memberId, 'type:', typeof memberId);
      console.log('[reservar] spaceId from form:', formData.spaceId, 'length:', formData.spaceId.length);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tenantId,
          spaceId: formData.spaceId,
          memberId,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          notes: formData.notes || undefined,
          amount: spaceCost || undefined,
        }),
      });

      const errorData = await response.json();
      console.log('[reservar] POST /api/reservations response:', response.status, JSON.stringify(errorData));

      if (!response.ok) {
        if (response.status === 409 && errorData.canJoinWaitlist) {
          setConflicts(errorData.conflicts || []);
          setShowWaitlistPrompt(true);
          setSubmitLoading(false);
          return;
        }
        throw new Error(errorData.error || 'Erro ao criar reserva');
      }

      toast.success('Reserva solicitada com sucesso!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar reserva');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!memberId) return;
    setSubmitLoading(true);
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          spaceId: formData.spaceId,
          memberId,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao entrar na fila');
      toast.success(data.message || 'Você entrou na fila de espera!');
      router.push('/reservas');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao entrar na fila');
    } finally {
      setSubmitLoading(false);
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
          {spacesLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : spaces.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Nenhum espaco disponivel</p>
              </CardContent>
            </Card>
          ) : (
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
                      {space.hasCost && space.costAmount ? (
                        <Badge variant="outline">R$ {parseFloat(space.costAmount).toFixed(2)}</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Gratis</Badge>
                      )}
                    </div>
                    <CardDescription>{space.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
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

      {showWaitlistPrompt && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">Horário já reservado</CardTitle>
                <CardDescription>
                  Este horário já está reservado. Você pode entrar na fila de espera.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {conflicts.length > 0 && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-white/60 dark:bg-black/20 p-3 space-y-2">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                  Reserva(s) conflitante(s):
                </p>
                {conflicts.map((conflict) => (
                  <div key={conflict.id} className="flex items-center gap-4 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{conflict.memberName}</p>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{conflict.startTime} - {conflict.endTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowWaitlistPrompt(false);
                  setConflicts([]);
                  setStep(2);
                }}
                disabled={submitLoading}
              >
                Escolher outro horário
              </Button>
              <Button
                onClick={handleJoinWaitlist}
                disabled={submitLoading}
                className="flex-1"
              >
                {submitLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Users className="mr-2 h-4 w-4" />
                )}
                Entrar na fila de espera
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && !showWaitlistPrompt && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Confirme sua Reserva</span>
                {isInitialLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              </CardTitle>
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
                {spaceCost > 0 && (
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">R$ {spaceCost.toFixed(2)}</p>
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
                <Button type="button" onClick={handleSubmit} disabled={submitLoading || isInitialLoading}>
                  {submitLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
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
