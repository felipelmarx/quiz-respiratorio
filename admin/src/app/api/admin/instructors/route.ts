import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { instructorCreateSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify caller is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: caller } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Parse and validate body
    const body = await request.json()
    const parsed = instructorCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const adminClient = createAdminClient()

    // Create auth user
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    })

    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: authError?.message || 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    // Create user profile
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const { error: profileError } = await adminClient
      .from('users')
      .insert({
        id: authUser.user.id,
        email: data.email,
        name: data.name,
        role: 'instructor',
        whatsapp: data.whatsapp || null,
        slug,
        is_active: true,
        profissao: data.profissao || null,
        cidade: data.cidade || null,
        nome_clinica: data.nome_clinica || null,
      })

    if (profileError) {
      // Rollback: delete auth user
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { error: 'Erro ao criar perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: authUser.user.id })
  } catch (error) {
    console.error('Create instructor error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
