import type { Permission, UserPermissions, UserRole } from '@/lib/types/database'
import { DEFAULT_PERMISSIONS } from '@/lib/types/database'

/**
 * Check if a user has a specific permission.
 * Admin users always have all permissions.
 */
export function hasPermission(
  role: UserRole,
  permissions: UserPermissions | null | undefined,
  permission: Permission
): boolean {
  if (role === 'admin') return true
  const perms = permissions ?? DEFAULT_PERMISSIONS
  return perms[permission] === true
}

/**
 * Parse permissions from raw DB value, falling back to defaults.
 */
export function parsePermissions(raw: unknown): UserPermissions {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...DEFAULT_PERMISSIONS, ...(raw as Partial<UserPermissions>) }
  }
  return { ...DEFAULT_PERMISSIONS }
}
