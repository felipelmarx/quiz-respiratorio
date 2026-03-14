import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Permission } from '@/lib/types/database'

// Map dashboard routes to required permissions
const routePermissions: Record<string, Permission> = {
  '/dashboard': 'view_dashboard',
  '/dashboard/responses': 'view_responses',
  '/dashboard/contacts': 'view_contacts',
  '/dashboard/settings': 'manage_settings',
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Public routes — no auth needed
  if (
    pathname.startsWith('/quiz') ||
    pathname.startsWith('/api/quiz/submit') ||
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return supabaseResponse
  }

  // Not logged in → redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Get user role and permissions from DB
  const { data: userData } = await supabase
    .from('users')
    .select('role, is_active, permissions')
    .eq('id', user.id)
    .single()

  // Inactive user
  if (userData && !userData.is_active) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'inactive')
    return NextResponse.redirect(url)
  }

  // Admin routes — master only
  if (pathname.startsWith('/admin') && userData?.role !== 'master') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Permission-based route blocking (instructors only, masters bypass)
  if (userData?.role === 'instructor' && userData.permissions) {
    const requiredPerm = routePermissions[pathname]
    if (requiredPerm) {
      const perms = typeof userData.permissions === 'object' ? userData.permissions : {}
      const hasAccess = (perms as Record<string, boolean>)[requiredPerm] !== false
      if (!hasAccess) {
        const url = request.nextUrl.clone()
        // Find first accessible route
        const fallback = Object.entries(routePermissions).find(
          ([, perm]) => (perms as Record<string, boolean>)[perm] !== false
        )
        url.pathname = fallback ? fallback[0] : '/dashboard/settings'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
