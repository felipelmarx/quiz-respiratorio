import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// UUID v4 regex
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params

    // Validate UUID format
    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // Fetch quiz_response + linked quiz_lead (name only)
    const { data, error } = await supabase
      .from('quiz_responses')
      .select(`
        id,
        total_score,
        profile,
        scores,
        created_at,
        quiz_leads!inner ( name )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Resultado não encontrado' },
        { status: 404 },
      )
    }

    // Extract first name only (privacy)
    const lead = data.quiz_leads as unknown as { name: string }
    const firstName = lead?.name?.split(' ')[0] ?? 'Participante'

    return NextResponse.json({
      name: firstName,
      total_score: data.total_score,
      profile: data.profile,
      scores: data.scores,
      date: data.created_at,
    })
  } catch (err) {
    console.error('Share API error:', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
