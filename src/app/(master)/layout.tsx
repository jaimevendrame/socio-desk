// Master admin layout (global platform admin)
import { ReactNode } from 'react';
import { Sidebar, Header } from '@/components/layout';

export default function MasterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar variant="master" />
      <div className="flex flex-1 flex-col">
        <Header title="Painel Master" subtitle="Administração da plataforma" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
