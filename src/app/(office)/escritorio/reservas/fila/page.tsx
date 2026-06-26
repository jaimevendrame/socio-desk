'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Users, Trash2, Bell, AlertCircle, CheckCircle } from 'lucide-react';

interface WaitlistEntry {
  id: string;
  spaceId: string;
  spaceName: string | null;
  memberId: string;
  memberName: string | null;
  memberEmail: string | null;
  date: string;
  startTime: string;
  endTime: string;
  position: number;
  status: 'waiting' | 'notified' | 'confirmed' | 'expired';
  notifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface Space {
  id: string;
  name: string;
  category: string;
}

export default function WaitlistPage() {
  const { tenantId } = useTenant();

  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSpace, setFilterSpace] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterSpace && filterSpace !== '__all__') params.set('spaceId', filterSpace);
      if (filterDate) params.set('date', filterDate);

      const url = buildApiUrl('/api/waitlist', tenantId, Object.fromEntries(params));
      const response = await fetch(url);

      if (!response.ok) throw new Error('Erro ao carregar fila de espera');

      const data = await response.json();
      let filtered = data.data || [];

      if (filterStatus) {
        filtered = filtered.filter((e: WaitlistEntry) => e.status === filterStatus);
      }

      setEntries(filtered);
    } catch (err) {
      console.error('Erro ao carregar fila de espera:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, filterSpace, filterDate, filterStatus]);

  const fetchSpaces = useCallback(async () => {
    if (!tenantId) return;

    try {
      const url = buildApiUrl('/api/spaces', tenantId);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSpaces(data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar espaços:', err);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleRemove = async (id: string) => {
    if (!confirm('Remover este membro da fila de espera?')) return;

    setRemovingId(id);
    try {
      const response = await fetch(`/api/waitlist/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao remover');

      setFeedback({ type: 'success', message: 'Membro removido da fila de espera.' });
      fetchEntries();
    } catch (err) {
      setFeedback({ type: 'error', message: 'Não foi possível remover.' });
    } finally {
      setRemovingId(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    waiting: { label: 'Aguardando', className: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" /> },
    notified: { label: 'Notificado', className: 'bg-amber-100 text-amber-800', icon: <Bell className="h-3 w-3 mr-1" /> },
    confirmed: { label: 'Confirmou', className: 'bg-green-100 text-green-800', icon: <Users className="h-3 w-3 mr-1" /> },
    expired: { label: 'Expirado', className: 'bg-gray-100 text-gray-600', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
  };

  // Agrupa por espaço > data
  const grouped = entries.reduce<Record<string, Record<string, WaitlistEntry[]>>>((acc, entry) => {
    const space = entry.spaceName || entry.spaceId;
    const date = entry.date;
    if (!acc[space]) acc[space] = {};
    if (!acc[space][date]) acc[space][date] = [];
    acc[space][date].push(entry);
    return acc;
  }, {});

  const stats = {
    total: entries.length,
    waiting: entries.filter((e) => e.status === 'waiting').length,
    notified: entries.filter((e) => e.status === 'notified').length,
    confirmed: entries.filter((e) => e.status === 'confirmed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fila de Espera</h1>
          <p className="text-muted-foreground">
            Gerencie as filas de espera por espaço
          </p>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {feedback.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total na fila</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-700">{stats.waiting}</div>
            <p className="text-sm text-blue-600">Aguardando</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-700">{stats.notified}</div>
            <p className="text-sm text-amber-600">Notificados</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-700">{stats.confirmed}</div>
            <p className="text-sm text-green-600">Confirmados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <Select value={filterSpace} onValueChange={(v) => setFilterSpace(v || '')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os espaços" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os espaços</SelectItem>
                {spaces.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-[180px]"
              placeholder="Filtrar por data"
            />

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v || '')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todos status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos status</SelectItem>
                <SelectItem value="waiting">Aguardando</SelectItem>
                <SelectItem value="notified">Notificado</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={fetchEntries}>
              🔄 Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista agrupada */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhuma entrada na fila de espera</p>
            <p className="text-sm text-muted-foreground mt-1">
              Membros entram na fila quando o horário desejado está ocupado
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([spaceName, dates]) => (
            <Card key={spaceName}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>🏟️ {spaceName}</span>
                  <Badge variant="outline">{Object.values(dates).flat().length} entradas</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(dates)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, dayEntries]) => (
                    <div key={date}>
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        📅 {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </div>
                      <div className="space-y-2">
                        {dayEntries
                          .sort((a, b) => a.position - b.position)
                          .map((entry) => {
                            const cfg = statusConfig[entry.status] || statusConfig.waiting;
                            const isExpired = entry.status === 'notified' && entry.expiresAt && new Date(entry.expiresAt) < new Date();

                            return (
                              <div
                                key={entry.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  isExpired ? 'border-red-200 bg-red-50/30' : 'bg-muted/20'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {/* Posição */}
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 text-white text-sm font-bold">
                                    {entry.position}
                                  </div>

                                  <div>
                                    <div className="font-medium">
                                      {entry.memberName || 'Membro'}
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                      <span>🕐 {entry.startTime.slice(0, 5)} - {entry.endTime.slice(0, 5)}</span>
                                      {entry.memberEmail && (
                                        <span className="text-xs">{entry.memberEmail}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Status badge */}
                                  <Badge className={cfg.className}>
                                    {cfg.icon}
                                    {cfg.label}
                                    {isExpired && ' ⚠️'}
                                  </Badge>

                                  {/* Tempo restante para notificados */}
                                  {entry.status === 'notified' && entry.expiresAt && (
                                    <span className="text-xs text-amber-600">
                                      {isExpired ? 'Expirando agora...' :
                                        `Expira em ${Math.max(0, Math.round((new Date(entry.expiresAt).getTime() - Date.now()) / 60000))} min`}
                                    </span>
                                  )}

                                  {/* Remover */}
                                  {entry.status !== 'confirmed' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemove(entry.id)}
                                      disabled={removingId === entry.id}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}