'use client';

import { useState } from 'react';
import { Save, Loader2, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const mockMember = {
  id: '1',
  name: 'Joao Silva',
  email: 'joao.silva@email.com',
  cpf: '123.456.789-00',
  phoneMobile: '(11) 98765-4321',
  phoneHome: '(11) 3456-7890',
  birthDate: '15/03/1990',
  civilState: 'casado',
  registrationNumber: '001234',
  admissionDate: '15/01/2020',
  workplace: 'Prefeitura Municipal',
  address: {
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 45',
    district: 'Jardim Primavera',
    city: 'Sao Paulo',
    state: 'SP',
    zipCode: '01234-567',
  },
  photoUrl: null as string | null,
  status: 'ativo',
};

const mockDependents = [
  { id: '1', name: 'Maria Silva', type: 'conjuge', birthDate: '20/08/1988' },
  { id: '2', name: 'Pedro Silva', type: 'filho', birthDate: '10/12/2015' },
];

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: mockMember.name,
    email: mockMember.email,
    phoneMobile: mockMember.phoneMobile,
    phoneHome: mockMember.phoneHome,
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={formData.name} />
            <AvatarFallback className="text-lg bg-primary text-primary-foreground">
              {formData.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{mockMember.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{mockMember.registrationNumber}</Badge>
              <Badge className="bg-green-100 text-green-800">{mockMember.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="dependentes">Dependentes</TabsTrigger>
          <TabsTrigger value="seguranca">Seguranca</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Dados Pessoais</CardTitle>
                <CardDescription>Suas informacoes cadastrais</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={formData.name}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={mockMember.cpf} disabled />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input value={mockMember.birthDate} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Estado Civil</Label>
                  <Input value={mockMember.civilState} disabled />
                </div>
              </div>
              {isEditing && (
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alteracoes
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contato</CardTitle>
              <CardDescription>Seus canais de comunicacao</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Celular</Label>
                  <Input
                    value={formData.phoneMobile}
                    disabled={!isEditing}
                    onChange={(e) => setFormData({ ...formData, phoneMobile: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Telefone Residencial</Label>
                <Input
                  value={formData.phoneHome}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, phoneHome: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Endereco</CardTitle>
              <CardDescription>Seu endereco residencial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Logradouro</Label>
                  <Input value={mockMember.address.street} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Numero</Label>
                  <Input value={mockMember.address.number} disabled />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input value={mockMember.address.complement} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={mockMember.address.district} disabled />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={mockMember.address.zipCode} disabled />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={mockMember.address.city} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input value={mockMember.address.state} disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dependentes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Dependentes</CardTitle>
                <CardDescription>Familiares cadastrados na sua conta</CardDescription>
              </div>
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Adicionar Dependente
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDependents.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {dep.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{dep.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dep.type === 'conjuge' ? 'Conjuge' : 'Filho(a)'} - {dep.birthDate}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alterar Senha</CardTitle>
              <CardDescription>Atualize sua senha de acesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Senha Atual</Label>
                <Input type="password" placeholder="********" />
              </div>
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input type="password" placeholder="********" />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <Input type="password" placeholder="********" />
              </div>
              <Button>
                <Shield className="mr-2 h-4 w-4" />
                Alterar Senha
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
