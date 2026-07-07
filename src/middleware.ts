import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lista de rotas públicas
  const isPublicRoute =
    pathname === '/login' ||
    pathname === '/api/auth' ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/icon-') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.includes('.'); // Arquivos estáticos e chamadas de arquivos públicos

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verifica o cookie de autenticação
  const token = request.cookies.get('tecbull_auth');

  if (!token) {
    // Redireciona para o login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API)
     * - login (login page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)',
  ],
};
