'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
// formatDate available from '@/lib/utils' if needed
import { parsePermissions } from '@/lib/permissions'
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  type Permission,
  type UserPermissions,
} from '@/lib/types/database'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Instructor {
  id: string
  name: string
  email: string
  slug: string | null
  whatsapp: string | null
  is_active: boolean
  permissions: UserPermissions
  license_expires_at: string | null
  created_at: string
}

interface InstructorStats {
  instructor_id: string
  name: string
  email: string
  slug: string | null
  response_count: number
  lead_count: number
  avg_score: number | null
  last_response_at: string | null
  last_login_at: string | null
  is_active: boolean
  license_expires_at: string | null
}

type SortField = 'name' | 'email' | 'response_count' | 'lead_count' | 'avg_score' | 'last_response_at' | 'last_login_at' | 'is_active'
type SortDir = 'asc' | 'desc'

function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return '—'
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR })
  } catch {
    return '—'
  }
}

function getLicenseInfo(expiresAt: string | null) {
  if (!expiresAt) return { status: 'none' as const, daysLeft: null, date: null }
  const expiry = new Date(expiresAt)
  const now = new Date()
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const status = daysLeft < 0 ? 'expired' as const : daysLeft <= 30 ? 'expiring' as const : 'active' as const
  return { status, daysLeft, date: expiry }
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [stats, setStats] = useState<InstructorStats[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingPerms, setEditingPerms] = useState<string | null>(null)

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Sorting
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Invite link
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const copiedTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Create form
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newWhatsapp, setNewWhatsapp] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [createError, setCreateError] = useState('')

  const fetchInstructors = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('users')
      .select('id, name, email, slug, whatsapp, is_active, permissions, license_expires_at, created_at')
      .eq('role', 'instructor')
      .order('created_at', { ascending: false })

    setInstructors(
      (data || []).map((inst) => ({
        ...inst,
        permissions: parsePermissions(inst.permissions),
      }))
    )
    setLoading(false)
  }, [])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/admin/instructors/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data || [])
      }
    } catch {
      // Stats are supplementary; fail silently
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchInviteToken = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/invite')
      if (res.ok) {
        const json = await res.json()
        setInviteToken(json.token)
      }
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => { fetchInstructors() }, [fetchInstructors])
  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchInviteToken() }, [fetchInviteToken])

  // Build a stats map for quick lookup
  const statsMap = useMemo(() => {
    const map = new Map<string, InstructorStats>()
    stats.forEach((s) => map.set(s.instructor_id, s))
    return map
  }, [stats])

  // Enriched, filtered, and sorted instructors
  const displayInstructors = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()

    const filtered = instructors.filter((inst) => {
      // Status filter
      if (statusFilter === 'active' && !inst.is_active) return false
      if (statusFilter === 'inactive' && inst.is_active) return false

      // Search filter
      if (query) {
        const matchName = inst.name.toLowerCase().includes(query)
        const matchEmail = inst.email.toLowerCase().includes(query)
        const matchSlug = inst.slug?.toLowerCase().includes(query)
        if (!matchName && !matchEmail && !matchSlug) return false
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      const statsA = statsMap.get(a.id)
      const statsB = statsMap.get(b.id)
      let cmp = 0

      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'pt-BR')
          break
        case 'email':
          cmp = a.email.localeCompare(b.email)
          break
        case 'response_count':
          cmp = (statsA?.response_count ?? 0) - (statsB?.response_count ?? 0)
          break
        case 'lead_count':
          cmp = (statsA?.lead_count ?? 0) - (statsB?.lead_count ?? 0)
          break
        case 'avg_score':
          cmp = (statsA?.avg_score ?? 0) - (statsB?.avg_score ?? 0)
          break
        case 'last_response_at': {
          const da = statsA?.last_response_at ? new Date(statsA.last_response_at).getTime() : 0
          const db = statsB?.last_response_at ? new Date(statsB.last_response_at).getTime() : 0
          cmp = da - db
          break
        }
        case 'last_login_at': {
          const la = statsA?.last_login_at ? new Date(statsA.last_login_at).getTime() : 0
          const lb = statsB?.last_login_at ? new Date(statsB.last_login_at).getTime() : 0
          cmp = la - lb
          break
        }
        case 'is_active':
          cmp = (a.is_active ? 1 : 0) - (b.is_active ? 1 : 0)
          break
      }

      return sortDir === 'asc' ? cmp : -cmp
    })

    return filtered
  }, [instructors, searchQuery, statusFilter, sortField, sortDir, statsMap])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return <span className="ml-1 text-gray-300">&uarr;&darr;</span>
    }
    return <span className="ml-1 text-navy-700">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)

    try {
      const res = await fetch('/api/admin/instructors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          whatsapp: newWhatsapp || undefined,
          slug: newSlug || undefined,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        setCreateError(json.error || 'Erro ao criar instrutor')
        setCreating(false)
        return
      }

      setShowCreate(false)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setNewWhatsapp('')
      setNewSlug('')
      fetchInstructors()
      fetchStats()
    } catch {
      setCreateError('Erro de conexão')
    } finally {
      setCreating(false)
    }
  }

  async function generateInviteLink() {
    if (inviteToken) {
      const confirmed = window.confirm(
        'Ao gerar um novo link, o link atual será desativado e não poderá mais ser usado para cadastro. Deseja continuar?'
      )
      if (!confirmed) return
    }
    setInviteLoading(true)
    try {
      const res = await fetch('/api/admin/invite', { method: 'POST' })
      if (res.ok) {
        const json = await res.json()
        setInviteToken(json.token)
      }
    } catch {
      // Silently fail
    } finally {
      setInviteLoading(false)
    }
  }

  function copyInviteLink() {
    if (!inviteToken) return
    const url = `${window.location.origin}/signup?token=${inviteToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    if (copiedTimeout.current) clearTimeout(copiedTimeout.current)
    copiedTimeout.current = setTimeout(() => setCopied(false), 2000)
  }

  async function toggleActive(id: string, currentActive: boolean) {
    const supabase = createClient()
    await supabase.from('users').update({ is_active: !currentActive }).eq('id', id)
    fetchInstructors()
    fetchStats()
  }

  async function togglePermission(id: string, permission: Permission, currentPerms: UserPermissions) {
    const updated = { ...currentPerms, [permission]: !currentPerms[permission] }
    // Optimistic update
    setInstructors((prev) =>
      prev.map((inst) => inst.id === id ? { ...inst, permissions: updated } : inst)
    )
    const res = await fetch(`/api/admin/instructors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    if (!res.ok) {
      // Revert on failure
      setInstructors((prev) =>
        prev.map((inst) => inst.id === id ? { ...inst, permissions: currentPerms } : inst)
      )
    }
  }

  const isLoading = loading || statsLoading

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instrutores</h1>
          <p className="text-gray-500 mt-1">Gerencie os instrutores da plataforma</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancelar' : '+ Novo Instrutor'}
        </Button>
      </div>

      {/* Invite Link */}
      <Card className="mb-6">
        <CardTitle>Link de Convite</CardTitle>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Compartilhe este link para instrutores se cadastrarem na plataforma.
        </p>
        {inviteToken ? (
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/signup?token=${inviteToken}`}
              className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 font-mono select-all"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button variant="outline" onClick={copyInviteLink}>
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-3">Nenhum link ativo. Gere um abaixo.</p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <Button
            onClick={generateInviteLink}
            loading={inviteLoading}
            variant={inviteToken ? 'outline' : 'primary'}
          >
            {inviteToken ? 'Gerar Novo Link' : 'Gerar Link'}
          </Button>
          {inviteToken && (
            <span className="text-xs text-gray-400">
              Ao gerar um novo link, o anterior será desativado.
            </span>
          )}
        </div>
      </Card>

      {/* Create Form */}
      {showCreate && (
        <Card className="mb-6">
          <CardTitle>Novo Instrutor</CardTitle>
          <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="name" label="Nome" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            <Input id="email" label="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            <Input id="password" label="Senha" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
            <Input id="whatsapp" label="WhatsApp (opcional)" value={newWhatsapp} onChange={(e) => setNewWhatsapp(e.target.value)} placeholder="5511999999999" />
            <Input id="slug" label="Slug do link (opcional)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="dr-felipe" />
            <div className="md:col-span-2">
              {createError && <p className="text-sm text-red-600 mb-2">{createError}</p>}
              <Button type="submit" loading={creating}>Criar Instrutor</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search & Filter Bar */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome, email ou slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`h-10 px-4 text-sm rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-navy-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`h-10 px-4 text-sm rounded-lg font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-navy-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`h-10 px-4 text-sm rounded-lg font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-navy-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Inativos
            </button>
          </div>
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-400 mt-2">
            {displayInstructors.length} instrutor{displayInstructors.length !== 1 ? 'es' : ''} encontrado{displayInstructors.length !== 1 ? 's' : ''}
          </p>
        )}
      </Card>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th
                  className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('name')}
                >
                  Nome / Email<SortIcon field="name" />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Slug</th>
                <th
                  className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('response_count')}
                >
                  Respostas<SortIcon field="response_count" />
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('lead_count')}
                >
                  Leads<SortIcon field="lead_count" />
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('avg_score')}
                >
                  Score Médio<SortIcon field="avg_score" />
                </th>
                <th
                  className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('last_response_at')}
                >
                  Última Atividade<SortIcon field="last_response_at" />
                </th>
                <th
                  className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('last_login_at')}
                >
                  Último Login<SortIcon field="last_login_at" />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Licença</th>
                <th
                  className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('is_active')}
                >
                  Status<SortIcon field="is_active" />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="py-8 text-center text-gray-400">Carregando...</td></tr>
              ) : displayInstructors.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="text-gray-400">
                      <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                      <p className="text-sm font-medium">
                        {searchQuery || statusFilter !== 'all'
                          ? 'Nenhum instrutor encontrado com esses filtros'
                          : 'Nenhum instrutor cadastrado'}
                      </p>
                      {!searchQuery && statusFilter === 'all' && (
                        <p className="text-xs mt-1">Crie um novo instrutor ou compartilhe o link de convite.</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayInstructors.map((inst) => {
                  const instStats = statsMap.get(inst.id)
                  const license = getLicenseInfo(inst.license_expires_at)

                  return (
                    <tr key={inst.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{inst.name}</div>
                        <div className="text-xs text-gray-500">{inst.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        {inst.slug ? (
                          <span className="font-mono text-xs text-navy-700 bg-navy-50 px-2 py-0.5 rounded">
                            /{inst.slug}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {instStats?.response_count ?? 0}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {instStats?.lead_count ?? 0}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {instStats?.avg_score != null ? instStats.avg_score.toFixed(1) : '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {formatRelativeDate(instStats?.last_response_at ?? null)}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {formatRelativeDate(instStats?.last_login_at ?? null)}
                      </td>
                      <td className="py-3 px-4">
                        {license.status === 'none' && (
                          <span className="text-xs text-gray-400">Sem prazo</span>
                        )}
                        {license.status === 'active' && (
                          <Badge variant="success">
                            Ativa
                          </Badge>
                        )}
                        {license.status === 'expiring' && (
                          <Badge variant="warning">
                            Expira em {license.daysLeft}d
                          </Badge>
                        )}
                        {license.status === 'expired' && (
                          <Badge variant="danger">
                            Expirada
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={inst.is_active ? 'success' : 'danger'}>
                          {inst.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant={inst.is_active ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => toggleActive(inst.id, inst.is_active)}
                          >
                            {inst.is_active ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPerms(editingPerms === inst.id ? null : inst.id)}
                          >
                            Permissões
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Permissions Panel (expanded under table) */}
        {editingPerms && (() => {
          const inst = instructors.find((i) => i.id === editingPerms)
          if (!inst) return null
          return (
            <div className="border-t border-gray-200 mt-4 pt-4 px-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Permissões de {inst.name}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setEditingPerms(null)}>
                  Fechar
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {ALL_PERMISSIONS.map((perm) => (
                  <label
                    key={perm}
                    className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gold-300 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={inst.permissions[perm]}
                      onChange={() => togglePermission(inst.id, perm, inst.permissions)}
                      className="h-4 w-4 rounded border-gray-300 text-navy-900 focus:ring-gold-500"
                    />
                    <span className="text-sm text-gray-700">{PERMISSION_LABELS[perm]}</span>
                  </label>
                ))}
              </div>

              {/* License Expiration */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Licença</h4>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600">Expira em:</label>
                  <input
                    type="date"
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
                    value={inst.license_expires_at ? inst.license_expires_at.split('T')[0] : ''}
                    onChange={async (e) => {
                      const val = e.target.value
                      const licenseValue = val ? new Date(val + 'T23:59:59Z').toISOString() : null
                      const res = await fetch(`/api/admin/instructors/${inst.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ license_expires_at: licenseValue }),
                      })
                      if (res.ok) {
                        fetchInstructors()
                      }
                    }}
                  />
                  {inst.license_expires_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const res = await fetch(`/api/admin/instructors/${inst.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ license_expires_at: null }),
                        })
                        if (res.ok) {
                          fetchInstructors()
                        }
                      }}
                    >
                      Remover prazo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
      </Card>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        {isLoading ? (
          <Card>
            <p className="text-center text-gray-400 py-8">Carregando...</p>
          </Card>
        ) : displayInstructors.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-400">
              <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <p className="text-sm font-medium">
                {searchQuery || statusFilter !== 'all'
                  ? 'Nenhum instrutor encontrado com esses filtros'
                  : 'Nenhum instrutor cadastrado'}
              </p>
            </div>
          </Card>
        ) : (
          displayInstructors.map((inst) => {
            const instStats = statsMap.get(inst.id)
            const license = getLicenseInfo(inst.license_expires_at)

            return (
              <Card key={inst.id}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{inst.name}</h3>
                    <p className="text-sm text-gray-500">{inst.email}</p>
                    {inst.slug && (
                      <span className="inline-block mt-1 font-mono text-xs text-navy-700 bg-navy-50 px-2 py-0.5 rounded">
                        /{inst.slug}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={inst.is_active ? 'success' : 'danger'}>
                      {inst.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {license.status === 'active' && <Badge variant="success">Licença Ativa</Badge>}
                    {license.status === 'expiring' && <Badge variant="warning">Expira em {license.daysLeft}d</Badge>}
                    {license.status === 'expired' && <Badge variant="danger">Licença Expirada</Badge>}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 py-3 border-t border-b border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-navy-900">{instStats?.response_count ?? 0}</p>
                    <p className="text-xs text-gray-500">Respostas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-navy-900">{instStats?.lead_count ?? 0}</p>
                    <p className="text-xs text-gray-500">Leads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-navy-900">{instStats?.avg_score != null ? instStats.avg_score.toFixed(1) : '—'}</p>
                    <p className="text-xs text-gray-500">Score Médio</p>
                  </div>
                </div>

                {/* Activity Info */}
                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Última atividade:</span>
                    <span>{formatRelativeDate(instStats?.last_response_at ?? null)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Último login:</span>
                    <span>{formatRelativeDate(instStats?.last_login_at ?? null)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant={inst.is_active ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => toggleActive(inst.id, inst.is_active)}
                  >
                    {inst.is_active ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPerms(editingPerms === inst.id ? null : inst.id)}
                  >
                    Permissões
                  </Button>
                </div>

                {/* Permissions Panel (inline for mobile) */}
                {editingPerms === inst.id && (
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">Permissões</h4>
                      <Button variant="ghost" size="sm" onClick={() => setEditingPerms(null)}>
                        Fechar
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_PERMISSIONS.map((perm) => (
                        <label
                          key={perm}
                          className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-gold-300 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={inst.permissions[perm]}
                            onChange={() => togglePermission(inst.id, perm, inst.permissions)}
                            className="h-4 w-4 rounded border-gray-300 text-navy-900 focus:ring-gold-500"
                          />
                          <span className="text-xs text-gray-700">{PERMISSION_LABELS[perm]}</span>
                        </label>
                      ))}
                    </div>

                    {/* License */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Licença</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="text-sm text-gray-600">Expira em:</label>
                        <input
                          type="date"
                          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
                          value={inst.license_expires_at ? inst.license_expires_at.split('T')[0] : ''}
                          onChange={async (e) => {
                            const val = e.target.value
                            const licenseValue = val ? new Date(val + 'T23:59:59Z').toISOString() : null
                            const res = await fetch(`/api/admin/instructors/${inst.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ license_expires_at: licenseValue }),
                            })
                            if (res.ok) {
                              fetchInstructors()
                            }
                          }}
                        />
                        {inst.license_expires_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const res = await fetch(`/api/admin/instructors/${inst.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ license_expires_at: null }),
                              })
                              if (res.ok) {
                                fetchInstructors()
                              }
                            }}
                          >
                            Remover prazo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
