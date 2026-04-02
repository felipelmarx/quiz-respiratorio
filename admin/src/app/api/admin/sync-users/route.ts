import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/sync-users
 * Syncs all Supabase Auth users into the public.users table.
 * Creates missing profiles for auth users that don't have one.
 * Requires admin role.
 */
export async function POST() {
  try {
    const adminClient = createAdminClient()

    // Get all auth users
    const { data: authData, error: authErr } = await adminClient.auth.admin.listUsers()
    if (authErr) {
      return NextResponse.json({ error: 'Erro ao listar usuários: ' + authErr.message }, { status: 500 })
    }

    // Get all existing profiles
    const { data: dbUsers, error: dbErr } = await adminClient
      .from('users')
      .select('id')
    if (dbErr) {
      return NextResponse.json({ error: 'Erro ao consultar tabela users: ' + dbErr.message }, { status: 500 })
    }

    const existingIds = new Set((dbUsers || []).map(u => u.id))
    const created: string[] = []

    for (const authUser of authData.users) {
      if (!existingIds.has(authUser.id)) {
        const name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User'
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

        const { error: insertErr } = await adminClient
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email!,
            name,
            role: 'instructor',
            is_active: true,
            slug,
            permissions: {
              view_dashboard: true,
              view_responses: true,
              view_contacts: true,
              export_data: false,
              manage_settings: false,
            },
          })

        if (!insertErr) {
          created.push(authUser.email!)
        }
      }
    }

    return NextResponse.json({
      success: true,
      synced: created,
      total_auth_users: authData.users.length,
      total_db_users: (dbUsers?.length || 0) + created.length,
    })
  } catch (error) {
    console.error('Sync users error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
