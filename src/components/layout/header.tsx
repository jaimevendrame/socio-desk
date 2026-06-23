'use client';

import { Bell, Search, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const user = {
    name: 'João Silva',
    email: 'joao.silva@email.com',
    role: 'Membro',
    image: null as string | null,
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-64 pl-9"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-popover p-4 shadow-lg">
              <h3 className="font-semibold">Notificações</h3>
              <div className="mt-3 space-y-3">
                <div className="flex flex-col gap-1 border-b pb-2">
                  <p className="text-sm">Reserva confirmada para amanhã</p>
                  <p className="text-xs text-muted-foreground">Quadra A - 14:00</p>
                </div>
                <div className="flex flex-col gap-1 border-b pb-2">
                  <p className="text-sm">Mensalidade em atraso</p>
                  <p className="text-xs text-muted-foreground">Venceu há 3 dias</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm">Nova mensagem do escritório</p>
                  <p className="text-xs text-muted-foreground">2 horas atrás</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start md:flex">
              <span className="text-sm font-medium">{user.name}</span>
              <Badge variant="secondary" className="text-xs">
                {user.role}
              </Badge>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border bg-popover p-2 shadow-lg">
              <div className="px-1.5 py-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="my-1 h-px bg-border" />
              <Link
                href="/perfil"
                className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent"
              >
                <UserIcon className="h-4 w-4" />
                Meu Perfil
              </Link>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
