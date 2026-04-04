import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireApiKey, checkRateLimit, rateLimitResponse } from '@/lib/api-key-auth'

export const dynamic = 'force-dynamic'

/**
 * GET — List quiz leads for the API key owner.
 * Query params: ?limit=, ?offset=, ?search=
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
    const search = searchParams.get('search')

    const supabase = createAdminClient()

    let query = supabase
      .from('quiz_leads')
      .select('id, name, email, phone, created_at', { count: 'exact' })
      .eq('instructor_id', auth.user.user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      // Sanitize search to prevent PostgREST filter injection
      const sanitized = search.replace(/[%,.()"'\\]/g, '').trim()
      if (sanitized) {
        query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
      }
    }

    const { data, count, error } = await query

    if (error) {
      console.error('V1 leads query error:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar leads' },
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
    console.error('V1 leads error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
