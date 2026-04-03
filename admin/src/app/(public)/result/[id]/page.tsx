import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

// ── Constants ──────────────────────────────────────────────────────────
const NAVY_900 = '#0A192F'
const GOLD_500 = '#C6A868'

const PROFILE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  funcional: {
    label: 'Padrão Funcional',
    color: '#16a34a',
    description: 'Sua respiração está em bom funcionamento',
  },
  atencao_moderada: {
    label: 'Atenção Moderada',
    color: '#f59e0b',
    description: 'Alguns padrões respiratórios merecem atenção',
  },
  disfuncao: {
    label: 'Disfunção Respiratória',
    color: '#f97316',
    description: 'Padrões inadequados de respiração identificados',
  },
  disfuncao_severa: {
    label: 'Disfunção Severa',
    color: '#dc2626',
    description: 'Atenção urgente aos padrões respiratórios',
  },
}

const CATEGORY_CONFIG = [
  { key: 'padrao', label: 'Padrão Respiratório', max: 13 },
  { key: 'sintomas', label: 'Sintomas Relacionados', max: 13 },
  { key: 'consciencia', label: 'Consciência Respiratória', max: 3 },
  { key: 'tolerancia', label: 'Tolerância ao CO\u2082', max: 4 },
]

// ── Types ──────────────────────────────────────────────────────────────
interface ShareData {
  name: string
  total_score: number
  profile: string
  scores: Record<string, number>
  date: string
}

// ── Helpers ────────────────────────────────────────────────────────────
function getBaseUrl(): string {
  // Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  // Explicit base URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  return 'http://localhost:3000'
}

async function fetchShareData(id: string): Promise<ShareData | null> {
  try {
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}/api/quiz/share/${id}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function getProfileInfo(profile: string) {
  return PROFILE_CONFIG[profile] ?? {
    label: profile,
    color: '#6b7280',
    description: '',
  }
}

// ── Metadata ───────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const data = await fetchShareData(params.id)

  if (!data) {
    return {
      title: 'Resultado não encontrado | IBNR',
    }
  }

  const profileInfo = getProfileInfo(data.profile)

  return {
    title: 'Minha Avaliação Respiratória | IBNR',
    description: `Score: ${data.total_score}/33 — Perfil: ${profileInfo.label}`,
    openGraph: {
      title: 'Minha Avaliação Respiratória | IBNR',
      description: `Score: ${data.total_score}/33 — Perfil: ${profileInfo.label}`,
      type: 'website',
      siteName: 'IBNR — Instituto Brasileiro de Neurociência Respiratória',
    },
    twitter: {
      card: 'summary',
      title: 'Minha Avaliação Respiratória | IBNR',
      description: `Score: ${data.total_score}/33 — Perfil: ${profileInfo.label}`,
    },
    robots: {
      index: false,
      follow: false,
    },
  }
}

// ── Page ───────────────────────────────────────────────────────────────
export default async function ShareResultPage({
  params,
}: {
  params: { id: string }
}) {
  const data = await fetchShareData(params.id)

  if (!data) {
    notFound()
  }

  const profileInfo = getProfileInfo(data.profile)
  const scorePercent = Math.min((data.total_score / 33) * 100, 100)

  // SVG ring calculations
  const ringSize = 160
  const strokeWidth = 10
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - scorePercent / 100)

  return (
    <div
      className="min-h-screen font-body flex flex-col"
      style={{
        background: `linear-gradient(135deg, ${NAVY_900} 0%, #162845 50%, ${NAVY_900} 100%)`,
      }}
    >
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Card header */}
            <div
              className="px-6 pt-8 pb-6 text-center"
              style={{
                background: `linear-gradient(135deg, ${NAVY_900} 0%, #1a2d47 100%)`,
              }}
            >
              {/* IBNR Logo / Name */}
              <p
                className="font-display text-xl font-bold tracking-wider mb-1"
                style={{ color: GOLD_500 }}
              >
                IBNR
              </p>
              <p
                className="text-xs tracking-widest uppercase mb-6"
                style={{ color: 'rgba(198, 168, 104, 0.6)' }}
              >
                Avaliação Respiratória
              </p>

              {/* Student name */}
              <p className="text-gray-300 text-sm mb-6">
                Resultado de{' '}
                <span className="font-semibold text-white">{data.name}</span>
              </p>

              {/* Score ring */}
              <div className="flex justify-center mb-6">
                <div
                  className="relative flex items-center justify-center"
                  style={{ width: ringSize, height: ringSize }}
                >
                  <svg width={ringSize} height={ringSize} className="-rotate-90">
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth={strokeWidth}
                    />
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      fill="none"
                      stroke={profileInfo.color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span
                      className="text-4xl font-bold block"
                      style={{ color: profileInfo.color }}
                    >
                      {data.total_score}
                    </span>
                    <span className="text-gray-400 text-xs">/33 pontos</span>
                  </div>
                </div>
              </div>

              {/* Profile badge */}
              <div className="inline-block">
                <span
                  className="inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: profileInfo.color }}
                >
                  {profileInfo.label}
                </span>
                <p className="text-gray-400 text-xs mt-2 max-w-xs mx-auto">
                  {profileInfo.description}
                </p>
              </div>
            </div>

            {/* Card body — Category breakdown */}
            <div className="px-6 py-6">
              <h3
                className="font-display text-sm font-semibold uppercase tracking-wider mb-4"
                style={{ color: NAVY_900 }}
              >
                Detalhamento por Categoria
              </h3>

              <div className="space-y-3">
                {CATEGORY_CONFIG.map((cat) => {
                  const score = data.scores?.[cat.key] ?? 0
                  const pct = Math.min((score / cat.max) * 100, 100)
                  return (
                    <div key={cat.key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{cat.label}</span>
                        <span
                          className="font-semibold"
                          style={{ color: NAVY_900 }}
                        >
                          {score}/{cat.max}
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: GOLD_500,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Date */}
              <p className="text-gray-400 text-xs mt-6 text-center">
                Avaliação realizada em {formatDate(data.date)}
              </p>
            </div>

            {/* CTA */}
            <div className="px-6 pb-8">
              <a
                href="https://quiz-lac-phi.vercel.app"
                className="block w-full text-center py-3.5 rounded-xl font-semibold text-base transition-colors duration-200"
                style={{
                  backgroundColor: GOLD_500,
                  color: NAVY_900,
                }}
              >
                Faça sua avaliação gratuita
              </a>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-xs mt-6 pb-4">
            Powered by IBNR — Instituto Brasileiro de Neurociência Respiratória
          </p>
        </div>
      </main>
    </div>
  )
}
