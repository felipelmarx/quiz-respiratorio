import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatPhone, getProfileLabel, getWhatsAppUrl } from '@/lib/utils'
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
                <span className="text-gray-500">WhatsApp:</span>
                <a href={getWhatsAppUrl(lead.phone)} target="_blank" rel="noopener noreferrer"
                  className="ml-2 font-medium text-green-600 hover:text-green-700 inline-flex items-center gap-1">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {formatPhone(lead.phone)}
                </a>
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
