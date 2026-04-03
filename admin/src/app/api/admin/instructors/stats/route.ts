import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await requireAuth({ role: 'admin' })
    if (!auth.ok) return auth.response

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_instructor_stats')

    if (error) {
      console.error('get_instructor_stats error:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar estatísticas' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Instructor stats error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
