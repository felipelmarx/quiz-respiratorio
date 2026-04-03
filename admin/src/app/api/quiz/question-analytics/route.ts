import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await requireAuth({ permission: 'view_dashboard' })
    if (!auth.ok) return auth.response

    const supabase = await createClient()

    const instructorId = auth.user.role === 'admin' ? null : auth.user.id

    const { data, error } = await supabase.rpc('get_question_analytics', {
      p_instructor_id: instructorId,
    })

    if (error) {
      console.error('Question analytics RPC error:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar analytics por pergunta' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (error) {
    console.error('Question analytics error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
