'use client';

import { useState } from 'react';
import { Search, Plus, Building, Clock, Users, DollarSign, MoreHorizontal, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

const mockSpaces = [
  {
    id: '1',
    name: 'Quadra Poliesportiva A',
    description: 'Quadra coberta para futsal, vôlei e basquete',
    category: 'esportivo',
    photoUrl: null,
    openTime: '06:00',
    closeTime: '22:00',
    costAmount: 'R$ 50,00',
    hasCost: true,
    maxAdvanceDays: 30,
    reservationsToday: 3,
    isActive: true,
  },
  {
    id: '2',
    name: 'Quadra de Tênis',
    description: '2 quadras de tênis com iluminação',
    category: 'esportivo',
    photoUrl: null,
    openTime: '06:00',
    closeTime: '22:00',
    costAmount: 'R$ 30,00',
    hasCost: true,
    maxAdvanceDays: 15,
    reservationsToday: 2,
    isActive: true,
  },
  {
    id: '3',
    name: 'Salão de Festas',
    description: 'Salão para eventos com capacidade para 150 pessoas',
    category: 'social',
    photoUrl: null,
    openTime: '08:00',
    closeTime: '23:00',
    costAmount: 'R$ 300,00',
    hasCost: true,
    maxAdvanceDays: 90,
    reservationsToday: 1,
    isActive: true,
  },
  {
    id: '4',
    name: 'Sala de Jogos',
    description: 'Sinuca, pebolim e tavla',
    category: 'social',
    photoUrl: null,
    openTime: '08:00',
    closeTime: '22:00',
    costAmount: null,
    hasCost: false,
    maxAdvanceDays: 7,
    reservationsToday: 5,
    isActive: true,
  },
  {
    id: '5',
    name: 'Churrasqueira 1',
    description: 'Churrasqueira com área verde',
    category: 'social',
    photoUrl: null,
    openTime: '09:00',
    closeTime: '22:00',
    costAmount: 'R$ 80,00',
    hasCost: true,
    maxAdvanceDays: 30,
    reservationsToday: 2,
    isActive: true,
  },
  {
    id: '6',
    name: 'Piscina',
    description: 'Piscina semiolímpica com raia',
    category: 'esportivo',
    photoUrl: null,
    openTime: '06:00',
    closeTime: '20:00',
    costAmount: 'R$ 25,00',
    hasCost: true,
    maxAdvanceDays: 30,
    reservationsToday: 4,
    isActive: false,
  },
];

const categoryColors = {
  esportivo: 'bg-emerald-100 text-emerald-800',
  social: 'bg-purple-100 text-purple-800',
  equipamento: 'bg-amber-100 text-amber-800',
};

const categoryLabels = {
  esportivo: 'Esportivo',
  social: 'Social',
  equipamento: 'Equipamento',
};

export default function SpacesListPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>('all');
  const [statusFilter, setStatusFilter] = useState<string | null>('all');

  const filteredSpaces = mockSpaces.filter((space) => {
    const matchesSearch = space.name.toLowerCase().includes(search.toLowerCase()) ||
      space.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || space.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && space.isActive) ||
      (statusFilter === 'inactive' && !space.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: mockSpaces.length,
    active: mockSpaces.filter((s) => s.isActive).length,
    todayReservations: mockSpaces.reduce((acc, s) => acc + s.reservationsToday, 0),
    categories: [...new Set(mockSpaces.map((s) => s.category))].length,
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
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
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
        {filteredSpaces.map((space) => (
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
                  <Calendar className="h-4 w-4" />
                  <span>Reservas hoje: {space.reservationsToday}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Antecedência máx: {space.maxAdvanceDays} dias</span>
                </div>
                {space.hasCost && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>{space.costAmount}</span>
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
        ))}
      </div>

      {filteredSpaces.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum espaço encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
