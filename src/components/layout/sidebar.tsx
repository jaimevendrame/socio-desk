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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  { title: 'Espaços', href: '/escritorio/espacos', icon: <Building className="h-5 w-5" /> },
  { title: 'Financeiro', href: '/escritorio/financeiro', icon: <CreditCard className="h-5 w-5" /> },
];

const adminNav: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Configurações', href: '/admin/config', icon: <Settings className="h-5 w-5" /> },
  { title: 'Equipe', href: '/admin/equipe', icon: <Shield className="h-5 w-5" /> },
  { title: 'Relatórios', href: '/admin/relatorios', icon: <FileText className="h-5 w-5" /> },
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
        'relative flex flex-col border-r bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building className="h-5 w-5" />
            </div>
            <span className="font-semibold">Socio Desk</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
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
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
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

      {/* Footer */}
      <div className="border-t p-4">
        {!collapsed ? (
          <div className="text-xs text-muted-foreground">
            <p>Socio Desk v1.0</p>
            <p className="mt-1">Ambiente de Desenvolvimento</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
