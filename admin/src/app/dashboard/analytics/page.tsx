'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart } from '@/components/charts/bar-chart'

// ── Question metadata ─────────────────────────────────────────────────────────

interface QuestionMeta {
  key: string
  label: string
  maxScore: number
  chapter: string
  isMultiSelect?: boolean
}

const QUESTIONS: QuestionMeta[] = [
  { key: 'q1', label: 'Respiracao Bucal', maxScore: 3, chapter: 'Padrao Respiratorio' },
  { key: 'q2', label: 'Acordar Cansado', maxScore: 3, chapter: 'Padrao Respiratorio' },
  { key: 'q3', label: 'Boca Seca', maxScore: 3, chapter: 'Padrao Respiratorio' },
  { key: 'q4', label: 'Ronco/Apneia', maxScore: 4, chapter: 'Padrao Respiratorio' },
  { key: 'q5', label: 'Desafios Principais', maxScore: 0, chapter: 'Seus Desafios', isMultiSelect: true },
  { key: 'q6', label: 'Padrao ao Notar', maxScore: 4, chapter: 'Sintomas & Sinais' },
  { key: 'q7', label: 'Palpitacoes/Tremores', maxScore: 3, chapter: 'Sintomas & Sinais' },
  { key: 'q8', label: 'Falta de Ar', maxScore: 3, chapter: 'Sintomas & Sinais' },
  { key: 'q9', label: 'Suspiros/Bocejos', maxScore: 3, chapter: 'Sintomas & Sinais' },
  { key: 'q10', label: 'Teste das Maos', maxScore: 3, chapter: 'Consciencia Corporal' },
  { key: 'q11', label: 'Tolerancia CO2', maxScore: 4, chapter: 'Tolerancia ao CO2' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuestionAnalytics {
  question_key: string
  avg_value: number
  response_count: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getColorForScore(avg: number, max: number): string {
  if (max === 0) return '#6B7280' // gray for multi-select
  const ratio = avg / max
  // Low ratio = good (green), high ratio = bad (red)
  if (ratio <= 0.33) return '#16a34a'
  if (ratio <= 0.66) return '#f59e0b'
  return '#dc2626'
}

function getBgColorForScore(avg: number, max: number): string {
  if (max === 0) return 'bg-gray-100'
  const ratio = avg / max
  if (ratio <= 0.33) return 'bg-green-50'
  if (ratio <= 0.66) return 'bg-amber-50'
  return 'bg-red-50'
}

function getBarColorForScore(avg: number, max: number): string {
  if (max === 0) return 'bg-gray-400'
  const ratio = avg / max
  if (ratio <= 0.33) return 'bg-green-500'
  if (ratio <= 0.66) return 'bg-amber-500'
  return 'bg-red-500'
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-100" />
          <div className="h-3 w-24 rounded bg-gray-200" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function QuestionAnalyticsPage() {
  const [data, setData] = useState<QuestionAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/quiz/question-analytics')
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const json = await res.json()
      setData(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Build a map for quick lookup
  const analyticsMap = new Map<string, QuestionAnalytics>()
  data.forEach((d) => analyticsMap.set(d.question_key, d))

  // Data for the bar chart at the bottom (exclude multi-select Q5)
  const barChartData = QUESTIONS
    .filter((q) => !q.isMultiSelect)
    .map((q) => {
      const analytics = analyticsMap.get(q.key)
      return {
        label: q.key.toUpperCase(),
        value: analytics ? Number(Number(analytics.avg_value).toFixed(1)) : 0,
      }
    })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-h2 text-navy-900">Analytics por Pergunta</h1>
        <p className="mt-1 text-body-sm text-gray-500">
          Desempenho detalhado de cada pergunta do quiz
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Question Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(11)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : data.length === 0 && !error ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-3 text-4xl">📊</div>
              <p className="text-sm font-medium text-gray-500">
                Nenhum dado disponivel ainda
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Os analytics aparecerao quando houver respostas no quiz.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUESTIONS.map((q) => {
              const analytics = analyticsMap.get(q.key)
              const avg = analytics ? Number(analytics.avg_value) : 0
              const count = analytics?.response_count ?? 0
              const percentage = q.maxScore > 0 ? (avg / q.maxScore) * 100 : 0
              const color = getColorForScore(avg, q.maxScore)

              return (
                <Card key={q.key} className={`transition-shadow hover:shadow-md ${getBgColorForScore(avg, q.maxScore)}`}>
                  <CardContent className="py-5">
                    {/* Question number and label */}
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-navy-900">
                        {q.key.toUpperCase()} - {q.label}
                      </h3>
                      <span className="text-xs font-medium text-gray-400 bg-white/70 rounded px-2 py-0.5">
                        {q.chapter}
                      </span>
                    </div>

                    {q.isMultiSelect ? (
                      /* Multi-select question — no average, just response count */
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Multi-selecao (sem media)</p>
                        <p className="text-lg font-bold text-navy-900">
                          {count}{' '}
                          <span className="text-sm font-normal text-gray-500">respostas</span>
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Average score */}
                        <div className="mt-3 flex items-baseline gap-2">
                          <span
                            className="text-2xl font-bold"
                            style={{ color }}
                          >
                            {avg.toFixed(1).replace('.', ',')}
                          </span>
                          <span className="text-sm text-gray-500">
                            / {q.maxScore}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2 h-2.5 w-full rounded-full bg-white/80 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getBarColorForScore(avg, q.maxScore)}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>

                        {/* Response count */}
                        <p className="mt-2 text-xs text-gray-500">
                          {count} {count === 1 ? 'resposta' : 'respostas'}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Bar Chart comparison at the bottom */}
          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Medias por Pergunta</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={barChartData} height={320} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
