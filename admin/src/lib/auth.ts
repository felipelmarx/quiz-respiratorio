import { createClient } from '@/lib/supabase/server'
import type { UserRole, UserPermissions } from '@/lib/types/database'
import { parsePermissions } from '@/lib/permissions'

export interface AuthUser {
  id: string
  role: UserRole
  is_active: boolean
  permissions: UserPermissions
}

/**
 * Get the authenticated user with role, active status, and permissions.
 * Returns null if not authenticated or inactive.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('role, is_active, permissions')
    .eq('id', user.id)
    .single()

  if (!userData || !userData.is_active) return null

  return {
    id: user.id,
    role: userData.role,
    is_active: userData.is_active,
    permissions: parsePermissions(userData.permissions),
  }
}
