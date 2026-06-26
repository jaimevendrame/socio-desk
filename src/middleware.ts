import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/reservar', '/reservas', '/perfil', '/escritorio', '/admin', '/master'];
const authRoutes = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute || isAuthRoute) {
    // Chamar rota interna Node.js para verificar sessão
    // (Edge Runtime não suporta node:util/types usado por better-auth)
    const sessionUrl = new URL('/api/auth/session-internal', request.url);
    const sessionResponse = await fetch(sessionUrl.toString(), {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    let authenticated = false;
    if (sessionResponse.ok) {
      const data = await sessionResponse.json();
      authenticated = data.authenticated === true;
    }

    if (isProtectedRoute && !authenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAuthRoute && authenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export const config = {
  matcher: [
    '/((?!api/auth/session-internal|api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
