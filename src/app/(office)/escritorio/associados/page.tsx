'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, MoreHorizontal, Mail, Phone, Building, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';
import { ImportMembersDialog } from '@/components/office/members/import-dialog';

interface Member {
  id: string;
  name: string;
  cpf: string;
  email: string | null;
  phoneHome: string | null;
  phoneMobile: string | null;
  type: 'afiliado' | 'convidado' | 'dependente_maior';
  status: 'ativo' | 'inadimplente' | 'suspenso' | 'cancelado';
  workplaceId: string | null;
  admissionDate: string | null;
  createdAt: string;
}

interface MembersApiResponse {
  data: Member[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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
  const { tenantId } = useTenant();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>('all');
  const [typeFilter, setTypeFilter] = useState<string | null>('all');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImportComplete = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    async function fetchMembers() {
      try {
        setLoading(true);
        const params: Record<string, string | number | boolean> = {
          limit: 50,
        };
        if (search) params.search = search;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
        const url = buildApiUrl('/api/members', tenantId, params);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao carregar associados');
        const data: MembersApiResponse = await response.json();
        setMembers(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar');
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, [tenantId, search, statusFilter, typeFilter, refreshKey]);

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.cpf.includes(search) ||
      (member.email?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesType = typeFilter === 'all' || member.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: members.length,
    ativos: members.filter((m) => m.status === 'ativo').length,
    inadimplentes: members.filter((m) => m.status === 'inadimplente').length,
    convidados: members.filter((m) => m.type === 'convidado').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Associados</h1>
          <p className="text-muted-foreground">Gerencie os membros da associação</p>
        </div>
        <div className="flex gap-2">
          <ImportMembersDialog onImportComplete={handleImportComplete} />
          <Link href="/escritorio/associados/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Associado
            </Button>
          </Link>
        </div>
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
            {loading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive">{error}</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">Nenhum associado encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros ou adicionar um novo associado
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => (
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
                        {member.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                        )}
                        {member.phoneMobile && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phoneMobile}
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
