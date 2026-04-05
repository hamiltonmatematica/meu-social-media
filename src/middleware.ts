import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// # PROTEÇÃO MÁXIMA - ContentPlatformCore
// Configuração de segurança em nível de transporte e headers.

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Security Headers (Proteção contra Clickjacking, XSS, etc)
  const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self' *.supabase.co;",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // 2. Bloqueio de Acesso por User-Agent Suspeito (Proteção contra bots básicos)
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousAgents = ['curl', 'python', 'postman', 'insomnia'];
  
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return new NextResponse('Bot request blocked under Maximum Protection Policy', { status: 403 });
  }

  return response;
}

// Configurar as rotas que o middleware deve processar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
