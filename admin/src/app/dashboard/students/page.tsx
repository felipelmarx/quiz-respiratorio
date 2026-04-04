'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPhone, getWhatsAppUrl, getProfileLabel } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users, Search, ChevronRight } from 'lucide-react'
import type { QuizProfile } from '@/lib/types/database'

interface Student {
  name: string
  email: string
  phone: string | null
  attempts: number
  latestScore: number
  latestProfile: string
  firstAttempt: string
  lastAttempt: string
}

const profileBadgeVariant: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  funcional: 'success',
  atencao_moderada: 'warning',
  disfuncao: 'danger',
  disfuncao_severa: 'danger',
}

function formatDateShort(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd 'de' MMM, yyyy", { locale: ptBR })
  } catch {
    return dateStr
  }
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [profileFilter, setProfileFilter] = useState('')
  const [sort, setSort] = useState('last_attempt')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString(), limit: '20', sort })
    if (search) params.set('search', search)
    if (profileFilter) params.set('profile', profileFilter)

    try {
      const res = await fetch(`/api/quiz/students?${params}`)
      const json = await res.json()
      setStudents(json.data || [])
      setTotalPages(json.pagination?.totalPages || 1)
      setTotal(json.pagination?.total || 0)
    } catch (err) {
      console.error('Error fetching students:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, profileFilter, sort])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-h2 text-navy-900">Meus Alunos</h1>
          {!loading && (
            <Badge variant="navy" className="text-sm">
              {total} {total === 1 ? 'aluno' : 'alunos'}
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <select
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
              value={profileFilter}
              onChange={(e) => { setProfileFilter(e.target.value); setPage(1) }}
            >
              <option value="">Todos os perfis</option>
              <option value="funcional">Funcional</option>
              <option value="atencao_moderada">Atenção Moderada</option>
              <option value="disfuncao">Disfunção</option>
              <option value="disfuncao_severa">Disfunção Severa</option>
            </select>
            <select
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1) }}
            >
              <option value="last_attempt">Última tentativa</option>
              <option value="name">Nome</option>
              <option value="score">Maior score</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="animate-pulse flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-gray-200" />
                    <div className="h-3 w-48 rounded bg-gray-100" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-gray-200" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-navy-50">
                <Users className="h-8 w-8 text-navy-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Nenhum aluno encontrado</h3>
              <p className="mt-2 max-w-sm text-sm text-gray-500">
                {search || profileFilter
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Compartilhe seu link do quiz para começar a receber respostas dos seus alunos.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Telefone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Perfil</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Tentativas</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Última tentativa</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.email} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-400">{s.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        {s.phone ? (
                          <a
                            href={getWhatsAppUrl(s.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-green-600 hover:text-green-700"
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                            <span>{formatPhone(s.phone)}</span>
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {s.latestProfile ? (
                          <Badge variant={profileBadgeVariant[s.latestProfile] ?? 'default'}>
                            {getProfileLabel(s.latestProfile as QuizProfile)}
                          </Badge>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-navy-900">{s.latestScore}</span>
                        <span className="text-gray-400">/33</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{s.attempts}</td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {formatDateShort(s.lastAttempt)}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/dashboard/students/${encodeURIComponent(s.email)}`}>
                          <Button variant="ghost" size="sm">
                            Ver detalhes
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {students.map((s) => (
              <Link
                key={s.email}
                href={`/dashboard/students/${encodeURIComponent(s.email)}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 truncate">{s.name}</h3>
                          {s.latestProfile && (
                            <Badge
                              variant={profileBadgeVariant[s.latestProfile] ?? 'default'}
                              className="shrink-0"
                            >
                              {getProfileLabel(s.latestProfile as QuizProfile)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{s.email}</p>

                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            <span className="font-semibold text-navy-900">{s.latestScore}</span>/33
                          </span>
                          <span>{s.attempts} {s.attempts === 1 ? 'tentativa' : 'tentativas'}</span>
                          <span>{formatDateShort(s.lastAttempt)}</span>
                        </div>

                        {s.phone && (
                          <div className="mt-2">
                            <span
                              onClick={(e) => {
                                e.preventDefault()
                                window.open(getWhatsAppUrl(s.phone!), '_blank')
                              }}
                              className="inline-flex items-center gap-1 text-xs text-green-600"
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                              {formatPhone(s.phone)}
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  )
}
