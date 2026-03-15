import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!hasPermission(authUser.role, authUser.permissions, 'view_responses')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20') || 20), 100)
    const profile = searchParams.get('profile')
    const search = searchParams.get('search')
    const offset = (page - 1) * limit

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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (profile) {
      query = query.eq('profile', profile)
    }

    if (search) {
      // Sanitize search to prevent PostgREST filter injection
      const sanitized = search.replace(/[%,.()"'\\]/g, '').trim()
      if (sanitized) {
        query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`, {
          referencedTable: 'quiz_leads',
        })
      }
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Responses query error:', error)
      return NextResponse.json({ error: 'Erro ao buscar respostas' }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Responses error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
