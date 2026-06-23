// Member Dashboard layout
import { ReactNode } from 'react';
import { Sidebar, Header } from '@/components/layout';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar variant="member" />
      <div className="flex flex-1 flex-col">
        <Header title="Dashboard" subtitle="Bem-vindo ao Socio Desk" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
