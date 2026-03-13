'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, getProfileLabel } from '@/lib/utils'
import type { QuizProfile } from '@/lib/types/database'

interface ResponseItem {
  id: string
  total_score: number
  profile: QuizProfile
  created_at: string
  quiz_leads: { id: string; name: string; email: string; phone: string | null }
}

const profileBadgeVariant: Record<QuizProfile, 'success' | 'warning' | 'danger' | 'info'> = {
  funcional: 'success',
  atencao_moderada: 'warning',
  disfuncao: 'danger',
  disfuncao_severa: 'danger',
}

export default function ResponsesPage() {
  const [responses, setResponses] = useState<ResponseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [profileFilter, setProfileFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchResponses = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString(), limit: '20' })
    if (search) params.set('search', search)
    if (profileFilter) params.set('profile', profileFilter)

    try {
      const res = await fetch(`/api/quiz/responses?${params}`)
      const json = await res.json()
      setResponses(json.data || [])
      setTotalPages(json.pagination?.totalPages || 1)
    } catch (err) {
      console.error('Error fetching responses:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, profileFilter])

  useEffect(() => {
    fetchResponses()
  }, [fetchResponses])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Respostas do Quiz</h1>
        <p className="text-gray-500 mt-1">Todas as respostas dos seus leads</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            value={profileFilter}
            onChange={(e) => { setProfileFilter(e.target.value); setPage(1) }}
          >
            <option value="">Todos os perfis</option>
            <option value="funcional">Funcional</option>
            <option value="atencao_moderada">Atenção Moderada</option>
            <option value="disfuncao">Disfunção</option>
            <option value="disfuncao_severa">Disfunção Severa</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Telefone</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Score</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Perfil</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Data</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">Carregando...</td>
                </tr>
              ) : responses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">Nenhuma resposta encontrada</td>
                </tr>
              ) : (
                responses.map((r) => {
                  const lead = r.quiz_leads as unknown as { id: string; name: string; email: string; phone: string | null }
                  return (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{lead?.name}</td>
                      <td className="py-3 px-4 text-gray-600">{lead?.email}</td>
                      <td className="py-3 px-4 text-gray-600">{lead?.phone || '—'}</td>
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
                        <Link href={`/dashboard/responses/${r.id}`}>
                          <Button variant="ghost" size="sm">Ver</Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
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
      </Card>
    </div>
  )
}
