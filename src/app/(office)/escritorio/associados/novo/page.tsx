'use client';

import { useState } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTenant } from '@/lib/context/tenant-context';

export default function NewMemberPage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    birthDate: '',
    email: '',
    phoneMobile: '',
    phoneHome: '',
    addressStreet: '',
    addressNumber: '',
    addressCity: '',
    addressState: '',
    type: 'afiliado',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.cpf || !formData.birthDate) {
      toast.error('Preencha os campos obrigatorios');
      return;
    }

    // Validar CPF basico
    const cpfClean = formData.cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      toast.error('CPF invalido');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: formData.name,
          cpf: formData.cpf,
          birthDate: formData.birthDate,
          email: formData.email || undefined,
          phoneMobile: formData.phoneMobile || undefined,
          phoneHome: formData.phoneHome || undefined,
          addressStreet: formData.addressStreet || undefined,
          addressNumber: formData.addressNumber || undefined,
          addressCity: formData.addressCity || undefined,
          addressState: formData.addressState || undefined,
          type: formData.type as 'afiliado' | 'convidado' | 'dependente_maior',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar associado');
      }

      toast.success('Associado criado com sucesso!');
      router.push('/escritorio/associados');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar associado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/escritorio/associados" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Novo Associado</h1>
          <p className="text-muted-foreground">Cadastre um novo membro na associacao</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados Pessoais</CardTitle>
            <CardDescription>Informacoes de identificacao do membro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2}>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="afiliado">Afiliado</SelectItem>
                    <SelectItem value="convidado">Convidado</SelectItem>
                    <SelectItem value="dependente_maior">Dependente Maior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contato</CardTitle>
            <CardDescription>Canais de comunicacao</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneMobile">Celular</Label>
                <Input
                  id="phoneMobile"
                  placeholder="(00) 00000-0000"
                  value={formData.phoneMobile}
                  onChange={(e) => setFormData({ ...formData, phoneMobile: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phoneHome">Telefone Fixo</Label>
                <Input
                  id="phoneHome"
                  placeholder="(00) 0000-0000"
                  value={formData.phoneHome}
                  onChange={(e) => setFormData({ ...formData, phoneHome: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Endereco</CardTitle>
            <CardDescription>Endereco residencial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressStreet">Logradouro</Label>
                <Input
                  id="addressStreet"
                  value={formData.addressStreet}
                  onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressNumber">Numero</Label>
                <Input
                  id="addressNumber"
                  value={formData.addressNumber}
                  onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addressCity">Cidade</Label>
                <Input
                  id="addressCity"
                  value={formData.addressCity}
                  onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressState">Estado</Label>
                <Input
                  id="addressState"
                  value={formData.addressState}
                  onChange={(e) => setFormData({ ...formData, addressState: e.target.value })}
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/escritorio/associados">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Salvar Associado
          </Button>
        </div>
      </form>
    </div>
  );
}
