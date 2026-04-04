import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRole, UserPermissions, Permission } from '@/lib/types/database'
import { parsePermissions, hasPermission } from '@/lib/permissions'

export interface AuthUser {
  id: string
  role: UserRole
  is_active: boolean
  permissions: UserPermissions
}

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse }

/**
 * Reusable auth guard for API routes.
 * - No options: requires any authenticated user
 * - role: requires the specified role (admin always passes)
 * - permission: requires the specified permission (admin always passes)
 */
export async function requireAuth(options?: {
  role?: UserRole
  permission?: Permission
}): Promise<AuthResult> {
  const user = await getAuthUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      ),
    }
  }

  if (options?.role && user.role !== options.role && user.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      ),
    }
  }

  if (options?.permission && !hasPermission(user.role, user.permissions, options.permission)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      ),
    }
  }

  return { ok: true, user }
}

/**
 * Get the authenticated user with role, active status, and permissions.
 * Returns null if not authenticated or inactive.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  let { data: userData } = await supabase
    .from('users')
    .select('role, is_active, permissions')
    .eq('id', user.id)
    .single()

  // If user exists in auth but not in users table, auto-create profile
  if (!userData) {
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User'
    await supabase.from('users').insert({
      id: user.id,
      email: user.email!,
      name,
      role: 'instructor',
      is_active: true,
      permissions: {
        view_dashboard: true,
        view_responses: true,
        view_contacts: true,
        export_data: false,
        manage_settings: false,
      },
    })
    const { data: newUserData } = await supabase
      .from('users')
      .select('role, is_active, permissions')
      .eq('id', user.id)
      .single()
    userData = newUserData
  }

  if (!userData || !userData.is_active) return null

  return {
    id: user.id,
    role: userData.role,
    is_active: userData.is_active,
    permissions: parsePermissions(userData.permissions),
  }
}
