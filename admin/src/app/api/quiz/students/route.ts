import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth({ permission: 'view_contacts' })
    if (!auth.ok) return auth.response

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20') || 20), 100)
    const search = searchParams.get('search')
    const profile = searchParams.get('profile')
    const sort = searchParams.get('sort') || 'last_attempt'
    const offset = (page - 1) * limit

    // Fetch all leads with their responses for the authenticated instructor
    // RLS ensures we only see our own data
    let leadsQuery = supabase
      .from('quiz_leads')
      .select(`
        id,
        name,
        email,
        phone,
        created_at,
        quiz_responses (
          id,
          total_score,
          profile,
          scores,
          created_at
        )
      `)

    if (search) {
      const sanitized = search.replace(/[%,.()"'\\]/g, '').trim()
      if (sanitized) {
        leadsQuery = leadsQuery.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
      }
    }

    const { data: leads, error } = await leadsQuery

    if (error) {
      console.error('Students query error:', error)
      return NextResponse.json({ error: 'Erro ao buscar alunos' }, { status: 500 })
    }

    // Group by email to consolidate same person across multiple leads
    const grouped = new Map<string, {
      name: string
      email: string
      phone: string | null
      attempts: number
      latestScore: number
      latestProfile: string
      firstAttempt: string
      lastAttempt: string
      responses: Array<{
        id: string
        total_score: number
        profile: string
        scores: Record<string, number>
        created_at: string
      }>
    }>()

    for (const lead of leads || []) {
      const email = lead.email.toLowerCase()
      const existing = grouped.get(email)
      const responses = (lead.quiz_responses || []) as Array<{
        id: string
        total_score: number
        profile: string
        scores: Record<string, number>
        created_at: string
      }>

      if (!existing) {
        const sorted = [...responses].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        const latest = sorted[0]
        const oldest = sorted[sorted.length - 1]

        grouped.set(email, {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          attempts: responses.length,
          latestScore: latest?.total_score ?? 0,
          latestProfile: latest?.profile ?? '',
          firstAttempt: oldest?.created_at ?? lead.created_at,
          lastAttempt: latest?.created_at ?? lead.created_at,
          responses: sorted,
        })
      } else {
        // Merge responses from duplicate leads with same email
        existing.responses.push(...responses)
        existing.responses.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        existing.attempts = existing.responses.length
        if (!existing.phone && lead.phone) existing.phone = lead.phone

        const latest = existing.responses[0]
        const oldest = existing.responses[existing.responses.length - 1]
        if (latest) {
          existing.latestScore = latest.total_score
          existing.latestProfile = latest.profile
          existing.lastAttempt = latest.created_at
        }
        if (oldest) {
          existing.firstAttempt = oldest.created_at
        }
      }
    }

    let students = Array.from(grouped.values())

    // Filter by profile
    if (profile) {
      students = students.filter((s) => s.latestProfile === profile)
    }

    // Sort
    switch (sort) {
      case 'name':
        students.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        break
      case 'score':
        students.sort((a, b) => b.latestScore - a.latestScore)
        break
      case 'last_attempt':
      default:
        students.sort(
          (a, b) => new Date(b.lastAttempt).getTime() - new Date(a.lastAttempt).getTime()
        )
        break
    }

    const total = students.length
    const paginated = students.slice(offset, offset + limit)

    return NextResponse.json({
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Students error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
