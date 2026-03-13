'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface Instructor {
  id: string
  name: string
  email: string
  slug: string | null
  whatsapp: string | null
  is_active: boolean
  created_at: string
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

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
      .select('id, name, email, slug, whatsapp, is_active, created_at')
      .eq('role', 'instructor')
      .order('created_at', { ascending: false })

    setInstructors(data || [])
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
                  <tr key={inst.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                      <Button
                        variant={inst.is_active ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => toggleActive(inst.id, inst.is_active)}
                      >
                        {inst.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
