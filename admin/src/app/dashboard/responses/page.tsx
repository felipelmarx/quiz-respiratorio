'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, formatPhone, getProfileLabel, getWhatsAppUrl } from '@/lib/utils'
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
                      <td className="py-3 px-4 text-gray-600">
                        {lead?.phone ? (
                          <a href={getWhatsAppUrl(lead.phone)} target="_blank" rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700 inline-flex items-center gap-1">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            {formatPhone(lead.phone)}
                          </a>
                        ) : '—'}
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
