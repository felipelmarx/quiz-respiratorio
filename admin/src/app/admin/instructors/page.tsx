'use client'

import { useState, useEffect, useCallback } from 'react'
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
  DEFAULT_PERMISSIONS,
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
  created_at: string
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingPerms, setEditingPerms] = useState<string | null>(null)

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
      .select('id, name, email, slug, whatsapp, is_active, permissions, created_at')
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

  useEffect(() => { fetchInstructors() }, [fetchInstructors])

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

  async function toggleActive(id: string, currentActive: boolean) {
    const supabase = createClient()
    await supabase.from('users').update({ is_active: !currentActive }).eq('id', id)
    fetchInstructors()
  }

  async function togglePermission(id: string, permission: Permission, currentPerms: UserPermissions) {
    const supabase = createClient()
    const updated = { ...currentPerms, [permission]: !currentPerms[permission] }
    await supabase.from('users').update({ permissions: updated }).eq('id', id)
    setInstructors((prev) =>
      prev.map((inst) => inst.id === id ? { ...inst, permissions: updated } : inst)
    )
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
                <th className="text-left py-3 px-4 font-medium text-gray-500">Desde</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Carregando...</td></tr>
              ) : instructors.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Nenhum instrutor cadastrado</td></tr>
              ) : (
                instructors.map((inst) => (
                  <tr key={inst.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-900">{inst.name}</td>
                    <td className="py-3 px-4 text-gray-600">{inst.email}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{inst.slug || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={inst.is_active ? 'success' : 'danger'}>
                        {inst.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
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
                ))
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
                    className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={inst.permissions[perm]}
                      onChange={() => togglePermission(inst.id, perm, inst.permissions)}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">{PERMISSION_LABELS[perm]}</span>
                  </label>
                ))}
              </div>
            </div>
          )
        })()}
      </Card>
    </div>
  )
}
