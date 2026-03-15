import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { permissionsSchema } from '@/lib/validations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    if (caller?.role !== 'master') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = permissionsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Permissões inválidas', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('users')
      .update({ permissions: parsed.data })
      .eq('id', id)
      .eq('role', 'instructor')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
