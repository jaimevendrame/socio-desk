// Admin tenant layout
import { ReactNode } from 'react';
import { Sidebar, Header } from '@/components/layout';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar variant="admin" />
      <div className="flex flex-1 flex-col">
        <Header title="Painel Administrativo" subtitle="Configurações e controle" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
