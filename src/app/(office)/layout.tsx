// Office panel layout
import { ReactNode } from 'react';
import { Sidebar, Header } from '@/components/layout';

export default function OfficeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar variant="office" />
      <div className="flex flex-1 flex-col">
        <Header title="Painel do Escritório" subtitle="Gerenciamento interno" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
