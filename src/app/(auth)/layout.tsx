// Auth layout - Clean layout for login/register pages
import { ReactNode } from 'react';
import Link from 'next/link';
import { Building } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Building className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">Socio Desk</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white">
            Gestão simplificada para associações recreativas
          </h1>
          <p className="text-lg text-white/80">
            Reserve espaços, gerencie associados e acompanhe pagamentos em um único lugar.
          </p>
        </div>

        <div className="text-sm text-white/60">
          © 2026 Socio Desk. Todos os direitos reservados.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">Socio Desk</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
