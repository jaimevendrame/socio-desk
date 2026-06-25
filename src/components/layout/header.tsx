'use client';

import { Bell, Search, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme/theme-toggle';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Logout realizado com sucesso');
    router.push('/login');
  };

  const displayName = user?.name || user?.email || 'Usuario';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-sidebar/80 backdrop-blur-sm px-6">
      {/* Title */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="h-9 w-64 pl-9 bg-muted border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-lg text-sm"
          />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-popover p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Notificacoes</h3>
                <Badge className="badge-success text-xs">3 novas</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col gap-1 border-b border-border pb-3">
                  <p className="text-sm text-foreground">Reserva confirmada para amanha</p>
                  <p className="text-xs text-muted-foreground">Quadra A - 14:00</p>
                </div>
                <div className="flex flex-col gap-1 border-b border-border pb-3">
                  <p className="text-sm text-foreground">Mensalidade em atraso</p>
                  <p className="text-xs text-muted-foreground">Venceu ha 3 dias</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-foreground">Nova mensagem do escritorio</p>
                  <p className="text-xs text-muted-foreground">2 horas atras</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                {displayName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start md:flex">
              <span className="text-sm font-medium text-foreground">{displayName}</span>
              <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground border-0">
                Membro
              </Badge>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-popover p-2 shadow-lg">
              <div className="px-1.5 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/perfil"
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  Meu Perfil
                </Link>
              </div>
              <div className="border-t border-border pt-1">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-1.5 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
