'use client'

import { useState, useCallback } from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ── Constants ──────────────────────────────────────────────────────────
const NAVY_900 = '#0A192F'
const GOLD_500 = '#C6A868'
const PROFILE_CONFIG: Record<string, { label: string; color: string }> = {
  funcional: { label: 'Funcional', color: '#16a34a' },
  atencao_moderada: { label: 'Atenção Moderada', color: '#f59e0b' },
  disfuncao: { label: 'Disfunção', color: '#f97316' },
  disfuncao_severa: { label: 'Disfunção Severa', color: '#dc2626' },
}

const CATEGORY_CONFIG = [
  { key: 'padrao', label: 'Padrão Respiratório', max: 13 },
  { key: 'sintomas', label: 'Sintomas Relacionados', max: 13 },
  { key: 'consciencia', label: 'Consciência Respiratória', max: 3 },
  { key: 'tolerancia', label: 'Tolerância ao CO\u2082', max: 4 },
]

// ── Types ──────────────────────────────────────────────────────────────
interface QuizResult {
  date: string
  total_score: number
  profile: string
  scores: Record<string, number>
}

interface HistoryResponse {
  results: QuizResult[]
  name: string | null
  error?: string
}

// ── Helpers ────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    })
  } catch {
    return iso
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getProfileInfo(profile: string) {
  return PROFILE_CONFIG[profile] ?? { label: profile, color: '#6b7280' }
}

// ── Score Trend Chart ──────────────────────────────────────────────────
function ScoreTrendChart({ results }: { results: QuizResult[] }) {
  const chartData = [...results]
    .reverse()
    .map((r) => ({
      date: r.date,
      score: r.total_score,
    }))

  return (
    <div className="bg-white rounded-card shadow-card p-6 mb-8">
      <h3
        className="font-display text-lg font-semibold mb-4"
        style={{ color: NAVY_900 }}
      >
        Evolução da Pontuação
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <RechartsLineChart
          data={chartData}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 33]}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div
                  className="rounded-lg px-3 py-2 text-sm shadow-lg"
                  style={{
                    backgroundColor: NAVY_900,
                    border: `1px solid ${GOLD_500}`,
                  }}
                >
                  <p className="text-xs mb-1" style={{ color: GOLD_500 }}>
                    {formatDate(String(label ?? ''))}
                  </p>
                  <p className="font-bold text-white">
                    {Number(payload[0].value ?? 0)}/33 pontos
                  </p>
                </div>
              )
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={NAVY_900}
            strokeWidth={2.5}
            dot={{ fill: GOLD_500, stroke: GOLD_500, r: 5 }}
            activeDot={{
              fill: GOLD_500,
              stroke: NAVY_900,
              strokeWidth: 2,
              r: 7,
            }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Score Ring ──────────────────────────────────────────────────────────
function ScoreRing({
  score,
  max,
  color,
  size = 72,
}: {
  score: number
  max: number
  color: string
  size?: number
}) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(score / max, 1)
  const offset = circumference * (1 - progress)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className="absolute font-bold text-sm"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  )
}

// ── Progress Bar ───────────────────────────────────────────────────────
function CategoryBar({
  label,
  score,
  max,
}: {
  label: string
  score: number
  max: number
}) {
  const pct = Math.min((score / max) * 100, 100)
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 font-body">{label}</span>
        <span className="font-semibold" style={{ color: NAVY_900 }}>
          {score}/{max}
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: GOLD_500 }}
        />
      </div>
    </div>
  )
}

// ── Result Card ────────────────────────────────────────────────────────
function ResultCard({ result, index }: { result: QuizResult; index: number }) {
  const profile = getProfileInfo(result.profile)

  return (
    <div
      className="bg-white rounded-card shadow-card p-6 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm text-gray-500 font-body mb-1">
            {formatDate(result.date)}
          </p>
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: profile.color }}
          >
            {profile.label}
          </span>
        </div>
        <ScoreRing score={result.total_score} max={33} color={profile.color} />
      </div>

      {/* Category breakdown */}
      <div>
        {CATEGORY_CONFIG.map((cat) => (
          <CategoryBar
            key={cat.key}
            label={cat.label}
            score={result.scores?.[cat.key] ?? 0}
            max={cat.max}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function ResultsPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<HistoryResponse | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      const trimmed = email.trim().toLowerCase()
      if (!isValidEmail(trimmed)) {
        setError('Por favor, insira um email válido.')
        return
      }

      setLoading(true)
      try {
        const res = await fetch('/api/quiz/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed }),
        })

        if (res.status === 429) {
          setError('Muitas requisições. Tente novamente em 1 minuto.')
          return
        }

        const json: HistoryResponse = await res.json()

        if (json.error) {
          setError(json.error)
          return
        }

        setData(json)
        setSubmitted(true)
      } catch {
        setError('Erro de conexão. Tente novamente.')
      } finally {
        setLoading(false)
      }
    },
    [email],
  )

  const handleReset = () => {
    setSubmitted(false)
    setData(null)
    setEmail('')
    setError('')
  }

  return (
    <div
      className="min-h-screen font-body"
      style={{
        background: `linear-gradient(135deg, ${NAVY_900} 0%, #162845 50%, ${NAVY_900} 100%)`,
      }}
    >
      {/* Header bar */}
      <header className="py-4 px-6">
        <p
          className="font-display text-lg font-semibold tracking-wide"
          style={{ color: GOLD_500 }}
        >
          iBreathwork
        </p>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16">
        {/* ── Step 1: Email Entry ────────────────────────────── */}
        {!submitted && (
          <div className="animate-fade-in pt-12 sm:pt-20">
            <div className="text-center mb-10">
              <h1
                className="font-display text-3xl sm:text-4xl font-bold mb-3"
                style={{ color: GOLD_500 }}
              >
                Meus Resultados
              </h1>
              <p className="text-gray-300 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                Digite seu email para ver seu histórico de avaliações respiratórias
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="mb-4">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  className="w-full px-4 py-3.5 rounded-xl text-base outline-none transition-all duration-200 border-2 focus:ring-2"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    borderColor: error
                      ? '#dc2626'
                      : 'rgba(198,168,104,0.3)',
                    color: '#fff',
                  }}
                  onFocus={(e) => {
                    if (!error) e.currentTarget.style.borderColor = GOLD_500
                  }}
                  onBlur={(e) => {
                    if (!error)
                      e.currentTarget.style.borderColor = 'rgba(198,168,104,0.3)'
                  }}
                  autoComplete="email"
                  required
                />
                {error && (
                  <p className="text-red-400 text-sm mt-2 animate-fade-in">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 disabled:opacity-60"
                style={{
                  backgroundColor: GOLD_500,
                  color: NAVY_900,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#D1B988'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = GOLD_500
                }}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Buscando...
                  </span>
                ) : (
                  'Buscar Resultados'
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Step 2: Results Display ───────────────────────── */}
        {submitted && data && (
          <div className="pt-8 sm:pt-12 animate-fade-in">
            {/* Back / reset */}
            <button
              onClick={handleReset}
              className="text-sm mb-6 transition-colors flex items-center gap-1"
              style={{ color: GOLD_500 }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Buscar outro email
            </button>

            {data.results.length === 0 ? (
              /* No results */
              <div className="text-center py-20 animate-fade-in">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(198,168,104,0.15)' }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={GOLD_500}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <h2
                  className="font-display text-xl font-semibold mb-2"
                  style={{ color: GOLD_500 }}
                >
                  Nenhum resultado encontrado
                </h2>
                <p className="text-gray-400 max-w-sm mx-auto mb-8">
                  Nenhum resultado encontrado para este email. Que tal fazer o quiz agora?
                </p>
                <a
                  href="/"
                  className="inline-block px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: GOLD_500,
                    color: NAVY_900,
                  }}
                >
                  Fazer o Quiz
                </a>
              </div>
            ) : (
              /* Results found */
              <>
                {/* Summary header */}
                <div
                  className="rounded-card p-6 mb-8"
                  style={{ backgroundColor: 'rgba(198,168,104,0.08)' }}
                >
                  <h2
                    className="font-display text-2xl font-bold mb-1"
                    style={{ color: GOLD_500 }}
                  >
                    {data.name ?? 'Seus Resultados'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {data.results.length}{' '}
                    {data.results.length === 1 ? 'avaliação realizada' : 'avaliações realizadas'}
                  </p>
                </div>

                {/* Score trend chart (only if 2+ results) */}
                {data.results.length >= 2 && (
                  <ScoreTrendChart results={data.results} />
                )}

                {/* Result cards */}
                <div className="space-y-5 mb-10">
                  {data.results.map((result, i) => (
                    <ResultCard key={`${result.date}-${i}`} result={result} index={i} />
                  ))}
                </div>

                {/* CTA */}
                <div className="text-center pb-4">
                  <a
                    href="/"
                    className="inline-block px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-200"
                    style={{
                      backgroundColor: GOLD_500,
                      color: NAVY_900,
                    }}
                  >
                    Refazer o Quiz
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
