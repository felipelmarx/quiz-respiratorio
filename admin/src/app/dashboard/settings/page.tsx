'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [quizLink, setQuizLink] = useState('')

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
  }, [])

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
        setQuizLink(`${window.location.origin}/quiz?instrutor=${slug}`)
      }
    }
    setSaving(false)
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
      </div>
    </div>
  )
}
