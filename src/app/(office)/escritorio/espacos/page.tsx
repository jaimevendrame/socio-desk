'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Building, Clock, Users, DollarSign, MoreHorizontal, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';

interface Space {
  id: string;
  name: string;
  description: string | null;
  category: 'esportivo' | 'social' | 'equipamento';
  photoUrl: string | null;
  openTime: string;
  closeTime: string;
  costAmount: string | null;
  hasCost: boolean;
  maxAdvanceDays: number;
  isActive: boolean;
  createdAt: string;
}

interface SpacesApiResponse {
  data: Space[];
}

const categoryColors = {
  esportivo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  social: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  equipamento: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
};

const categoryLabels = {
  esportivo: 'Esportivo',
  social: 'Social',
  equipamento: 'Equipamento',
};

export default function SpacesListPage() {
  const { tenantId } = useTenant();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>('all');
  const [statusFilter, setStatusFilter] = useState<string | null>('all');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSpaces() {
      try {
        setLoading(true);
        const url = buildApiUrl('/api/spaces', tenantId);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao carregar espaços');
        const data: SpacesApiResponse = await response.json();
        setSpaces(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar');
      } finally {
        setLoading(false);
      }
    }
    fetchSpaces();
  }, [tenantId]);

  const filteredSpaces = spaces.filter((space) => {
    const matchesSearch = space.name.toLowerCase().includes(search.toLowerCase()) ||
      (space.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === 'all' || space.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && space.isActive) ||
      (statusFilter === 'inactive' && !space.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: spaces.length,
    active: spaces.filter((s) => s.isActive).length,
    todayReservations: 0, // TODO: buscar da API de reservas
    categories: [...new Set(spaces.map((s) => s.category))].length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Espaços</h1>
          <p className="text-muted-foreground">Gerencie os espaços da associação</p>
        </div>
        <Link href="/escritorio/espacos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Espaço
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Espaços</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Espaços Ativos</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reservas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayReservations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categorias</CardTitle>
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
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
                placeholder="Buscar por nome ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="esportivo">Esportivo</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="equipamento">Equipamento</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spaces Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : filteredSpaces.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum espaço encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredSpaces.map((space) => (
            <Card key={space.id} className={!space.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-lg">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Building className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{space.name}</CardTitle>
                      <Badge className={categoryColors[space.category as keyof typeof categoryColors]} variant="secondary">
                        {categoryLabels[space.category as keyof typeof categoryLabels]}
                      </Badge>
                    </div>
                  </div>
                  {!space.isActive && (
                    <Badge variant="destructive">Inativo</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{space.description}</CardDescription>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{space.openTime} - {space.closeTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Antecedência máx: {space.maxAdvanceDays} dias</span>
                  </div>
                  {space.hasCost && space.costAmount && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>R$ {parseFloat(space.costAmount).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/escritorio/espacos/${space.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">Ver Detalhes</Button>
                  </Link>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
