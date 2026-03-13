import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { quizSubmissionSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = quizSubmissionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const supabase = createAdminClient()

    // Resolve instructor slug to ID
    let instructorId: string | null = null
    if (data.instructor_slug) {
      const { data: instructor } = await supabase
        .from('users')
        .select('id')
        .eq('slug', data.instructor_slug)
        .eq('is_active', true)
        .single()

      instructorId = instructor?.id || null
    }

    // Insert lead
    const { data: lead, error: leadError } = await supabase
      .from('quiz_leads')
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        referral: data.referral || null,
        instructor_id: instructorId,
      })
      .select('id')
      .single()

    if (leadError || !lead) {
      console.error('Lead insert error:', leadError)
      return NextResponse.json(
        { error: 'Erro ao salvar dados de contato' },
        { status: 500 }
      )
    }

    // Insert quiz response
    const { error: responseError } = await supabase
      .from('quiz_responses')
      .insert({
        lead_id: lead.id,
        instructor_id: instructorId,
        answers: data.answers,
        scores: data.scores,
        total_score: data.total_score,
        profile: data.profile,
      })

    if (responseError) {
      console.error('Response insert error:', responseError)
      return NextResponse.json(
        { error: 'Erro ao salvar respostas do quiz' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, lead_id: lead.id })
  } catch (error) {
    console.error('Quiz submit error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
