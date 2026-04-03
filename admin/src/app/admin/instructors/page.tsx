'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { parsePermissions } from '@/lib/permissions'
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  type Permission,
  type UserPermissions,
} from '@/lib/types/database'

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

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingPerms, setEditingPerms] = useState<string | null>(null)

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

  const fetchInviteToken = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/invite')
      if (res.ok) {
        const json = await res.json()
        setInviteToken(json.token)
      }
    } catch {
      // Silently fail — invite section will show "generate" button
    }
  }, [])

  useEffect(() => { fetchInstructors() }, [fetchInstructors])
  useEffect(() => { fetchInviteToken() }, [fetchInviteToken])

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

      {/* Instructors Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Slug</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Licença</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Desde</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Carregando...</td></tr>
              ) : instructors.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Nenhum instrutor cadastrado</td></tr>
              ) : (
                instructors.map((inst) => {
                  const licenseExpiry = inst.license_expires_at ? new Date(inst.license_expires_at) : null
                  const now = new Date()
                  const daysLeft = licenseExpiry ? Math.ceil((licenseExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
                  const licenseStatus = !licenseExpiry ? 'none' : daysLeft !== null && daysLeft < 0 ? 'expired' : daysLeft !== null && daysLeft <= 30 ? 'expiring' : 'active'

                  return (
                  <tr key={inst.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-900">{inst.name}</td>
                    <td className="py-3 px-4 text-gray-600">{inst.email}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{inst.slug || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={inst.is_active ? 'success' : 'danger'}>
                        {inst.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {licenseStatus === 'none' && (
                        <span className="text-xs text-gray-400">Sem prazo</span>
                      )}
                      {licenseStatus === 'active' && (
                        <Badge variant="success">
                          Ativa até {licenseExpiry!.toLocaleDateString('pt-BR')}
                        </Badge>
                      )}
                      {licenseStatus === 'expiring' && (
                        <Badge variant="warning">
                          Expira em {daysLeft}d
                        </Badge>
                      )}
                      {licenseStatus === 'expired' && (
                        <Badge variant="danger">
                          Expirada {licenseExpiry!.toLocaleDateString('pt-BR')}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{formatDate(inst.created_at)}</td>
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
    </div>
  )
}
