import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { quizSubmissionSchema } from '@/lib/validations'

// Allowed origins for CORS (quiz static site)
const ALLOWED_ORIGINS = [
  'https://quiz-lac-phi.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
]

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) })
}

// Anon client for public submissions (respects RLS, unlike admin client)
function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Simple in-memory rate limiter (per IP, 10 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429, headers: corsHeaders }
      )
    }

    const body = await request.json()
    const parsed = quizSubmissionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders }
      )
    }

    const data = parsed.data
    const supabase = createAnonClient()

    // Resolve instructor slug to ID via RPC (SECURITY DEFINER, safe for anon)
    let instructorId: string | null = null
    if (data.instructor_slug) {
      const { data: id } = await supabase.rpc('resolve_instructor_slug', {
        p_slug: data.instructor_slug,
      })
      instructorId = id || null
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
        { status: 500, headers: corsHeaders }
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
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json({ success: true, lead_id: lead.id }, { headers: corsHeaders })
  } catch (error) {
    console.error('Quiz submit error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: corsHeaders }
    )
  }
}
