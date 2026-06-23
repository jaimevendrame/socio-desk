'use client';

import { useState } from 'react';
import { Search, Plus, Filter, MoreHorizontal, Mail, Phone, Building, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

// Mock data
const mockMembers = [
  {
    id: '1',
    name: 'Maria Oliveira',
    cpf: '123.456.789-00',
    email: 'maria.oliveira@email.com',
    phone: '(11) 98765-4321',
    type: 'afiliado',
    status: 'ativo',
    workplace: 'Secretaria de Educação',
    admissionDate: '15/01/2020',
  },
  {
    id: '2',
    name: 'Carlos Santos',
    cpf: '987.654.321-00',
    email: 'carlos.santos@email.com',
    phone: '(11) 91234-5678',
    type: 'afiliado',
    status: 'ativo',
    workplace: 'Prefeitura Municipal',
    admissionDate: '01/06/2019',
  },
  {
    id: '3',
    name: 'Ana Costa',
    cpf: '456.789.123-00',
    email: 'ana.costa@email.com',
    phone: '(11) 99876-5432',
    type: 'afiliado',
    status: 'inadimplente',
    workplace: 'Hospital Regional',
    admissionDate: '10/03/2021',
  },
  {
    id: '4',
    name: 'Pedro Mendes',
    cpf: '321.654.987-00',
    email: 'pedro.mendes@email.com',
    phone: '(11) 95555-1234',
    type: 'convidado',
    status: 'ativo',
    workplace: null,
    admissionDate: '20/08/2022',
  },
  {
    id: '5',
    name: 'Juliana Ferreira',
    cpf: '654.321.789-00',
    email: 'juliana.ferreira@email.com',
    phone: '(11) 94444-5678',
    type: 'afiliado',
    status: 'ativo',
    workplace: 'Instituto Federal',
    admissionDate: '05/01/2023',
  },
];

const statusColors = {
  ativo: 'bg-green-100 text-green-800',
  inadimplente: 'bg-red-100 text-red-800',
  suspenso: 'bg-yellow-100 text-yellow-800',
  cancelado: 'bg-gray-100 text-gray-600',
};

const typeLabels = {
  afiliado: 'Afiliado',
  convidado: 'Convidado',
  dependente_maior: 'Dependente',
};

export default function MembersListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>('all');
  const [typeFilter, setTypeFilter] = useState<string | null>('all');

  const filteredMembers = mockMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.cpf.includes(search) ||
      member.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesType = typeFilter === 'all' || member.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: mockMembers.length,
    ativos: mockMembers.filter((m) => m.status === 'ativo').length,
    inadimplentes: mockMembers.filter((m) => m.status === 'inadimplente').length,
    convidados: mockMembers.filter((m) => m.type === 'convidado').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Associados</h1>
          <p className="text-muted-foreground">Gerencie os membros da associação</p>
        </div>
        <Link href="/escritorio/associados/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Associado
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Associados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inadimplentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inadimplentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Convidados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.convidados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inadimplente">Inadimplente</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Tipos</SelectItem>
                  <SelectItem value="afiliado">Afiliado</SelectItem>
                  <SelectItem value="convidado">Convidado</SelectItem>
                  <SelectItem value="dependente_maior">Dependente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Associados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.name}</p>
                      {member.status === 'ativo' && (
                        <BadgeCheck className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {member.cpf}
                        </Badge>
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </span>
                      {member.workplace && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {member.workplace}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[member.status as keyof typeof statusColors]}>
                    {member.status}
                  </Badge>
                  <Badge variant="outline">{typeLabels[member.type as keyof typeof typeLabels]}</Badge>
                  <Link href={`/escritorio/associados/${member.id}`}>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {filteredMembers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Nenhum associado encontrado</p>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros ou adicionar um novo associado
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
