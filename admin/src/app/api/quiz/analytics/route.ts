import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const VALID_PERIODS = [7, 30, 90, 365] as const

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const instructorId = auth.user.id

    const { searchParams } = request.nextUrl
    const periodParam = searchParams.get('period')
    const period = periodParam ? parseInt(periodParam, 10) : 30

    if (!VALID_PERIODS.includes(period as (typeof VALID_PERIODS)[number])) {
      return NextResponse.json(
        { error: `Periodo invalido. Use: ${VALID_PERIODS.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    const startDateISO = startDate.toISOString().split('T')[0]
    const endDateISO = endDate.toISOString().split('T')[0]

    const errors: string[] = []

    const [kpisResult, dailyResult, scoreResult, profileResult, rankingsResult] =
      await Promise.all([
        supabase.rpc('get_platform_kpis', { p_period_days: period }),
        supabase.rpc('get_daily_response_counts', {
          p_start_date: startDateISO,
          p_end_date: endDateISO,
          p_instructor_id: instructorId,
        }),
        supabase.rpc('get_score_distribution', { p_instructor_id: instructorId }),
        supabase.rpc('get_profile_distribution', { p_instructor_id: instructorId }),
        supabase.rpc('get_instructor_rankings', { p_limit: 10 }),
      ])

    if (kpisResult.error) errors.push(`kpis: ${kpisResult.error.message}`)
    if (dailyResult.error) errors.push(`dailyResponses: ${dailyResult.error.message}`)
    if (scoreResult.error) errors.push(`scoreDistribution: ${scoreResult.error.message}`)
    if (profileResult.error) errors.push(`profileDistribution: ${profileResult.error.message}`)
    if (rankingsResult.error) errors.push(`instructorRankings: ${rankingsResult.error.message}`)

    return NextResponse.json({
      kpis: kpisResult.data ?? null,
      dailyResponses: dailyResult.data ?? [],
      scoreDistribution: scoreResult.data ?? [],
      profileDistribution: profileResult.data ?? [],
      instructorRankings: rankingsResult.data ?? [],
      ...(errors.length > 0 && { errors }),
    })
  } catch (error) {
    console.error('Instructor analytics error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
