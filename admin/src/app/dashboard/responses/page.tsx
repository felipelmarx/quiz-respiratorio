'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, formatPhone, getProfileLabel, getWhatsAppUrl, generateCSV } from '@/lib/utils'
import type { QuizProfile } from '@/lib/types/database'

interface ResponseItem {
  id: string
  total_score: number
  profile: QuizProfile
  scores: Record<string, number>
  created_at: string
  quiz_leads: { id: string; name: string; email: string; phone: string | null }
}

type SortField = 'name' | 'total_score' | 'profile' | 'created_at'
type SortDirection = 'asc' | 'desc'

const profileBadgeVariant: Record<QuizProfile, 'success' | 'warning' | 'danger' | 'info'> = {
  funcional: 'success',
  atencao_moderada: 'warning',
  disfuncao: 'danger',
  disfuncao_severa: 'danger',
}

const profileOrder: Record<QuizProfile, number> = {
  funcional: 0,
  atencao_moderada: 1,
  disfuncao: 2,
  disfuncao_severa: 3,
}

const allProfiles: QuizProfile[] = ['funcional', 'atencao_moderada', 'disfuncao', 'disfuncao_severa']

const categoryLabels: Record<string, string> = {
  padrao: 'Padrão Respiratório',
  sintomas: 'Sintomas',
  consciencia: 'Consciência Corporal',
  tolerancia: 'Tolerância ao CO2',
}

const categoryColors: Record<string, string> = {
  padrao: 'bg-blue-500',
  sintomas: 'bg-amber-500',
  consciencia: 'bg-green-500',
  tolerancia: 'bg-purple-500',
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0]
}

function SortArrow({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) return <span className="ml-1 text-gray-300">&uarr;&darr;</span>
  return (
    <span className="ml-1 text-gold-600">
      {direction === 'asc' ? '\u2191' : '\u2193'}
    </span>
  )
}

function ScoreBar({ label, value, max, colorClass }: { label: string; value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex justify-between text-xs text-gray-600 mb-0.5">
        <span>{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${colorClass} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ResponsesPage() {
  const [responses, setResponses] = useState<ResponseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [profileFilter, setProfileFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Date range
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Sort
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Preview
  const [previewId, setPreviewId] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Profile counts (computed from unfiltered meta, or from current data as approximation)
  const [profileCounts, setProfileCounts] = useState<Record<string, number>>({})

  const fetchResponses = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString(), limit: pageSize.toString() })
    if (search) params.set('search', search)
    if (profileFilter) params.set('profile', profileFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)

    try {
      const res = await fetch(`/api/quiz/responses?${params}`)
      const json = await res.json()
      setResponses(json.data || [])
      setTotalPages(json.pagination?.totalPages || 1)
      setTotalCount(json.pagination?.total || 0)
    } catch (err) {
      console.error('Error fetching responses:', err)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, profileFilter, dateFrom, dateTo])

  // Fetch profile counts (without profile filter)
  const fetchProfileCounts = useCallback(async () => {
    const counts: Record<string, number> = {}
    const baseParams = new URLSearchParams({ page: '1', limit: '1' })
    if (search) baseParams.set('search', search)
    if (dateFrom) baseParams.set('dateFrom', dateFrom)
    if (dateTo) baseParams.set('dateTo', dateTo)

    try {
      // Fetch total and per-profile counts in parallel
      const requests = allProfiles.map(async (p) => {
        const params = new URLSearchParams(baseParams)
        params.set('profile', p)
        const res = await fetch(`/api/quiz/responses?${params}`)
        const json = await res.json()
        counts[p] = json.pagination?.total || 0
      })
      await Promise.all(requests)
      setProfileCounts(counts)
    } catch {
      // ignore
    }
  }, [search, dateFrom, dateTo])

  useEffect(() => {
    fetchResponses()
  }, [fetchResponses])

  useEffect(() => {
    fetchProfileCounts()
  }, [fetchProfileCounts])

  // Close preview on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (previewRef.current && !previewRef.current.contains(e.target as Node)) {
        setPreviewId(null)
      }
    }
    if (previewId) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [previewId])

  // Client-side sorting of current page data
  const sortedResponses = useMemo(() => {
    const sorted = [...responses]
    sorted.sort((a, b) => {
      const leadA = a.quiz_leads as unknown as { id: string; name: string; email: string; phone: string | null }
      const leadB = b.quiz_leads as unknown as { id: string; name: string; email: string; phone: string | null }

      let cmp = 0
      switch (sortField) {
        case 'name':
          cmp = (leadA?.name || '').localeCompare(leadB?.name || '', 'pt-BR')
          break
        case 'total_score':
          cmp = a.total_score - b.total_score
          break
        case 'profile':
          cmp = profileOrder[a.profile] - profileOrder[b.profile]
          break
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [responses, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'created_at' ? 'desc' : 'asc')
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.size === sortedResponses.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedResponses.map((r) => r.id)))
    }
  }

  const handleSelectRow = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleExportSelected = () => {
    const selected = sortedResponses.filter((r) => selectedIds.has(r.id))
    if (selected.length === 0) return

    const headers = ['Nome', 'Email', 'Telefone', 'Score', 'Perfil', 'Data']
    const rows = selected.map((r) => {
      const lead = r.quiz_leads as unknown as { id: string; name: string; email: string; phone: string | null }
      return [
        lead?.name || '',
        lead?.email || '',
        lead?.phone ? formatPhone(lead.phone) : '',
        `${r.total_score}/33`,
        getProfileLabel(r.profile),
        formatDate(r.created_at),
      ]
    })

    const csv = generateCSV(headers, rows)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `respostas-quiz-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDatePreset = (preset: 'today' | '7days' | '30days' | 'all') => {
    const today = new Date()
    switch (preset) {
      case 'today':
        setDateFrom(toDateInputValue(today))
        setDateTo(toDateInputValue(today))
        break
      case '7days': {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        setDateFrom(toDateInputValue(d))
        setDateTo(toDateInputValue(today))
        break
      }
      case '30days': {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        setDateFrom(toDateInputValue(d))
        setDateTo(toDateInputValue(today))
        break
      }
      case 'all':
        setDateFrom('')
        setDateTo('')
        break
    }
    setPage(1)
  }

  const previewItem = previewId ? sortedResponses.find((r) => r.id === previewId) : null

  const startIndex = (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, totalCount)

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Respostas do Quiz</h1>
          <p className="text-gray-500 mt-1">Todas as respostas dos seus leads</p>
        </div>
        {selectedIds.size > 0 && (
          <Button variant="primary" size="sm" onClick={handleExportSelected}>
            <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar Selecionados ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="space-y-4">
          {/* Search + Profile select */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <select
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
              value={profileFilter}
              onChange={(e) => { setProfileFilter(e.target.value); setPage(1) }}
            >
              <option value="">Todos os perfis</option>
              <option value="funcional">Funcional</option>
              <option value="atencao_moderada">Atencao Moderada</option>
              <option value="disfuncao">Disfuncao</option>
              <option value="disfuncao_severa">Disfuncao Severa</option>
            </select>
          </div>

          {/* Profile filter badges with counts */}
          <div className="flex flex-wrap gap-2">
            {allProfiles.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setProfileFilter(profileFilter === p ? '' : p)
                  setPage(1)
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                  profileFilter === p
                    ? 'border-navy-300 bg-navy-50 text-navy-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Badge variant={profileBadgeVariant[p]} className="px-0 py-0 bg-transparent">
                  {getProfileLabel(p)}
                </Badge>
                <span className="text-gray-400 font-normal">
                  ({profileCounts[p] ?? '...'})
                </span>
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 whitespace-nowrap">De</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 whitespace-nowrap">Ate</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => handleDatePreset('today')}>Hoje</Button>
              <Button variant="ghost" size="sm" onClick={() => handleDatePreset('7days')}>7 dias</Button>
              <Button variant="ghost" size="sm" onClick={() => handleDatePreset('30days')}>30 dias</Button>
              <Button variant="ghost" size="sm" onClick={() => handleDatePreset('all')}>Todos</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Table + Preview */}
      <div className="flex gap-4 items-start">
        <Card className="flex-1 min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={sortedResponses.length > 0 && selectedIds.size === sortedResponses.length}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-gold-500"
                    />
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700"
                    onClick={() => handleSort('name')}
                  >
                    Nome
                    <SortArrow active={sortField === 'name'} direction={sortDirection} />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Telefone</th>
                  <th
                    className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700"
                    onClick={() => handleSort('total_score')}
                  >
                    Score
                    <SortArrow active={sortField === 'total_score'} direction={sortDirection} />
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700"
                    onClick={() => handleSort('profile')}
                  >
                    Perfil
                    <SortArrow active={sortField === 'profile'} direction={sortDirection} />
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700"
                    onClick={() => handleSort('created_at')}
                  >
                    Data
                    <SortArrow active={sortField === 'created_at'} direction={sortDirection} />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Acao</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">Carregando...</td>
                  </tr>
                ) : sortedResponses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-10 w-10 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium">Nenhuma resposta encontrada</p>
                        <p className="text-xs mt-1">Tente ajustar os filtros de busca</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedResponses.map((r) => {
                    const lead = r.quiz_leads as unknown as { id: string; name: string; email: string; phone: string | null }
                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          previewId === r.id ? 'bg-gold-50/50' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(r.id)}
                            onChange={() => handleSelectRow(r.id)}
                            className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-gold-500"
                          />
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">{lead?.name}</td>
                        <td className="py-3 px-4 text-gray-600">{lead?.email}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {lead?.phone ? (
                            <a href={getWhatsAppUrl(lead.phone)} target="_blank" rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700 inline-flex items-center gap-1">
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              {formatPhone(lead.phone)}
                            </a>
                          ) : '\u2014'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold">{r.total_score}</span>
                          <span className="text-gray-400">/33</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={profileBadgeVariant[r.profile]}>
                            {getProfileLabel(r.profile)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{formatDate(r.created_at)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setPreviewId(previewId === r.id ? null : r.id)
                              }}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-navy-600 transition-colors"
                              title="Visualizar detalhes"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <Link href={`/dashboard/responses/${r.id}`}>
                              <Button variant="ghost" size="sm">Ver</Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-gray-200 pt-4 mt-4 gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {totalCount > 0
                  ? `Mostrando ${startIndex} a ${endIndex} de ${totalCount} respostas`
                  : 'Nenhuma resposta'}
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="h-8 rounded border border-gray-300 bg-white px-2 text-xs focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
              >
                <option value={10}>10 por pagina</option>
                <option value={20}>20 por pagina</option>
                <option value={25}>25 por pagina</option>
                <option value={50}>50 por pagina</option>
              </select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-500">
                  Pagina {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Proximo
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Preview Panel */}
        {previewItem && (
          <div ref={previewRef} className="hidden lg:block w-80 flex-shrink-0 sticky top-4">
            <Card className="border-gold-200 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Detalhes</h3>
                <button
                  onClick={() => setPreviewId(null)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Profile badge */}
              <div className="mb-4">
                <Badge variant={profileBadgeVariant[previewItem.profile]} className="text-sm px-3 py-1">
                  {getProfileLabel(previewItem.profile)}
                </Badge>
                <p className="text-lg font-bold text-gray-900 mt-2">
                  {previewItem.total_score}<span className="text-gray-400 text-sm font-normal">/33 pontos</span>
                </p>
              </div>

              {/* Score breakdown */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Scores por Categoria</p>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <ScoreBar
                    key={key}
                    label={label}
                    value={previewItem.scores?.[key] ?? 0}
                    max={key === 'padrao' ? 13 : key === 'sintomas' ? 13 : key === 'consciencia' ? 3 : 4}
                    colorClass={categoryColors[key]}
                  />
                ))}
              </div>

              {/* Contact info */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Contato</p>
                {(() => {
                  const lead = previewItem.quiz_leads as unknown as { id: string; name: string; email: string; phone: string | null }
                  return (
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-gray-900">{lead?.name}</p>
                      <p className="text-xs text-gray-500">{lead?.email}</p>
                      {lead?.phone && (
                        <a
                          href={getWhatsAppUrl(lead.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          {formatPhone(lead.phone)}
                        </a>
                      )}
                    </div>
                  )
                })()}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <Link href={`/dashboard/responses/${previewItem.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver detalhes completos
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
