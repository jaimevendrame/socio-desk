import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const protectedRoutes = ['/dashboard', '/reservar', '/reservas', '/perfil', '/escritorio', '/admin', '/master'];
const authRoutes = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute || isAuthRoute) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (isProtectedRoute && !session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAuthRoute && session) {
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
    /*
     * Match all request paths except for:
     * - api routes (handled by API handlers)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (public/)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
