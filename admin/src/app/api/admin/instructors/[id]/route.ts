import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { permissionsSchema, instructorUpdateSchema } from '@/lib/validations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (authUser.role !== 'master') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const supabase = await createClient()

    const { id } = await params
    const body = await request.json()

    // Try permissions update first (backwards compatible)
    const permsParsed = permissionsSchema.safeParse(body)
    if (permsParsed.success) {
      const { error } = await supabase
        .from('users')
        .update({ permissions: permsParsed.data })
        .eq('id', id)
        .eq('role', 'instructor')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    // Try profile update
    const profileParsed = instructorUpdateSchema.safeParse(body)
    if (!profileParsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: profileParsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    const fields = profileParsed.data
    if (fields.name !== undefined) updateData.name = fields.name
    if (fields.whatsapp !== undefined) updateData.whatsapp = fields.whatsapp
    if (fields.slug !== undefined) updateData.slug = fields.slug
    if (fields.is_active !== undefined) updateData.is_active = fields.is_active
    if (fields.profissao !== undefined) updateData.profissao = fields.profissao
    if (fields.cidade !== undefined) updateData.cidade = fields.cidade
    if (fields.nome_clinica !== undefined) updateData.nome_clinica = fields.nome_clinica

    const { error } = await supabase
      .from('users')
      .update(updateData)
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
