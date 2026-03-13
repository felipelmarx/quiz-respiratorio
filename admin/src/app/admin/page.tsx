import { createClient } from '@/lib/supabase/server'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { QuizProfile } from '@/lib/types/database'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: totalLeads },
    { count: totalResponses },
    { data: allResponses },
    { count: totalInstructors },
    { data: instructors },
  ] = await Promise.all([
    supabase.from('quiz_leads').select('*', { count: 'exact', head: true }),
    supabase.from('quiz_responses').select('*', { count: 'exact', head: true }),
    supabase.from('quiz_responses').select('total_score, profile'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'instructor'),
    supabase.from('users').select('id, name, email, is_active, created_at').eq('role', 'instructor').order('created_at', { ascending: false }).limit(5),
  ])

  const profileDistribution: Record<QuizProfile, number> = {
    funcional: 0, atencao_moderada: 0, disfuncao: 0, disfuncao_severa: 0,
  }
  let totalScoreSum = 0
  allResponses?.forEach((r) => {
    profileDistribution[r.profile as QuizProfile]++
    totalScoreSum += r.total_score
  })
  const averageScore = allResponses?.length ? totalScoreSum / allResponses.length : 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Painel Master</h1>
        <p className="text-gray-500 mt-1">Visão global de toda a plataforma</p>
      </div>

      {/* Extra master stat */}
      <div className="mb-6">
        <Card className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center">
            <svg className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total de Instrutores</p>
            <p className="text-2xl font-bold text-gray-900">{totalInstructors || 0}</p>
          </div>
        </Card>
      </div>

      <StatsCards
        totalLeads={totalLeads || 0}
        totalResponses={totalResponses || 0}
        averageScore={averageScore}
        profileDistribution={profileDistribution}
      />

      {/* Recent instructors */}
      <Card className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Instrutores Recentes</CardTitle>
          <Link href="/admin/instructors">
            <Button variant="outline" size="sm">Ver todos</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Desde</th>
              </tr>
            </thead>
            <tbody>
              {instructors?.map((inst) => (
                <tr key={inst.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{inst.name}</td>
                  <td className="py-3 px-4 text-gray-600">{inst.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant={inst.is_active ? 'success' : 'danger'}>
                      {inst.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{formatDate(inst.created_at)}</td>
                </tr>
              ))}
              {!instructors?.length && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Nenhum instrutor cadastrado
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
