import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await requireAuth({ permission: 'view_dashboard' })
    if (!auth.ok) return auth.response

    const supabase = await createClient()

    const { count: totalLeads } = await supabase
      .from('quiz_leads')
      .select('*', { count: 'exact', head: true })

    const { count: totalResponses } = await supabase
      .from('quiz_responses')
      .select('*', { count: 'exact', head: true })

    const { data: profiles } = await supabase
      .from('quiz_responses')
      .select('profile')

    const profileDistribution = {
      funcional: 0,
      atencao_moderada: 0,
      disfuncao: 0,
      disfuncao_severa: 0,
    }

    profiles?.forEach((r) => {
      profileDistribution[r.profile as keyof typeof profileDistribution]++
    })

    const { data: scores } = await supabase
      .from('quiz_responses')
      .select('total_score')

    let totalScore = 0
    if (scores && scores.length > 0) {
      totalScore = scores.reduce((sum, r) => sum + r.total_score, 0)
    }

    const averageScore = scores && scores.length > 0
      ? Math.round((totalScore / scores.length) * 10) / 10
      : 0

    const { data: recentLeads } = await supabase
      .from('quiz_leads')
      .select('id, name, email, phone, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: dailyResponses } = await supabase
      .from('quiz_responses')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    const responsesPerDay: Record<string, number> = {}
    dailyResponses?.forEach((r) => {
      const day = r.created_at.split('T')[0]
      responsesPerDay[day] = (responsesPerDay[day] || 0) + 1
    })

    return NextResponse.json({
      totalLeads: totalLeads || 0,
      totalResponses: totalResponses || 0,
      averageScore,
      profileDistribution,
      recentLeads: recentLeads || [],
      responsesPerDay,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
