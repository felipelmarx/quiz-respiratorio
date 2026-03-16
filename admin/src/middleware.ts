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
    pathname === '/signup' ||
    pathname.startsWith('/api/auth/signup') ||
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
    .select('role, is_active, permissions, license_expires_at')
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

  // License expired → auto-deactivate and block login
  if (
    userData &&
    userData.role === 'instructor' &&
    userData.license_expires_at &&
    new Date(userData.license_expires_at) < new Date()
  ) {
    await supabase.from('users').update({ is_active: false }).eq('id', user.id)
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'license_expired')
    return NextResponse.redirect(url)
  }

  // Admin routes — master only
  if (pathname.startsWith('/admin') && userData?.role !== 'master') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Permission-based route blocking (instructors only, masters bypass)
  if (userData?.role === 'instructor') {
    const requiredPerm = routePermissions[pathname]
    if (requiredPerm) {
      const perms = typeof userData.permissions === 'object' && userData.permissions
        ? (userData.permissions as Record<string, boolean>)
        : {}
      // Default-deny: permission must be explicitly true
      const hasAccess = perms[requiredPerm] === true
      if (!hasAccess) {
        const url = request.nextUrl.clone()
        const fallback = Object.entries(routePermissions).find(
          ([route, perm]) => route !== pathname && perms[perm] === true
        )
        if (fallback) {
          url.pathname = fallback[0]
        } else {
          await supabase.auth.signOut()
          url.pathname = '/login'
          url.searchParams.set('error', 'no_permissions')
        }
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
