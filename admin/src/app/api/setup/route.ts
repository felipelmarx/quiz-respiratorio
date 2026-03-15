import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ONE-TIME setup route to create the master user
// DELETE this file after creating your user
export async function GET() {
  const adminClient = createAdminClient()

  const email = 'contato@felipemarx.email'
  const password = 'Knoxgale12!'
  const name = 'Felipe Marx'

  // Check if user already exists
  const { data: existing } = await adminClient
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    return NextResponse.json({ message: 'Usuário já existe!' })
  }

  // Create auth user
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: authError?.message || 'Erro ao criar usuário' },
      { status: 400 }
    )
  }

  // Create user profile as master
  const { error: profileError } = await adminClient
    .from('users')
    .insert({
      id: authUser.user.id,
      email,
      name,
      role: 'master',
      slug: 'felipe-marx',
      is_active: true,
    })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json(
      { error: 'Erro ao criar perfil: ' + profileError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Usuário master criado com sucesso!',
    email,
    role: 'master',
  })
}
