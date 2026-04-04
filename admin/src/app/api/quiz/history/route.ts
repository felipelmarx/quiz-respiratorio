import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

// Rate limiter: 5 requests per minute per email
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60_000

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

// Clean up stale entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  })
}, 5 * 60_000)

const historyRequestSchema = z.object({
  email: z.string().email('Email inválido').max(255).trim().toLowerCase(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = historyRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    // Rate limit by email
    if (isRateLimited(email)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 }
      )
    }

    const supabase = createAdminClient()

    // Find all leads with this email
    const { data: leads, error: leadsError } = await supabase
      .from('quiz_leads')
      .select('id, name, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })

    if (leadsError) {
      console.error('Leads query error:', leadsError)
      return NextResponse.json(
        { error: 'Erro ao buscar resultados' },
        { status: 500 }
      )
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ results: [], name: null })
    }

    const leadIds = leads.map((l) => l.id)
    const studentName = leads[0].name // Most recent lead name

    // Get all responses for those leads
    const { data: responses, error: responsesError } = await supabase
      .from('quiz_responses')
      .select('lead_id, scores, total_score, profile, created_at')
      .in('lead_id', leadIds)
      .order('created_at', { ascending: false })

    if (responsesError) {
      console.error('Responses query error:', responsesError)
      return NextResponse.json(
        { error: 'Erro ao buscar resultados' },
        { status: 500 }
      )
    }

    // Map responses — don't expose internal IDs
    const results = (responses || []).map((r) => ({
      date: r.created_at,
      total_score: r.total_score,
      profile: r.profile,
      scores: r.scores,
    }))

    return NextResponse.json({ results, name: studentName })
  } catch (error) {
    console.error('Quiz history error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
