import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireApiKey, checkRateLimit, rateLimitResponse } from '@/lib/api-key-auth'

export const dynamic = 'force-dynamic'

/**
 * GET — List quiz responses for the API key owner.
 * Query params: ?limit=, ?offset=, ?profile=, ?from=, ?to=
 * Auth: Bearer ibnr_... API key
 * Scope: requires 'read'
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiKey(request, 'read')
    if (!auth.ok) return auth.response

    if (!checkRateLimit(auth.user.key_id)) {
      return rateLimitResponse()
    }

    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20') || 20), 100)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)
    const profile = searchParams.get('profile')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const supabase = createAdminClient()

    let query = supabase
      .from('quiz_responses')
      .select(`
        id,
        answers,
        scores,
        total_score,
        profile,
        created_at,
        quiz_leads!inner (
          id,
          name,
          email,
          phone
        )
      `, { count: 'exact' })
      .eq('instructor_id', auth.user.user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (profile) {
      const validProfiles = ['funcional', 'atencao_moderada', 'disfuncao', 'disfuncao_severa']
      if (validProfiles.includes(profile)) {
        query = query.eq('profile', profile)
      }
    }

    if (from) {
      query = query.gte('created_at', `${from}T00:00:00`)
    }

    if (to) {
      query = query.lte('created_at', `${to}T23:59:59`)
    }

    const { data, count, error } = await query

    if (error) {
      console.error('V1 responses query error:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar respostas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    })
  } catch (error) {
    console.error('V1 responses error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
