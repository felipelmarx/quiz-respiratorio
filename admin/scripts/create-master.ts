// Run: cd admin && npx tsx scripts/create-master.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'contato@felipemarx.email',
    password: 'Knoxgale12!',
    email_confirm: true,
  })

  if (authError) {
    console.error('Erro ao criar auth user:', authError.message)
    process.exit(1)
  }

  console.log('Auth user criado:', authData.user.id)

  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    email: 'contato@felipemarx.email',
    name: 'Felipe Marx',
    role: 'master',
    slug: 'felipe-marx',
    is_active: true,
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    console.error('Erro ao criar perfil:', profileError.message)
    process.exit(1)
  }

  console.log('Usuário master criado com sucesso!')
  console.log('Email: contato@felipemarx.email')
  console.log('Role: master')
}

main()
