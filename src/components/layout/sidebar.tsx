'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  User,
  Users,
  Building,
  CreditCard,
  Settings,
  Shield,
  LayoutDashboard,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const memberNav: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: <Home className="h-5 w-5" /> },
  { title: 'Reservar', href: '/reservar', icon: <Calendar className="h-5 w-5" /> },
  { title: 'Minhas Reservas', href: '/reservas', icon: <Calendar className="h-5 w-5" /> },
  { title: 'Meu Perfil', href: '/perfil', icon: <User className="h-5 w-5" /> },
];

const officeNav: NavItem[] = [
  { title: 'Dashboard', href: '/escritorio', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Reservas', href: '/escritorio/reservas', icon: <Calendar className="h-5 w-5" /> },
  { title: 'Associados', href: '/escritorio/associados', icon: <Users className="h-5 w-5" /> },
  { title: 'Espacos', href: '/escritorio/espacos', icon: <Building className="h-5 w-5" /> },
  { title: 'Financeiro', href: '/escritorio/financeiro', icon: <CreditCard className="h-5 w-5" /> },
];

const adminNav: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Configuracoes', href: '/admin/config', icon: <Settings className="h-5 w-5" /> },
  { title: 'Equipe', href: '/admin/equipe', icon: <Shield className="h-5 w-5" /> },
  { title: 'Relatorios', href: '/admin/relatorios', icon: <FileText className="h-5 w-5" /> },
];

const masterNav: NavItem[] = [
  { title: 'Painel Global', href: '/master', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Tenants', href: '/master/tenants', icon: <Building className="h-5 w-5" /> },
  { title: 'Planos', href: '/master/planos', icon: <CreditCard className="h-5 w-5" /> },
  { title: 'Logs', href: '/master/logs', icon: <FileText className="h-5 w-5" /> },
];

interface SidebarProps {
  variant?: 'member' | 'office' | 'admin' | 'master';
}

export function Sidebar({ variant = 'member' }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems =
    variant === 'office'
      ? officeNav
      : variant === 'admin'
        ? adminNav
        : variant === 'master'
          ? masterNav
          : memberNav;

  return (
    <div
      className={cn(
        'relative flex flex-col bg-sidebar border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/" className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Building className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="font-semibold tracking-tight text-foreground">Socio Desk</span>
          )}
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                {item.icon}
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Settings & Logout */}
      <div className="border-t border-border p-2">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <Settings className="h-5 w-5" />
              <span>Configuracoes</span>
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            <p>Socio Desk v1.0</p>
          </div>
        )}
      </div>

      {/* Collapse button */}
      {collapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border border-border bg-sidebar shadow-sm text-muted-foreground hover:bg-muted"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
