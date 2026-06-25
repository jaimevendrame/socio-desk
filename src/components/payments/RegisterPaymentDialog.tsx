'use client';

import { useState, useEffect } from 'react';
import { Plus, CreditCard, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { buildApiUrl, useTenant } from '@/lib/context/tenant-context';

interface Member {
  id: string;
  name: string;
  email?: string;
}

interface RegisterPaymentDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  preselectedMemberId?: string;
}

export function RegisterPaymentDialog({
  onSuccess,
  trigger,
  preselectedMemberId
}: RegisterPaymentDialogProps) {
  const { tenantId } = useTenant();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [memberId, setMemberId] = useState(preselectedMemberId || '');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function fetchMembers() {
      if (!tenantId) return;

      setIsFetchingMembers(true);
      try {
        const response = await fetch(buildApiUrl(`/api/members?tenantId=${tenantId}`));
        if (response.ok) {
          const data = await response.json();
          setMembers(data.data || []);
        }
      } catch (err) {
        console.error('Erro ao buscar membros:', err);
      } finally {
        setIsFetchingMembers(false);
      }
    }

    if (open) {
      fetchMembers();
    }
  }, [open, tenantId]);

  const handleSubmit = async () => {
    if (!memberId || !description || !amount || !dueDate) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl('/api/payments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          memberId,
          description,
          amount: parseFloat(amount),
          dueDate,
          notes: notes || undefined,
          status: 'pending',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao criar pagamento');
      }

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setMemberId('');
    setDescription('');
    setAmount('');
    setDueDate('');
    setNotes('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
      setError(null);
    }
    setOpen(newOpen);
  };

  // Set preselected member
  useEffect(() => {
    if (preselectedMemberId) {
      setMemberId(preselectedMemberId);
    }
  }, [preselectedMemberId]);

  const TriggerWrapper = ({ children }: { children: React.ReactNode }) => (
    <div onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
      {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <TriggerWrapper>{trigger}</TriggerWrapper>
      ) : (
        <DialogTrigger>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Pagamento
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Registrar Pagamento
          </DialogTitle>
          <DialogDescription>
            Registre uma nova mensalidade ou cobrança
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="member">
              Associado <span className="text-red-500">*</span>
            </Label>
            <Select value={memberId} onValueChange={(value) => value && setMemberId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um associado" />
              </SelectTrigger>
              <SelectContent>
                {isFetchingMembers ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descrição <span className="text-red-500">*</span>
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Mensalidade Junho/2026"
            />
          </div>

          {/* Amount and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Valor (R$) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">
                Vencimento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre a cobrança"
              rows={2}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Criar Cobrança
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
