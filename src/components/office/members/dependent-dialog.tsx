'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';
import { Users, Pencil, Trash2 } from 'lucide-react';

interface Dependent {
  id: string;
  memberId: string;
  type: 'conjuge' | 'filho' | 'enteado' | 'pais' | 'irmao' | 'outro';
  name: string;
  birthDate: string;
  documentType?: 'rg' | 'cpf' | 'passaporte' | null;
  documentNumber?: string | null;
  status: 'ativo' | 'inativo' | 'migrado';
}

interface DependentFormData {
  type: 'conjuge' | 'filho' | 'enteado' | 'pais' | 'irmao' | 'outro';
  name: string;
  birthDate: string;
  documentType?: 'rg' | 'cpf' | 'passaporte';
  documentNumber?: string;
}

interface DependentDialogProps {
  memberId: string;
  dependent?: Dependent;
  onSave: () => void;
  trigger?: React.ReactNode;
}

const typeLabels: Record<string, string> = {
  conjuge: 'Cônjuge',
  filho: 'Filho(a)',
  enteado: 'Enteado(a)',
  pais: 'Pais',
  irmao: 'Irmão(ã)',
  outro: 'Outro',
};

export function DependentDialog({ memberId, dependent, onSave, trigger }: DependentDialogProps) {
  const { tenantId } = useTenant();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<DependentFormData>({
    type: 'filho',
    name: '',
    birthDate: '',
    documentType: undefined,
    documentNumber: '',
  });

  useEffect(() => {
    if (open) {
      if (dependent) {
        setForm({
          type: dependent.type,
          name: dependent.name,
          birthDate: dependent.birthDate,
          documentType: dependent.documentType || undefined,
          documentNumber: dependent.documentNumber || '',
        });
      } else {
        setForm({
          type: 'filho',
          name: '',
          birthDate: '',
          documentType: undefined,
          documentNumber: '',
        });
      }
      setError(null);
    }
  }, [open, dependent]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.birthDate) {
      setError('Nome e data de nascimento são obrigatórios');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = dependent
        ? buildApiUrl(`/api/dependents/${dependent.id}`, tenantId)
        : buildApiUrl('/api/dependents', tenantId);

      const method = dependent ? 'PATCH' : 'POST';

      const body: Record<string, unknown> = {
        type: form.type,
        name: form.name,
        birthDate: form.birthDate,
      };

      if (!dependent) {
        body.memberId = memberId;
      }

      if (form.documentType) {
        body.documentType = form.documentType;
      }
      if (form.documentNumber) {
        body.documentNumber = form.documentNumber;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId || '',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar dependente');
      }

      setOpen(false);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar dependente');
    } finally {
      setSaving(false);
    }
  };

  const formatDateBRtoInput = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <Button size="sm">
            <Users className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {dependent ? 'Editar Dependente' : 'Adicionar Dependente'}
          </DialogTitle>
          <DialogDescription>
            {dependent
              ? 'Atualize os dados do dependente.'
              : 'Cadastre um novo familiar para este associado.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Parentesco *</Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, type: value as typeof form.type }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Digite o nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de Nascimento *</Label>
            <Input
              id="birthDate"
              type="date"
              value={formatDateBRtoInput(form.birthDate)}
              onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Tipo de Documento</Label>
              <Select
                value={form.documentType || ''}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, documentType: value as typeof form.documentType }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rg">RG</SelectItem>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="passaporte">Passaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">Número do Documento</Label>
              <Input
                id="documentNumber"
                value={form.documentNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, documentNumber: e.target.value }))
                }
                placeholder="Digite o número"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <DialogClose>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete confirmation dialog
interface DeleteDependentDialogProps {
  dependent: Dependent;
  onDelete: () => void;
  trigger?: React.ReactNode;
}

export function DeleteDependentDialog({ dependent, onDelete, trigger }: DeleteDependentDialogProps) {
  const { tenantId } = useTenant();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(
        buildApiUrl(`/api/dependents/${dependent.id}`, tenantId),
        {
          method: 'DELETE',
          headers: {
            'x-tenant-id': tenantId || '',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao remover dependente');
      }

      setOpen(false);
      onDelete();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <Button variant="ghost" size="icon" className="text-red-500">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover Dependente</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover <strong>{dependent.name}</strong> dos dependentes? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Removendo...' : 'Remover'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
