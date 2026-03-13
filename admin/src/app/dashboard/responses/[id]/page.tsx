import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, getProfileLabel } from '@/lib/utils'
import type { QuizProfile, QuizScores } from '@/lib/types/database'
import Link from 'next/link'

const categoryLabels: Record<keyof QuizScores, { label: string; max: number }> = {
  padrao: { label: 'Padrão Respiratório', max: 12 },
  sintomas: { label: 'Sintomas & Sinais', max: 12 },
  consciencia: { label: 'Consciência Corporal', max: 3 },
  tolerancia: { label: 'Tolerância ao CO₂', max: 6 },
}

const profileBadgeVariant: Record<QuizProfile, 'success' | 'warning' | 'danger' | 'info'> = {
  funcional: 'success',
  atencao_moderada: 'warning',
  disfuncao: 'danger',
  disfuncao_severa: 'danger',
}

export default async function ResponseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: response } = await supabase
    .from('quiz_responses')
    .select(`
      id, answers, scores, total_score, profile, created_at,
      quiz_leads!inner (id, name, email, phone, referral, created_at)
    `)
    .eq('id', id)
    .single()

  if (!response) notFound()

  const lead = response.quiz_leads as unknown as {
    id: string; name: string; email: string; phone: string | null; referral: string | null; created_at: string
  }
  const scores = response.scores as unknown as QuizScores
  const profile = response.profile as QuizProfile
  const answers = response.answers as Record<string, unknown>

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard/responses">
          <Button variant="ghost" size="sm">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
          <p className="text-gray-500">{lead.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card>
          <CardTitle>Informações de Contato</CardTitle>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="text-gray-500">Nome:</span>
              <span className="ml-2 font-medium text-gray-900">{lead.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 font-medium text-gray-900">{lead.email}</span>
            </div>
            {lead.phone && (
              <div>
                <span className="text-gray-500">Telefone:</span>
                <span className="ml-2 font-medium text-gray-900">{lead.phone}</span>
              </div>
            )}
            {lead.referral && (
              <div>
                <span className="text-gray-500">Indicação:</span>
                <span className="ml-2 font-medium text-gray-900">{lead.referral}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Data:</span>
              <span className="ml-2 font-medium text-gray-900">{formatDate(response.created_at)}</span>
            </div>
          </div>
        </Card>

        {/* Score Summary */}
        <Card>
          <CardTitle>Resultado</CardTitle>
          <div className="mt-4 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-50 mb-4">
              <span className="text-3xl font-bold text-emerald-700">{response.total_score}</span>
              <span className="text-sm text-gray-400 ml-0.5">/33</span>
            </div>
            <div>
              <Badge variant={profileBadgeVariant[profile]} className="text-sm px-3 py-1">
                {getProfileLabel(profile)}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardTitle>Scores por Categoria</CardTitle>
          <div className="mt-4 space-y-4">
            {(Object.keys(categoryLabels) as (keyof QuizScores)[]).map((cat) => {
              const score = scores[cat] || 0
              const max = categoryLabels[cat].max
              const pct = Math.round((score / max) * 100)
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{categoryLabels[cat].label}</span>
                    <span className="font-medium">{score}/{max}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct > 66 ? '#dc2626' : pct > 33 ? '#f59e0b' : '#16a34a',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Raw Answers */}
      <Card className="mt-6">
        <CardTitle>Respostas Detalhadas</CardTitle>
        <div className="mt-4">
          <pre className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 overflow-x-auto">
            {JSON.stringify(answers, null, 2)}
          </pre>
        </div>
      </Card>
    </div>
  )
}
