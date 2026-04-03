'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LineChart } from '@/components/charts/line-chart'
import { formatPhone, getWhatsAppUrl, getProfileLabel } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Mail, Calendar, TrendingUp, ClipboardList } from 'lucide-react'
import type { QuizProfile } from '@/lib/types/database'

interface StudentResponse {
  id: string
  total_score: number
  profile: string
  scores: Record<string, number>
  created_at: string
}

interface StudentData {
  name: string
  email: string
  phone: string | null
  attempts: number
  latestScore: number
  latestProfile: string
  firstAttempt: string
  lastAttempt: string
  responses: StudentResponse[]
}

const profileColors: Record<string, string> = {
  funcional: '#16a34a',
  atencao_moderada: '#f59e0b',
  disfuncao: '#f97316',
  disfuncao_severa: '#dc2626',
}

const profileBadgeVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  funcional: 'success',
  atencao_moderada: 'warning',
  disfuncao: 'danger',
  disfuncao_severa: 'danger',
}

const profileDescriptions: Record<string, string> = {
  funcional:
    'Padrão respiratório funcional. O aluno apresenta boa mecânica respiratória e consciência corporal adequada.',
  atencao_moderada:
    'Atenção moderada necessária. Alguns padrões disfuncionais foram identificados que merecem acompanhamento.',
  disfuncao:
    'Disfunção respiratória identificada. Padrões inadequados de respiração que podem estar contribuindo para sintomas de ansiedade e estresse.',
  disfuncao_severa:
    'Disfunção respiratória severa. Padrões significativamente comprometidos que requerem intervenção profissional imediata.',
}

const categoryLabels: Record<string, string> = {
  padrao: 'Padrão Respiratório',
  sintomas: 'Sintomas Relacionados',
  consciencia: 'Consciência Respiratória',
  tolerancia: 'Tolerância ao CO₂',
}

const categoryMaxScores: Record<string, number> = {
  padrao: 13,
  sintomas: 13,
  consciencia: 3,
  tolerancia: 4,
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function formatDateFull(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })
  } catch {
    return dateStr
  }
}

function formatDateShort(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR })
  } catch {
    return dateStr
  }
}

export default function StudentDetailPage() {
  const params = useParams()
  const email = decodeURIComponent(params.email as string)
  const [student, setStudent] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudent = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/quiz/students?search=${encodeURIComponent(email)}&limit=100`)
      const json = await res.json()
      const found = (json.data || []).find(
        (s: StudentData) => s.email.toLowerCase() === email.toLowerCase()
      )
      if (found) {
        setStudent(found)
      } else {
        setError('Aluno não encontrado')
      }
    } catch (err) {
      console.error('Error fetching student:', err)
      setError('Erro ao carregar dados do aluno')
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    fetchStudent()
  }, [fetchStudent])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-6">
              <div className="h-40 rounded bg-gray-100 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {error || 'Aluno não encontrado'}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                O aluno com este email não foi encontrado no sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const latestScores = student.responses[0]?.scores || {}
  const chartData = [...student.responses]
    .reverse()
    .map((r) => ({
      date: r.created_at,
      count: r.total_score,
    }))

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/dashboard/students">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Meus Alunos
        </Button>
      </Link>

      {/* Student Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
                style={{
                  backgroundColor:
                    profileColors[student.latestProfile] || '#6b7280',
                }}
              >
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-display text-h2 text-navy-900">{student.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {student.email}
                  </span>
                  {student.phone && (
                    <a
                      href={getWhatsAppUrl(student.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-green-600 hover:text-green-700"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      {formatPhone(student.phone)}
                    </a>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  Primeiro acesso: {formatDateFull(student.firstAttempt)}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              {student.latestProfile && (
                <Badge
                  variant={profileBadgeVariant[student.latestProfile] ?? 'default'}
                  className="text-sm px-3 py-1"
                >
                  {getProfileLabel(student.latestProfile as QuizProfile)}
                </Badge>
              )}
              <div className="text-sm text-gray-500">
                <span className="text-2xl font-bold text-navy-900">{student.latestScore}</span>
                <span className="text-gray-400">/33</span>
                <span className="ml-2">pontos</span>
              </div>
              <span className="text-xs text-gray-400">
                {student.attempts} {student.attempts === 1 ? 'tentativa' : 'tentativas'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Description */}
      {student.latestProfile && profileDescriptions[student.latestProfile] && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: profileColors[student.latestProfile] }}
              />
              <p className="text-sm text-gray-600 leading-relaxed">
                {profileDescriptions[student.latestProfile]}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gold-600" />
            Pontuação por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(categoryLabels).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(categoryLabels).map(([key, label]) => {
                const score = latestScores[key] ?? 0
                const max = categoryMaxScores[key] ?? 1
                const pct = Math.round((score / max) * 100)
                const color =
                  pct <= 33
                    ? '#16a34a'
                    : pct <= 66
                      ? '#f59e0b'
                      : '#dc2626'

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <span className="text-sm text-gray-500">
                        <span className="font-semibold text-navy-900">{score}</span>/{max}
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sem dados de categoria disponíveis.</p>
          )}
        </CardContent>
      </Card>

      {/* Score History Chart */}
      {student.responses.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pontuação</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={chartData} height={280} />
          </CardContent>
        </Card>
      )}

      {/* All Attempts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-gold-600" />
            Todas as Tentativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.responses.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nenhuma resposta registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Perfil</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {student.responses.map((r, idx) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {formatDateShort(r.created_at)}
                        {idx === 0 && (
                          <Badge variant="navy" className="ml-2 text-[10px]">
                            Mais recente
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-navy-900">{r.total_score}</span>
                        <span className="text-gray-400">/33</span>
                      </td>
                      <td className="py-3 px-4">
                        {r.profile ? (
                          <Badge variant={profileBadgeVariant[r.profile] ?? 'default'}>
                            {getProfileLabel(r.profile as QuizProfile)}
                          </Badge>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/dashboard/responses/${r.id}`}>
                          <Button variant="ghost" size="sm">
                            Ver resposta
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
