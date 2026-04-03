'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart } from '@/components/charts/line-chart'
import { DonutChart } from '@/components/charts/donut-chart'
import { BarChart } from '@/components/charts/bar-chart'
import { PersonalizedLink } from '@/components/dashboard/personalized-link'
import { Onboarding } from '@/components/dashboard/onboarding'
import { formatDate, getProfileLabel } from '@/lib/utils'
import type { QuizProfile } from '@/lib/types/database'

// ── Types ──────────────────────────────────────────────────────────────────────

interface KPIs {
  total_instructors: number
  total_responses: number
  total_leads: number
  avg_score: number
  responses_current_period: number
  responses_previous_period: number
  growth_percentage: number
}

interface DailyResponse {
  date: string
  count: number
}

interface ScoreBucket {
  score_bucket: string
  count: number
}

interface ProfileBucket {
  profile: string
  count: number
  percentage: number
}

interface AnalyticsData {
  kpis: KPIs | null
  dailyResponses: DailyResponse[]
  scoreDistribution: ScoreBucket[]
  profileDistribution: ProfileBucket[]
  errors?: string[]
}

interface RecentResponse {
  id: string
  total_score: number
  profile: QuizProfile
  created_at: string
  quiz_leads: { id: string; name: string; email: string; phone: string | null }
}

interface UserInfo {
  role: string
  slug: string | null
  quizBaseUrl: string
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

const profileBadgeVariant: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  funcional: 'success',
  atencao_moderada: 'warning',
  disfuncao: 'danger',
  disfuncao_severa: 'danger',
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

function ChartSkeleton() {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="h-[260px] w-full rounded bg-gray-100" />
        </div>
      </CardContent>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 rounded bg-gray-200" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-32 rounded bg-gray-100" />
              <div className="h-4 w-16 rounded bg-gray-100" />
              <div className="h-4 w-20 rounded bg-gray-100" />
              <div className="h-4 w-24 rounded bg-gray-100" />
            </div>
          ))}
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

export default function DashboardPage() {
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [recentResponses, setRecentResponses] = useState<RecentResponse[]>([])
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [responsesLoading, setResponsesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  // Check onboarding status
  useEffect(() => {
    async function checkOnboarding() {
      try {
        const res = await fetch('/api/auth/onboarding')
        if (res.ok) {
          const data = await res.json()
          setShowOnboarding(!data.completed)
        }
      } catch {
        // If check fails, don't block — show dashboard
      } finally {
        setOnboardingChecked(true)
      }
    }
    checkOnboarding()
  }, [])

  // Fetch user info once
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const json = await res.json()
          setUserInfo({
            role: json.role ?? '',
            slug: json.slug ?? null,
            quizBaseUrl:
              json.quizBaseUrl ??
              (typeof window !== 'undefined'
                ? window.location.origin.replace(/\/admin\/?$/, '')
                : ''),
          })
        }
      } catch {
        // Silently fail — personalized link simply won't show
      }
    }
    fetchUserInfo()
  }, [])

  // Fetch analytics
  const fetchAnalytics = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/quiz/analytics?period=${p}`)
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const json: AnalyticsData = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch recent responses
  const fetchResponses = useCallback(async () => {
    setResponsesLoading(true)
    try {
      const res = await fetch('/api/quiz/responses?limit=5')
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const json = await res.json()
      setRecentResponses(json.data ?? [])
    } catch {
      // Non-critical — just leave empty
      setRecentResponses([])
    } finally {
      setResponsesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics(period)
  }, [period, fetchAnalytics])

  useEffect(() => {
    fetchResponses()
  }, [fetchResponses])

  const kpis = data?.kpis

  // Determine the dominant profile
  const dominantProfile = (data?.profileDistribution ?? []).reduce<ProfileBucket | null>(
    (max, p) => (!max || p.count > max.count ? p : max),
    null
  )

  // Transform profile distribution for DonutChart
  const donutData = (data?.profileDistribution ?? []).map((p) => ({
    name: PROFILE_LABELS[p.profile] ?? p.profile,
    value: p.count,
    color: PROFILE_COLORS[p.profile] ?? '#94a3b8',
  }))

  // Determine quiz base URL for PersonalizedLink
  const quizBaseUrl =
    userInfo?.quizBaseUrl ||
    (typeof window !== 'undefined'
      ? window.location.origin.replace(/\/admin\/?$/, '')
      : '')

  const isInstructor = userInfo?.role === 'instructor'

  return (
    <div className="space-y-8">
      {/* ── Onboarding Flow ────────────────────────────────────────────────── */}
      {onboardingChecked && showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-h2 text-navy-900">Meu Dashboard</h1>
          <p className="mt-1 text-body-sm text-gray-500">
            Acompanhe o desempenho dos seus quizzes e alunos
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

      {/* ── Personalized Link ──────────────────────────────────────────────── */}
      {isInstructor && (
        userInfo?.slug && quizBaseUrl ? (
          <PersonalizedLink slug={userInfo.slug} quizBaseUrl={quizBaseUrl} />
        ) : !userInfo?.slug ? (
          <Card className="mb-2">
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
              Seu link personalizado ainda não está disponível. Peça ao administrador para definir seu slug de perfil.
            </p>
          </Card>
        ) : null
      )}

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
            {/* Minhas Respostas */}
            <Card>
              <CardContent className="py-5">
                <p className="text-body-sm text-gray-500">Minhas Respostas</p>
                <div className="mt-1 flex items-baseline">
                  <span className="text-2xl font-bold text-navy-900">
                    {fmt(kpis?.total_responses ?? 0)}
                  </span>
                  <GrowthBadge
                    current={kpis?.responses_current_period ?? 0}
                    previous={kpis?.responses_previous_period ?? 0}
                  />
                </div>
                <p className="mt-0.5 text-caption text-gray-400">no período selecionado</p>
              </CardContent>
            </Card>

            {/* Meus Leads */}
            <Card>
              <CardContent className="py-5">
                <p className="text-body-sm text-gray-500">Meus Leads</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">
                  {fmt(kpis?.total_leads ?? 0)}
                </p>
                <p className="mt-0.5 text-caption text-gray-400">contatos capturados</p>
              </CardContent>
            </Card>

            {/* Score Médio */}
            <Card>
              <CardContent className="py-5">
                <p className="text-body-sm text-gray-500">Score Médio dos Meus Alunos</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">
                  {(kpis?.avg_score ?? 0).toFixed(1).replace('.', ',')}
                </p>
                <p className="mt-0.5 text-caption text-gray-400">de 33 pontos</p>
              </CardContent>
            </Card>

            {/* Distribuição Principal */}
            <Card>
              <CardContent className="py-5">
                <p className="text-body-sm text-gray-500">Distribuição Principal</p>
                {dominantProfile ? (
                  <>
                    <p className="mt-1 text-2xl font-bold text-navy-900">
                      {PROFILE_LABELS[dominantProfile.profile] ?? dominantProfile.profile}
                    </p>
                    <p className="mt-0.5 text-caption text-gray-400">
                      {dominantProfile.percentage
                        ? `${Number(dominantProfile.percentage).toFixed(1).replace('.', ',')}%`
                        : `${dominantProfile.count} respostas`}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-lg text-gray-400">Sem dados</p>
                )}
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
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Distribuição de Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={(data?.scoreDistribution ?? []).map((s) => ({
                    label: s.score_bucket,
                    value: Number(s.count),
                  }))}
                  height={280}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Recent Responses Feed ──────────────────────────────────────────── */}
      {responsesLoading ? (
        <TableSkeleton />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Respostas Recentes</CardTitle>
            <Link
              href="/dashboard/responses"
              className="text-sm font-medium text-navy-900 hover:text-gold-600 transition-colors"
            >
              Ver todas &rarr;
            </Link>
          </CardHeader>
          <CardContent>
            {recentResponses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 text-4xl">📋</div>
                <p className="text-sm font-medium text-gray-500">
                  Nenhuma resposta ainda
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Compartilhe seu link do quiz para começar a receber respostas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Nome</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Score</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Perfil</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentResponses.map((response) => {
                      const lead = response.quiz_leads as { id: string; name: string; email: string; phone: string | null }
                      const profile = response.profile as QuizProfile
                      return (
                        <tr
                          key={response.id}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{lead?.name}</div>
                            <div className="text-xs text-gray-400">{lead?.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-navy-900">
                              {response.total_score}
                            </span>
                            <span className="text-gray-400">/33</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={profileBadgeVariant[profile] ?? 'default'}>
                              {getProfileLabel(profile)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                            {formatDate(response.created_at)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
