import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que não precisam de autenticação
const publicRoutes = ['/login', '/register']

// Rotas que precisam de roles específicas
const adminRoutes = ['/approvals']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Permitir acesso a rotas públicas
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Verificar se há token nos cookies
  const token = request.cookies.get('token')?.value

  // IMPORTANTE: Não redirecionar se não há token nos cookies
  // O contexto de autenticação vai verificar localStorage e fazer o redirecionamento se necessário
  // Isso evita o problema de redirecionamento antes da hidratação
  
  return NextResponse.next()
}

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
}