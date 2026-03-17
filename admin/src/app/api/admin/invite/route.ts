import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function verifyMaster() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (caller?.role !== 'admin') return null

  return user
}

// GET — Fetch current active invite token
export async function GET() {
  try {
    const user = await verifyMaster()
    if (!user) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('invite_tokens')
      .select('token, created_at')
      .eq('is_active', true)
      .limit(1)
      .single()

    return NextResponse.json({ token: data?.token || null, created_at: data?.created_at || null })
  } catch (error) {
    console.error('Get invite token error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST — Generate new invite token (deactivates previous)
export async function POST() {
  try {
    const user = await verifyMaster()
    if (!user) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Deactivate all previous tokens
    await adminClient
      .from('invite_tokens')
      .update({ is_active: false, deactivated_at: new Date().toISOString() })
      .eq('is_active', true)

    // Generate cryptographically secure token
    const token = randomBytes(32).toString('hex')

    const { error } = await adminClient
      .from('invite_tokens')
      .insert({
        token,
        is_active: true,
        created_by: user.id,
      })

    if (error) {
      return NextResponse.json({ error: 'Erro ao gerar token: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Create invite token error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
