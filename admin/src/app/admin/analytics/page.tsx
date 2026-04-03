'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart } from '@/components/charts/line-chart'
import { DonutChart } from '@/components/charts/donut-chart'
import { BarChart } from '@/components/charts/bar-chart'

// ── Types ──────────────────────────────────────────────────────────────────────

interface KPIs {
  total_instructors: number
  active_instructors: number
  total_responses: number
  previous_responses: number
  total_leads: number
  previous_leads: number
  avg_score: number
}

interface DailyResponse {
  date: string
  count: number
}

interface ScoreBucket {
  label: string
  value: number
}

interface ProfileBucket {
  profile: string
  count: number
}

interface InstructorRanking {
  instructor_id: string
  name: string
  email: string
  total_responses: number
  total_leads: number
  avg_score: number
}

interface AnalyticsData {
  kpis: KPIs | null
  dailyResponses: DailyResponse[]
  scoreDistribution: ScoreBucket[]
  profileDistribution: ProfileBucket[]
  instructorRankings: InstructorRanking[]
  errors?: string[]
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PERIODS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
  { value: 365, label: '1a' },
] as const

const PROFILE_COLORS: Record<string, string> = {
  funcional: '#16a34a',
  atencao_moderada: '#f59e0b',
  disfuncao: '#f97316',
  disfuncao_severa: '#dc2626',
}

const PROFILE_LABELS: Record<string, string> = {
  funcional: 'Funcional',
  atencao_moderada: 'Atenção Moderada',
  disfuncao: 'Disfunção',
  disfuncao_severa: 'Disfunção Severa',
}

const fmt = (n: number) => n.toLocaleString('pt-BR')

// ── Skeleton helpers ───────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-7 w-16 rounded bg-gray-200" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="py-5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="h-[260px] w-full rounded bg-gray-100" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Growth badge ───────────────────────────────────────────────────────────────

function GrowthBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null
  const pct = previous === 0 ? 100 : ((current - previous) / previous) * 100
  const isPositive = pct >= 0

  return (
    <span
      className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
        isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {isPositive ? '+' : ''}
      {pct.toFixed(1)}%
    </span>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`)
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const json: AnalyticsData = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  const kpis = data?.kpis

  // Transform profile distribution for DonutChart
  const donutData = (data?.profileDistribution ?? []).map((p) => ({
    name: PROFILE_LABELS[p.profile] ?? p.profile,
    value: p.count,
    color: PROFILE_COLORS[p.profile] ?? '#94a3b8',
  }))

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-h2 text-navy-900">Analytics da Plataforma</h1>
          <p className="mt-1 text-body-sm text-gray-500">
            Visão detalhada do desempenho da plataforma
          </p>
        </div>

        {/* Period selector */}
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-navy-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            {/* Instrutores ativos */}
            <Card>
              <CardContent className="py-5">
                <p className="text-body-sm text-gray-500">Total Instrutores</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">
                  {fmt(kpis?.active_instructors ?? 0)}
                </p>
                <p className="mt-0.5 text-caption text-gray-400">ativos</p>
              </CardContent>
            </Card>

            {/* Respostas */}
            <Card>
              <CardContent className="py-5">
                <p className="text-body-sm text-gray-500">Total Respostas</p>
                <div className="mt-1 flex items-baseline">
                  <span className="text-2xl font-bold text-navy-900">
                    {fmt(kpis?.total_responses ?? 0)}
                  </span>
                  <GrowthBadge
                    current={kpis?.total_responses ?? 0}
                    previous={kpis?.previous_responses ?? 0}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Leads */}
            <Card>
              <CardContent className="py-5">
                <p className="text-body-sm text-gray-500">Total Leads</p>
                <div className="mt-1 flex items-baseline">
                  <span className="text-2xl font-bold text-navy-900">
                    {fmt(kpis?.total_leads ?? 0)}
                  </span>
                  <GrowthBadge
                    current={kpis?.total_leads ?? 0}
                    previous={kpis?.previous_leads ?? 0}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Score Medio */}
            <Card>
              <CardContent className="py-5">
                <p className="text-body-sm text-gray-500">Score Médio</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">
                  {(kpis?.avg_score ?? 0).toFixed(1).replace('.', ',')}
                </p>
                <p className="mt-0.5 text-caption text-gray-400">de 33 pontos</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Charts Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* Line chart — Respostas ao Longo do Tempo */}
            <Card>
              <CardHeader>
                <CardTitle>Respostas ao Longo do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart data={data?.dailyResponses ?? []} height={280} />
              </CardContent>
            </Card>

            {/* Donut chart — Distribuição de Perfis */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Perfis</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart data={donutData} height={280} />
              </CardContent>
            </Card>

            {/* Bar chart — Distribuição de Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={data?.scoreDistribution ?? []} height={280} />
              </CardContent>
            </Card>

            {/* Table — Top Instrutores */}
            <Card>
              <CardHeader>
                <CardTitle>Top Instrutores</CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.instructorRankings ?? []).length === 0 ? (
                  <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
                    Sem dados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2.5 pr-4 text-left font-medium text-gray-500">#</th>
                          <th className="py-2.5 pr-4 text-left font-medium text-gray-500">Nome</th>
                          <th className="py-2.5 pr-4 text-right font-medium text-gray-500">Respostas</th>
                          <th className="py-2.5 pr-4 text-right font-medium text-gray-500">Leads</th>
                          <th className="py-2.5 text-right font-medium text-gray-500">Score Médio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.instructorRankings.map((inst, idx) => (
                          <tr
                            key={inst.instructor_id}
                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-2.5 pr-4 text-gray-400 font-medium">{idx + 1}</td>
                            <td className="py-2.5 pr-4 font-medium text-gray-900 truncate max-w-[160px]">
                              {inst.name || inst.email}
                            </td>
                            <td className="py-2.5 pr-4 text-right text-gray-700 tabular-nums">
                              {fmt(inst.total_responses)}
                            </td>
                            <td className="py-2.5 pr-4 text-right text-gray-700 tabular-nums">
                              {fmt(inst.total_leads)}
                            </td>
                            <td className="py-2.5 text-right font-semibold text-navy-900 tabular-nums">
                              {inst.avg_score.toFixed(1).replace('.', ',')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
