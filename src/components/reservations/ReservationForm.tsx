'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';
import { AlertTriangle, Plus, Clock, Users } from 'lucide-react';

interface ConflictInfo {
  id: string;
  memberName: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface ReservationFormProps {
  spaceId?: string;
  date?: string;
  onSuccess?: () => void;
}

export function ReservationForm({ spaceId, date, onSuccess }: ReservationFormProps) {
  const { tenantId } = useTenant();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [waitlistSuccess, setWaitlistSuccess] = useState<string | null>(null);

  // Estados do formulário
  const [selectedSpaceId, setSelectedSpaceId] = useState(spaceId || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    date ? parseISO(date) : new Date()
  );
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<'daily' | 'weekly'>('daily');
  const [recurringUntil, setRecurringUntil] = useState(
    format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );

  // Estados de dados
  const [members, setMembers] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [spaces, setSpaces] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [spacesLoading, setSpacesLoading] = useState(false);

  // Carregar membros e espaços quando o dialog abre
  const loadData = async () => {
    setMembersLoading(true);
    setSpacesLoading(true);

    try {
      // Carregar membros
      const membersUrl = buildApiUrl('/api/members', tenantId);
      const membersRes = await fetch(membersUrl);
      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.data?.filter((m: any) => m.status === 'ativo') || []);
      }

      // Carregar espaços
      const spacesUrl = buildApiUrl('/api/spaces', tenantId);
      const spacesRes = await fetch(spacesUrl);
      if (spacesRes.ok) {
        const data = await spacesRes.json();
        setSpaces(data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setMembersLoading(false);
      setSpacesLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    loadData();
    setError(null);
    setConflicts([]);
    setWaitlistSuccess(null);
  };

  const handleClose = () => {
    setOpen(false);
    setConflicts([]);
    setWaitlistSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSpaceId || !selectedDate || !selectedMemberId) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    const startMinutes = parseInt(startTime.split(':')[0]);
    const endMinutes = parseInt(endTime.split(':')[0]);
    if (endMinutes <= startMinutes) {
      setError('Horário de término deve ser após o início');
      return;
    }

    setLoading(true);

    try {
      const body: any = {
        tenantId,
        spaceId: selectedSpaceId,
        memberId: selectedMemberId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        notes: notes || undefined,
        isRecurring,
      };

      if (isRecurring) {
        body.recurringPattern = recurringPattern;
        body.recurringUntil = recurringUntil;
      }

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();

        // Se há conflito, mostra opção de entrar na fila de espera
        if (response.status === 409 && data.canJoinWaitlist) {
          setConflicts(data.conflicts || []);
          setError('Horário indisponível');
          return;
        }

        const msg = data.details
          ? Object.values(data.details).flat().map((e: any) => e._errors?.[0] || e).join(', ')
          : data.error || 'Falha ao criar reserva';
        setError(msg);
        return;
      }

      setOpen(false);
      onSuccess?.();
      // Reset form
      setSelectedSpaceId('');
      setSelectedMemberId('');
      setStartTime('09:00');
      setEndTime('10:00');
      setNotes('');
      setIsRecurring(false);
      setConflicts([]);
      setWaitlistSuccess(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!selectedSpaceId || !selectedDate || !selectedMemberId) return;

    setWaitlistLoading(true);
    setWaitlistSuccess(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: selectedSpaceId,
          memberId: selectedMemberId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime,
          endTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao entrar na fila');
      }

      setWaitlistSuccess(data.message);
      setConflicts([]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar na fila de espera');
    } finally {
      setWaitlistLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
      >
        <Plus className="h-4 w-4" />
        Nova Reserva
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Reserva</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                {error}
              </div>
            )}

            {/* Sucesso na fila de espera */}
            {waitlistSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Adicionado à fila de espera!</p>
                  <p>{waitlistSuccess}</p>
                </div>
              </div>
            )}

            {/* Info de conflitos e opção de waitlist */}
            {conflicts.length > 0 && !waitlistSuccess && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800">Horário já reservado</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Já existem reservas neste horário:
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {conflicts.map((conflict) => (
                    <div
                      key={conflict.id}
                      className="flex items-center gap-2 text-sm text-amber-800 bg-white/60 rounded p-2"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-medium">{conflict.memberName}</span>
                      <span className="text-amber-600">
                        {conflict.startTime} - {conflict.endTime}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-200">
                  <p className="text-sm text-amber-700">
                    Deseja entrar na fila de espera? Avisamos quando liberar.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleJoinWaitlist}
                    disabled={waitlistLoading}
                    className="border-amber-400 text-amber-700 hover:bg-amber-100"
                  >
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    {waitlistLoading ? 'Adicionando...' : 'Entrar na fila'}
                  </Button>
                </div>
              </div>
            )}

            {/* Espaço */}
            <div className="space-y-2">
              <Label htmlFor="space">Espaço *</Label>
              <select
                id="space"
                value={selectedSpaceId}
                onChange={(e) => setSelectedSpaceId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Selecione um espaço</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name} ({space.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setSelectedDate(e.target.value ? parseISO(e.target.value) : undefined)}
              />
            </div>

            {/* Membro */}
            <div className="space-y-2">
              <Label htmlFor="member">Membro *</Label>
              <select
                id="member"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Selecione um membro</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Término</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Reserva Recorrente */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Reserva Recorrente</h4>
                <p className="text-sm text-gray-600">
                  Criar múltiplas reservas automaticamente
                </p>
              </div>
              <Switch
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {isRecurring && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
                <div className="space-y-2">
                  <Label htmlFor="pattern">Padrão</Label>
                  <select
                    id="pattern"
                    value={recurringPattern}
                    onChange={(e) => setRecurringPattern(e.target.value as 'daily' | 'weekly')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="until">Até</Label>
                  <Input
                    id="until"
                    type="date"
                    value={recurringUntil}
                    onChange={(e) => setRecurringUntil(e.target.value)}
                    min={format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}
                  />
                </div>
              </div>
            )}

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações opcionais..."
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || membersLoading || spacesLoading || !selectedSpaceId || !selectedMemberId}
              >
                {loading ? 'Criando...' : 'Criar Reserva'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
