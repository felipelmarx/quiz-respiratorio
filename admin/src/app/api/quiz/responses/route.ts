import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasPermission, parsePermissions } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Permission check
    const { data: userData } = await supabase
      .from('users')
      .select('role, permissions')
      .eq('id', user.id)
      .single()

    if (!userData || !hasPermission(userData.role, parsePermissions(userData.permissions), 'view_responses')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
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
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`, {
        referencedTable: 'quiz_leads',
      })
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
