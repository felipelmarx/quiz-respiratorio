import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/reset-password',
  '/api/auth/setup',
  '/api/auth/signup',
  '/api/quiz/submit',
  '/api/quiz/instructor',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
}

function isProtectedApiRoute(pathname: string): boolean {
  if (pathname.startsWith('/api/admin/')) return true
  if (pathname === '/api/quiz/stats' || pathname.startsWith('/api/quiz/stats/')) return true
  if (pathname === '/api/quiz/responses' || pathname.startsWith('/api/quiz/responses/')) return true
  if (pathname === '/api/auth/logout' || pathname.startsWith('/api/auth/logout/')) return true
  return false
}

function isProtectedPageRoute(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/dashboard')
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  // Always call getUser() to validate JWT and refresh tokens
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes: allow through regardless of auth state
  if (isPublicRoute(pathname)) {
    return response
  }

  // Protected routes: require valid session
  if (!user) {
    if (isProtectedApiRoute(pathname)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isProtectedPageRoute(pathname)) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
