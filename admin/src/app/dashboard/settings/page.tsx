'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface NotificationPreferences {
  email_on_new_response: boolean
  email_digest_frequency: 'none' | 'daily' | 'weekly'
  email_digest_day: number
}

interface ApiKey {
  id: string
  key_prefix: string
  name: string
  scopes: string[]
  last_used_at: string | null
  created_at: string
}

const DEFAULT_PREFS: NotificationPreferences = {
  email_on_new_response: false,
  email_digest_frequency: 'none',
  email_digest_day: 1,
}

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [quizLink, setQuizLink] = useState('')

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS)
  const [notifLoading, setNotifLoading] = useState(true)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifMessage, setNotifMessage] = useState('')

  // API keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [apiKeysLoading, setApiKeysLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatingKey, setGeneratingKey] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [apiKeyMessage, setApiKeyMessage] = useState('')
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null)

  const loadApiKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/keys')
      if (res.ok) {
        const json = await res.json()
        setApiKeys(json.data || [])
      }
    } catch {
      // Silently fail
    } finally {
      setApiKeysLoading(false)
    }
  }, [])

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      setApiKeyMessage('Informe um nome para a chave')
      return
    }
    setGeneratingKey(true)
    setApiKeyMessage('')
    setNewlyCreatedKey(null)
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim(), scopes: ['read'] }),
      })
      const json = await res.json()
      if (res.ok) {
        setNewlyCreatedKey(json.key)
        setNewKeyName('')
        loadApiKeys()
      } else {
        setApiKeyMessage(json.error || 'Erro ao gerar chave')
      }
    } catch {
      setApiKeyMessage('Erro ao gerar chave de API')
    } finally {
      setGeneratingKey(false)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    setDeletingKeyId(keyId)
    try {
      const res = await fetch(`/api/v1/keys?id=${keyId}`, { method: 'DELETE' })
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== keyId))
        setApiKeyMessage('Chave revogada com sucesso')
      } else {
        const json = await res.json()
        setApiKeyMessage(json.error || 'Erro ao revogar chave')
      }
    } catch {
      setApiKeyMessage('Erro ao revogar chave')
    } finally {
      setDeletingKeyId(null)
    }
  }

  const loadNotificationPrefs = useCallback(async () => {
    try {
      const res = await fetch('/api/quiz/notification-preferences')
      if (res.ok) {
        const data = await res.json()
        setNotifPrefs({
          email_on_new_response: data.email_on_new_response ?? false,
          email_digest_frequency: data.email_digest_frequency ?? 'none',
          email_digest_day: data.email_digest_day ?? 1,
        })
      }
    } catch {
      // Silently fail — defaults are fine
    } finally {
      setNotifLoading(false)
    }
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('name, whatsapp, slug')
        .eq('id', user.id)
        .single()

      if (data) {
        setName(data.name)
        setWhatsapp(data.whatsapp || '')
        setSlug(data.slug || '')
        if (data.slug) {
          setQuizLink(`${window.location.origin}/quiz?ref=${data.slug}`)
        }
      }
      setLoading(false)
    }
    load()
    loadNotificationPrefs()
    loadApiKeys()
  }, [loadNotificationPrefs, loadApiKeys])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('users')
      .update({ name, whatsapp: whatsapp || null, slug: slug || null })
      .eq('id', user.id)

    if (error) {
      setMessage('Erro ao salvar: ' + error.message)
    } else {
      setMessage('Configurações salvas!')
      if (slug) {
        setQuizLink(`${window.location.origin}/quiz?ref=${slug}`)
      }
    }
    setSaving(false)
  }

  async function handleSaveNotifications(e: React.FormEvent) {
    e.preventDefault()
    setNotifSaving(true)
    setNotifMessage('')

    try {
      const res = await fetch('/api/quiz/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifPrefs),
      })

      if (res.ok) {
        setNotifMessage('Preferências de notificação salvas!')
      } else {
        const data = await res.json()
        setNotifMessage('Erro ao salvar: ' + (data.error || 'Erro desconhecido'))
      }
    } catch {
      setNotifMessage('Erro ao salvar preferências')
    } finally {
      setNotifSaving(false)
    }
  }

  if (loading) return <div className="text-gray-400">Carregando...</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Edite seu perfil e link personalizado</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Perfil</CardTitle>
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <Input id="name" label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input id="whatsapp" label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5511999999999" />
            <Input
              id="slug"
              label="Slug do link"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="dr-felipe"
            />

            {message && (
              <p className={`text-sm ${message.startsWith('Erro') ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </p>
            )}

            <Button type="submit" loading={saving}>Salvar</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Seu Link do Quiz</CardTitle>
          <div className="mt-4">
            {quizLink ? (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-700 break-all">
                  {quizLink}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(quizLink)
                    setMessage('Link copiado!')
                  }}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copiar Link
                </Button>
                <p className="text-xs text-gray-500">
                  Compartilhe este link com seus pacientes/alunos. As respostas aparecerão no seu dashboard.
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Defina um slug acima para gerar seu link personalizado do quiz.
              </p>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>Notificacoes</CardTitle>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Configure como deseja receber alertas sobre novas respostas do quiz.
          </p>

          {notifLoading ? (
            <div className="text-gray-400 text-sm">Carregando preferencias...</div>
          ) : (
            <form onSubmit={handleSaveNotifications} className="space-y-5">
              {/* Toggle: email on new response */}
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifPrefs.email_on_new_response}
                  onClick={() =>
                    setNotifPrefs((p) => ({
                      ...p,
                      email_on_new_response: !p.email_on_new_response,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 ${
                    notifPrefs.email_on_new_response ? 'bg-navy-900' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      notifPrefs.email_on_new_response ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Receber email a cada nova resposta
                </span>
              </label>

              {/* Digest frequency */}
              <div className="space-y-1">
                <label htmlFor="digest-frequency" className="block text-sm font-medium text-gray-700">
                  Resumo por email
                </label>
                <select
                  id="digest-frequency"
                  value={notifPrefs.email_digest_frequency}
                  onChange={(e) =>
                    setNotifPrefs((p) => ({
                      ...p,
                      email_digest_frequency: e.target.value as 'none' | 'daily' | 'weekly',
                    }))
                  }
                  className="flex h-10 w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                >
                  <option value="none">Nenhum</option>
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>

              {/* Day of week (only for weekly) */}
              {notifPrefs.email_digest_frequency === 'weekly' && (
                <div className="space-y-1">
                  <label htmlFor="digest-day" className="block text-sm font-medium text-gray-700">
                    Dia do resumo semanal
                  </label>
                  <select
                    id="digest-day"
                    value={notifPrefs.email_digest_day}
                    onChange={(e) =>
                      setNotifPrefs((p) => ({
                        ...p,
                        email_digest_day: parseInt(e.target.value),
                      }))
                    }
                    className="flex h-10 w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  >
                    <option value={0}>Domingo</option>
                    <option value={1}>Segunda-feira</option>
                    <option value={2}>Terca-feira</option>
                    <option value={3}>Quarta-feira</option>
                    <option value={4}>Quinta-feira</option>
                    <option value={5}>Sexta-feira</option>
                    <option value={6}>Sabado</option>
                  </select>
                </div>
              )}

              {notifMessage && (
                <p className={`text-sm ${notifMessage.startsWith('Erro') ? 'text-red-600' : 'text-green-600'}`}>
                  {notifMessage}
                </p>
              )}

              <Button type="submit" loading={notifSaving}>
                Salvar Notificacoes
              </Button>
            </form>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>Chaves de API</CardTitle>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Gerencie chaves para acessar a API v1 externamente. A chave completa so e exibida uma vez, no momento da criacao.
          </p>

          {/* Generate new key */}
          <div className="flex gap-3 items-end mb-6">
            <div className="flex-1 max-w-xs">
              <Input
                id="new-key-name"
                label="Nome da nova chave"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Ex: Minha Integracao"
              />
            </div>
            <Button
              onClick={handleGenerateKey}
              loading={generatingKey}
              disabled={!newKeyName.trim()}
            >
              Gerar Nova Chave
            </Button>
          </div>

          {/* Newly created key - show once */}
          {newlyCreatedKey && (
            <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                Chave criada com sucesso! Copie agora — ela nao sera exibida novamente.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white rounded px-3 py-2 text-sm font-mono text-gray-800 border border-yellow-200 break-all select-all">
                  {newlyCreatedKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(newlyCreatedKey)
                    setApiKeyMessage('Chave copiada!')
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
          )}

          {apiKeyMessage && (
            <p className={`text-sm mb-4 ${apiKeyMessage.startsWith('Erro') ? 'text-red-600' : 'text-green-600'}`}>
              {apiKeyMessage}
            </p>
          )}

          {/* List of existing keys */}
          {apiKeysLoading ? (
            <div className="text-gray-400 text-sm">Carregando chaves...</div>
          ) : apiKeys.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma chave de API criada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 pr-4 font-medium">Prefixo</th>
                    <th className="pb-2 pr-4 font-medium">Nome</th>
                    <th className="pb-2 pr-4 font-medium">Criada em</th>
                    <th className="pb-2 pr-4 font-medium">Ultimo uso</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-mono text-gray-700">{k.key_prefix}...</td>
                      <td className="py-3 pr-4 text-gray-900">{k.name}</td>
                      <td className="py-3 pr-4 text-gray-500">
                        {new Date(k.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {k.last_used_at
                          ? new Date(k.last_used_at).toLocaleDateString('pt-BR')
                          : 'Nunca'}
                      </td>
                      <td className="py-3">
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deletingKeyId === k.id}
                          onClick={() => handleDeleteKey(k.id)}
                        >
                          Revogar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
