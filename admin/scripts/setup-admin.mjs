/**
 * Script para diagnosticar e corrigir o login do admin
 *
 * Uso: node scripts/setup-admin.mjs
 *
 * Requer: .env.local com SUPABASE_SERVICE_ROLE_KEY configurado
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer) }))
}

async function main() {
  console.log('\n=== DIAGNÓSTICO DO LOGIN ADMIN ===\n')

  // 1. Check auth users
  console.log('1. Verificando usuários no Supabase Auth...')
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers()

  if (authErr) {
    console.error('   ERRO ao listar usuários auth:', authErr.message)
    process.exit(1)
  }

  const authUsers = authData.users
  console.log(`   Encontrados: ${authUsers.length} usuário(s) no Auth`)
  for (const u of authUsers) {
    console.log(`   - ${u.email} (id: ${u.id}, confirmado: ${!!u.email_confirmed_at})`)
  }

  // 2. Check users table
  console.log('\n2. Verificando tabela "users"...')
  const { data: dbUsers, error: dbErr } = await supabase
    .from('users')
    .select('id, email, name, role, is_active')

  if (dbErr) {
    console.error('   ERRO ao consultar tabela users:', dbErr.message)
    console.log('   Possível causa: tabela "users" não existe ou RLS bloqueando (service_role deveria bypass)')
  } else {
    console.log(`   Encontrados: ${dbUsers.length} usuário(s) na tabela`)
    for (const u of dbUsers) {
      console.log(`   - ${u.email} | role: ${u.role} | ativo: ${u.is_active}`)
    }
  }

  // 3. Check for mismatches
  if (authUsers.length > 0 && dbUsers) {
    const authIds = new Set(authUsers.map(u => u.id))
    const dbIds = new Set(dbUsers.map(u => u.id))

    const inAuthNotDb = authUsers.filter(u => !dbIds.has(u.id))
    const inDbNotAuth = dbUsers.filter(u => !authIds.has(u.id))

    if (inAuthNotDb.length > 0) {
      console.log('\n   ⚠ Usuários no Auth SEM registro na tabela users:')
      for (const u of inAuthNotDb) {
        console.log(`     - ${u.email} (${u.id})`)
      }
      console.log('   ESTE É PROVAVELMENTE O PROBLEMA! O login autentica, mas a query na tabela users falha.')
    }

    if (inDbNotAuth.length > 0) {
      console.log('\n   ⚠ Registros na tabela users SEM usuário no Auth:')
      for (const u of inDbNotAuth) {
        console.log(`     - ${u.email} (${u.id})`)
      }
    }
  }

  // 4. Check for admin
  const admins = (dbUsers || []).filter(u => u.role === 'admin' && u.is_active)
  if (admins.length > 0) {
    console.log(`\n✅ Já existe(m) ${admins.length} admin(s) ativo(s):`)
    for (const a of admins) console.log(`   - ${a.email}`)
    console.log('\nSe não consegue fazer login, o problema pode ser a senha.')

    const reset = await ask('\nDeseja resetar a senha de um admin? (s/n): ')
    if (reset.toLowerCase() === 's') {
      const email = admins.length === 1
        ? admins[0].email
        : await ask(`Qual email? (${admins.map(a => a.email).join(', ')}): `)

      const authUser = authUsers.find(u => u.email === email)
      if (!authUser) {
        console.log('Usuário não encontrado no Auth!')
        process.exit(1)
      }

      const newPassword = await ask('Nova senha (mínimo 6 caracteres): ')
      if (newPassword.length < 6) {
        console.log('Senha muito curta!')
        process.exit(1)
      }

      const { error: updateErr } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: newPassword
      })

      if (updateErr) {
        console.error('Erro ao atualizar senha:', updateErr.message)
      } else {
        console.log(`\n✅ Senha atualizada com sucesso para ${email}!`)
        console.log('Tente fazer login agora.')
      }
    }
    process.exit(0)
  }

  // 5. No admin — create one
  console.log('\n❌ Nenhum admin ativo encontrado. Vamos criar um.\n')

  const email = await ask('Email do admin: ')
  const password = await ask('Senha (mínimo 6 caracteres): ')
  const name = await ask('Nome: ')

  if (!email || password.length < 6 || !name) {
    console.log('Dados inválidos.')
    process.exit(1)
  }

  // Check if auth user already exists with this email
  const existingAuth = authUsers.find(u => u.email === email)
  let userId

  if (existingAuth) {
    console.log(`\nUsuário ${email} já existe no Auth (id: ${existingAuth.id})`)
    userId = existingAuth.id

    // Update password
    const { error: upErr } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true
    })
    if (upErr) {
      console.error('Erro ao atualizar auth user:', upErr.message)
      process.exit(1)
    }
    console.log('Senha atualizada e email confirmado.')
  } else {
    // Create auth user
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (createErr) {
      console.error('Erro ao criar auth user:', createErr.message)
      process.exit(1)
    }
    userId = newUser.user.id
    console.log(`Auth user criado: ${userId}`)
  }

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (existingProfile) {
    // Update to admin
    const { error: upErr } = await supabase
      .from('users')
      .update({ role: 'admin', is_active: true, name })
      .eq('id', userId)

    if (upErr) {
      console.error('Erro ao atualizar perfil:', upErr.message)
      process.exit(1)
    }
    console.log('Perfil existente atualizado para admin.')
  } else {
    // Create profile
    const { error: insertErr } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        role: 'admin',
        is_active: true,
        permissions: {
          view_dashboard: true,
          view_responses: true,
          view_contacts: true,
          export_data: true,
          manage_settings: true
        }
      })

    if (insertErr) {
      console.error('Erro ao criar perfil:', insertErr.message)
      console.log('Detalhes:', JSON.stringify(insertErr))
      process.exit(1)
    }
    console.log('Perfil admin criado na tabela users.')
  }

  console.log(`\n✅ Admin configurado com sucesso!`)
  console.log(`   Email: ${email}`)
  console.log(`   Agora acesse /login e entre com essas credenciais.`)
}

main().catch(e => {
  console.error('Erro inesperado:', e)
  process.exit(1)
})
