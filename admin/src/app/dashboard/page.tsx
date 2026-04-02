import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { PersonalizedLink } from '@/components/dashboard/personalized-link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, getProfileLabel } from '@/lib/utils'
import type { QuizProfile } from '@/lib/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalLeads },
    { count: totalResponses },
    { data: allResponses },
    { data: recentResponses },
  ] = await Promise.all([
    supabase.from('quiz_leads').select('*', { count: 'exact', head: true }),
    supabase.from('quiz_responses').select('*', { count: 'exact', head: true }),
    supabase.from('quiz_responses').select('total_score, profile'),
    supabase.from('quiz_responses')
      .select('id, total_score, profile, created_at, quiz_leads!inner(name, email)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const authUser = await getAuthUser()
  let isInstructor = false
  let instructorSlug: string | null = null

  if (authUser) {
    if (authUser.role === 'instructor') {
      isInstructor = true
      const { data: profile } = await supabase
        .from('users')
        .select('slug')
        .eq('id', authUser.id)
        .single()
      instructorSlug = profile?.slug ?? null
    }
  }

  const quizBaseUrl = process.env.NEXT_PUBLIC_QUIZ_URL
    || (process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/admin\/?$/, '') : '')

  const profileDistribution: Record<QuizProfile, number> = {
    funcional: 0,
    atencao_moderada: 0,
    disfuncao: 0,
    disfuncao_severa: 0,
  }

  let totalScoreSum = 0
  allResponses?.forEach((r) => {
    profileDistribution[r.profile as QuizProfile]++
    totalScoreSum += r.total_score
  })

  const averageScore = allResponses && allResponses.length > 0
    ? totalScoreSum / allResponses.length
    : 0

  const profileBadgeVariant: Record<QuizProfile, 'success' | 'warning' | 'danger' | 'info'> = {
    funcional: 'success',
    atencao_moderada: 'warning',
    disfuncao: 'danger',
    disfuncao_severa: 'danger',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral das respostas do quiz respiratório</p>
      </div>

      {isInstructor && (
        instructorSlug && quizBaseUrl ? (
          <PersonalizedLink slug={instructorSlug} quizBaseUrl={quizBaseUrl} />
        ) : !instructorSlug ? (
          <Card className="mb-6">
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
              Seu link personalizado ainda não está disponível. Peça ao administrador para definir seu slug de perfil.
            </p>
          </Card>
        ) : null
      )}

      <StatsCards
        totalLeads={totalLeads || 0}
        totalResponses={totalResponses || 0}
        averageScore={averageScore}
        profileDistribution={profileDistribution}
      />

      {/* Recent responses */}
      <Card className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Respostas Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Score</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Perfil</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Data</th>
              </tr>
            </thead>
            <tbody>
              {recentResponses?.map((response) => {
                const lead = response.quiz_leads as unknown as { name: string; email: string }
                const profile = response.profile as QuizProfile
                return (
                  <tr key={response.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{lead?.name}</td>
                    <td className="py-3 px-4 text-gray-600">{lead?.email}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{response.total_score}</span>
                      <span className="text-gray-400">/33</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={profileBadgeVariant[profile]}>
                        {getProfileLabel(profile)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{formatDate(response.created_at)}</td>
                  </tr>
                )
              })}
              {!recentResponses?.length && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Nenhuma resposta ainda. Compartilhe o link do quiz!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
