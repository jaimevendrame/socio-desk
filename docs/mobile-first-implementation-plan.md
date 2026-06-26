# Plano de Implementação UI/UX Mobile-First

> ⚠️ **NOTA:** Este documento está parcialmente desatualizado.
>
> - O projeto usa **Tailwind CSS v4** (CSS-first config, não tailwind.config.ts)
> - Sidebar já tem `variant` prop que aceita `'member' | 'office' | 'admin' | 'master'`
> - Dark mode já está implementado (`components/theme/theme-toggle.tsx`)
>
> Verificar `src/components/layout/sidebar.tsx` para a implementação atual.

## Diretrizes Principais

### Público Primário
- Usuários mobile (sócios reservando espaços pelo celular)

### Abordagem
- Mobile-first: Toda tela nova começa pelo layout de celular
- Breakpoints md:/lg: são adaptações secundárias
- Navegação principal por bottom-tab no mobile

### Requisitos Técnicos
- Touch targets mínimos ~44px
- Formulários: um foco por vez, inputs grandes
- Teclado correto (type=email, etc)
- Evitar sidebars fixas que só funcionam no desktop
- Dark mode consistente em TODOS os containers
- Futuro: PWA (manifest + service worker)

---

## Fase 1: Base Mobile-First (2-3 dias)

### 1.1 Configuração Tailwind Mobile-First

> ⚠️ **ATUALIZADO:** O projeto usa **Tailwind v4** que usa CSS-first configuration.
> O arquivo `tailwind.config.ts` foi substituído por `globals.css` com `@theme`.

```css
/* src/app/globals.css — Tailwind v4 CSS-first */
@import "tailwindcss";

@theme {
  /* Breakpoints customizados */
  --breakpoint-mobile: 375px;
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1024px;

  /* Spacing touch */
  --spacing-touch: 44px;

  /* Cores do design system v2 */
  --color-background: #FAFAFA;
  --color-foreground: #18181B;
  --color-primary: #16a34a;
  --color-muted: #71717A;
}
```

**Nota:** A configuração real de Tailwind está em `src/app/globals.css` usando a sintaxe v4 CSS-first.

### 1.2 Hook de Detecção Mobile

```typescript
// src/hooks/use-mobile.ts — ATUALIZADO
import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isTablet };
}
```

### 1.3 Bottom Navigation Component

```typescript
// src/components/layout/mobile-bottom-nav.tsx
'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Calendar, User, Settings, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { title: 'Início', href: '/dashboard', icon: <Home className="h-5 w-5" /> },
  { title: 'Reservar', href: '/reservar', icon: <Calendar className="h-5 w-5" /> },
  { title: 'Minhas Reservas', href: '/reservas', icon: <Calendar className="h-5 w-5" /> },
  { title: 'Perfil', href: '/perfil', icon: <User className="h-5 w-5" /> },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              className={cn(
                'flex flex-col items-center gap-1 h-12 px-3 py-2',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.title}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
```

### 1.4 Layout Mobile-First

```typescript
// src/components/layout/mobile-layout.tsx
'use client';

import { ReactNode } from 'react';
import { MobileBottomNav } from './mobile-bottom-nav';
import { useMobile } from '@/hooks/use-mobile';

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const { isMobile } = useMobile();

  if (!isMobile) return null;

  return (
    <div className="min-h-screen pb-16"> {/* Espaço para bottom nav */}
      {children}
      <MobileBottomNav />
    </div>
  );
}
```

---

## Fase 2: Dark Mode Consistente (1-2 dias)

### 2.1 Auditoria e Melhoria de Tokens
Garantir que todos os containers usam tokens CSS:
- Sidebar: `var(--sidebar)`
- Header: `var(--sidebar)`
- Main: `var(--background)`
- Page wrapper: `var(--background)`

### 2.2 Componentes com Dark Mode
Atualizar todos os componentes para usar tokens:
```css
/* Exemplo de uso consistente */
.sidebar {
  background: var(--sidebar);
  color: var(--sidebar-foreground);
}

.header {
  background: var(--sidebar);
  border-color: var(--sidebar-border);
}

.main-content {
  background: var(--background);
  color: var(--foreground);
}
```

---

## Fase 3: Componentes Mobile (3-4 dias)

### 3.1 Mobile Touchable Component

```typescript
// src/components/ui/mobile-touchable.tsx
'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface MobileTouchableProps extends HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements;
}

export const MobileTouchable = forwardRef<HTMLDivElement, MobileTouchableProps>(
  ({ className, children, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'touch-manipulation active:scale-[0.98] transition-transform',
          className
        )}
        style={{ minHeight: '44px', minWidth: '44px' }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

MobileTouchable.displayName = 'MobileTouchable';
```

### 3.2 Formulários Mobile-Friendly

```typescript
// src/components/forms/mobile-form-wrapper.tsx
'use client';

import { ReactNode } from 'react';
import { useMobile } from '@/hooks/use-mobile';

interface MobileFormWrapperProps {
  children: ReactNode;
  title: string;
}

export function MobileFormWrapper({ children, title }: MobileFormWrapperProps) {
  const { isMobile } = useMobile();

  if (!isMobile) return <>{children}</>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">Preencha os campos abaixo</p>
      </div>
      {children}
    </div>
  );
}
```

### 3.3 Input Mobile Otimizado

```typescript
// src/components/ui/mobile-input.tsx
'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface MobileInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, error, type, ...props }, ref) => {
    const inputType = type === 'email' ? 'email' :
                     type === 'tel' ? 'tel' : 'text';

    return (
      <div className="space-y-2">
        <input
          ref={ref}
          type={inputType}
          className={cn(
            'flex h-12 w-full rounded-md border border-input bg-background px-4 py-3 text-base',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          style={{ fontSize: '16px' }} // Prevent zoom on iOS
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';
```

---

## Fase 4: PWA Foundation (1 dia)

### 4.1 Manifest Configuration

```json
// public/manifest.json
{
  "name": "Socio Desk",
  "short_name": "SocioDesk",
  "description": "Plataforma para gestão de reservas de clubes recreativos",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAFAFA",
  "theme_color": "#16a34a",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 4.2 Service Worker

```typescript
// public/sw.js
const CACHE_NAME = 'socio-desk-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
```

---

## Arquivos a Modificar

### Novos Arquivos:
- `tailwind.config.ts` - Configuração mobile-first (⚠️ v4 usa CSS-first, não este arquivo)
- `src/hooks/use-mobile.ts` - Hook para detectar mobile
- `src/components/layout/mobile-bottom-nav.tsx` - Navegação mobile
- `src/components/ui/mobile-touchable.tsx` - Componente touch-friendly
- `src/components/forms/mobile-form-wrapper.tsx` - Wrapper para formulários
- `src/components/ui/mobile-input.tsx` - Input mobile otimizado
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker

### Arquivos a Atualizar:
- `src/components/layout/sidebar.tsx` - Adaptar para desktop-only ou manter variant
- `src/components/layout/header.tsx` - Remover elementos desktop-only
- `src/app/(dashboard)/*/layout.tsx` - Implementar layout mobile-first
- `src/app/(dashboard)/*/page.tsx` - Adaptar para mobile
- `src/app/layout.tsx` - Adicionar PWA meta tags

---

## Implementação Prioritária

### Sprint 1 (Semana 1-2):
1. Configurar Tailwind mobile-first (usar CSS-first v4)
2. Implementar bottom navigation
3. Adaptar layouts existentes
4. Testar em dispositivos reais

### Sprint 2 (Semana 3-4):
1. Dark mode consistente
2. Formulários mobile-friendly
3. Componentes touch-optimized
4. Performance testing

### Sprint 3 (Semana 5):
1. PWA foundation
2. Offline functionality
3. Final testing e refinamentos

---

## Checklist de Implementação

- [ ] Tailwind configurado para mobile-first (v4 CSS-first)
- [ ] Bottom navigation funcional
- [ ] Sidebar adaptado para desktop-only
- [ ] Formulários com touch targets de 44px
- [ ] Inputs com tamanho mobile (16px)
- [ ] Dark mode em todos os containers
- [ ] Formulários com teclado correto
- [ ] PWA manifest configurado
- [ ] Service worker implementado
- [ ] Testes em dispositivos reais
- [ ] Performance otimizada para mobile

---

## Considerações Finais

Este plano garante:
1. **Experiência mobile-first** - Prioridade total para usuários mobile
2. **Consistência** - Dark mode em todos os containers
3. **Performance** - Componentes otimizados para mobile
4. **Acessibilidade** - Touch targets adequados e navegação intuitiva
5. **Extensibilidade** - Base sólida para futuras implementações PWA

O foco principal é tornar a reserva de espaços uma experiência fluida e intuitiva para sócios que usam o aplicativo pelo celular.
