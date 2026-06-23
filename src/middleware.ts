import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/reservar',
  '/reservas',
  '/perfil',
  '/escritorio',
  '/admin',
  '/master',
];

// Routes only for unauthenticated users (login, register, etc.)
const authRoutes = ['/login', '/register', '/forgot-password'];

// Routes by role
const roleRoutes = {
  member: ['/dashboard', '/reservar', '/reservas', '/perfil'],
  team: ['/escritorio'],
  admin: ['/admin'],
  master: ['/master'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // For now, we'll just do basic route protection
  // TODO: Implement proper session verification with Better Auth
  // In production, this would verify the session cookie

  // If accessing protected route without auth, redirect to login
  if (isProtectedRoute) {
    // TODO: Check actual session
    // For now, we allow access in development
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!isDevelopment) {
      // In production, verify session here
      // const session = await verifySession(request);
      // if (!session) {
      //   return NextResponse.redirect(new URL('/login', request.url));
      // }
    }
  }

  // If accessing auth route while authenticated, redirect to dashboard
  if (isAuthRoute) {
    // TODO: Check actual session
    // const session = await verifySession(request);
    // if (session) {
    //   return NextResponse.redirect(new URL('/dashboard', request.url));
    // }
  }

  // Add security headers
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
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
