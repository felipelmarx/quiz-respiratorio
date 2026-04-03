'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface BrandingSettings {
  primary_color: string
  accent_color: string
  logo_url: string | null
  welcome_message: string
  cta_text: string
  cta_url: string | null
}

const DEFAULTS: BrandingSettings = {
  primary_color: '#0A192F',
  accent_color: '#C6A868',
  logo_url: null,
  welcome_message: 'Avalie sua saúde respiratória',
  cta_text: 'Agendar Consulta',
  cta_url: null,
}

function isValidUrl(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function BrandingPage() {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadBranding = useCallback(async () => {
    try {
      const res = await fetch('/api/quiz/branding')
      if (res.ok) {
        const data = await res.json()
        setBranding({
          primary_color: data.primary_color ?? DEFAULTS.primary_color,
          accent_color: data.accent_color ?? DEFAULTS.accent_color,
          logo_url: data.logo_url ?? null,
          welcome_message: data.welcome_message ?? DEFAULTS.welcome_message,
          cta_text: data.cta_text ?? DEFAULTS.cta_text,
          cta_url: data.cta_url ?? null,
        })
      }
    } catch {
      // Defaults are fine
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBranding()
  }, [loadBranding])

  function updateField<K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) {
    setBranding((prev) => ({ ...prev, [key]: value }))
    setMessage('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    // Client-side URL validation
    if (branding.logo_url && !isValidUrl(branding.logo_url)) {
      setMessage('Erro: URL do logo inválida. Use http:// ou https://')
      setSaving(false)
      return
    }
    if (branding.cta_url && !isValidUrl(branding.cta_url)) {
      setMessage('Erro: URL do botão inválida. Use http:// ou https://')
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/quiz/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_color: branding.primary_color,
          accent_color: branding.accent_color,
          logo_url: branding.logo_url || '',
          welcome_message: branding.welcome_message,
          cta_text: branding.cta_text,
          cta_url: branding.cta_url || '',
        }),
      })

      if (res.ok) {
        setMessage('Configurações salvas com sucesso!')
      } else {
        const data = await res.json()
        setMessage('Erro ao salvar: ' + (data.error || 'Erro desconhecido'))
      }
    } catch {
      setMessage('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setBranding(DEFAULTS)
    setMessage('')
  }

  if (loading) return <div className="text-gray-400">Carregando...</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Personalização
        </h1>
        <p className="text-gray-500 mt-1">
          Customize a aparência do quiz para seus pacientes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Form */}
        <Card>
          <CardTitle>Configurações de Marca</CardTitle>
          <form onSubmit={handleSave} className="mt-4 space-y-5">
            {/* Primary Color */}
            <div className="space-y-1">
              <label htmlFor="primary_color" className="block text-sm font-medium text-gray-700">
                Cor Primária
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="primary_color"
                  value={branding.primary_color}
                  onChange={(e) => updateField('primary_color', e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-gray-300 p-1"
                />
                <span className="text-sm font-mono text-gray-600">{branding.primary_color}</span>
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-1">
              <label htmlFor="accent_color" className="block text-sm font-medium text-gray-700">
                Cor de Destaque
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="accent_color"
                  value={branding.accent_color}
                  onChange={(e) => updateField('accent_color', e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-gray-300 p-1"
                />
                <span className="text-sm font-mono text-gray-600">{branding.accent_color}</span>
              </div>
            </div>

            {/* Logo URL */}
            <Input
              id="logo_url"
              label="URL do Logo"
              value={branding.logo_url || ''}
              onChange={(e) => updateField('logo_url', e.target.value || null)}
              placeholder="https://exemplo.com/logo.png"
              error={branding.logo_url && !isValidUrl(branding.logo_url) ? 'URL inválida' : undefined}
            />

            {/* Welcome Message */}
            <Input
              id="welcome_message"
              label="Mensagem de Boas-vindas"
              value={branding.welcome_message}
              onChange={(e) => updateField('welcome_message', e.target.value)}
              placeholder="Avalie sua saúde respiratória"
              maxLength={200}
            />

            {/* CTA Text */}
            <Input
              id="cta_text"
              label="Texto do Botão (CTA)"
              value={branding.cta_text}
              onChange={(e) => updateField('cta_text', e.target.value)}
              placeholder="Agendar Consulta"
              maxLength={50}
            />

            {/* CTA URL */}
            <Input
              id="cta_url"
              label="Link do Botão (CTA)"
              value={branding.cta_url || ''}
              onChange={(e) => updateField('cta_url', e.target.value || null)}
              placeholder="https://wa.me/5511999999999"
              error={branding.cta_url && !isValidUrl(branding.cta_url) ? 'URL inválida' : undefined}
            />

            {message && (
              <p className={`text-sm ${message.startsWith('Erro') ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" loading={saving}>
                Salvar
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Restaurar Padrão
              </Button>
            </div>
          </form>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardTitle>Pré-visualização</CardTitle>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Veja como o quiz aparecerá para seus pacientes
          </p>

          <div
            className="rounded-xl border border-gray-200 overflow-hidden shadow-sm"
            style={{ backgroundColor: branding.primary_color }}
          >
            {/* Preview Header */}
            <div className="p-6 text-center">
              {/* Logo */}
              {branding.logo_url && isValidUrl(branding.logo_url) ? (
                <div className="mb-4 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={branding.logo_url}
                    alt="Logo"
                    className="h-16 w-auto object-contain rounded"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              ) : (
                <div className="mb-4 flex justify-center">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold"
                    style={{
                      backgroundColor: branding.accent_color,
                      color: branding.primary_color,
                    }}
                  >
                    iB
                  </div>
                </div>
              )}

              {/* Welcome Message */}
              <h2
                className="text-xl font-bold mb-2"
                style={{
                  color: '#FFFFFF',
                  fontFamily: 'Playfair Display, serif',
                }}
              >
                {branding.welcome_message || 'Avalie sua saúde respiratória'}
              </h2>
              <p className="text-sm opacity-80" style={{ color: branding.accent_color }}>
                Quiz de Avaliação Respiratória
              </p>
            </div>

            {/* Preview Body */}
            <div className="bg-white p-6 rounded-t-2xl">
              {/* Fake question */}
              <div className="space-y-3">
                <div className="h-3 rounded-full bg-gray-200 w-3/4" />
                <div className="h-3 rounded-full bg-gray-100 w-1/2" />
                <div className="mt-4 space-y-2">
                  <div
                    className="h-10 rounded-lg border-2 flex items-center px-3"
                    style={{ borderColor: branding.accent_color + '40' }}
                  >
                    <div className="h-2.5 rounded-full bg-gray-200 w-2/3" />
                  </div>
                  <div
                    className="h-10 rounded-lg border-2 flex items-center px-3"
                    style={{
                      borderColor: branding.accent_color,
                      backgroundColor: branding.accent_color + '10',
                    }}
                  >
                    <div
                      className="h-2.5 rounded-full w-1/2"
                      style={{ backgroundColor: branding.accent_color + '60' }}
                    />
                  </div>
                  <div
                    className="h-10 rounded-lg border-2 flex items-center px-3"
                    style={{ borderColor: branding.accent_color + '40' }}
                  >
                    <div className="h-2.5 rounded-full bg-gray-200 w-3/5" />
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-6">
                <div
                  className="w-full h-11 rounded-lg flex items-center justify-center text-sm font-medium text-white cursor-default"
                  style={{ backgroundColor: branding.accent_color }}
                >
                  {branding.cta_text || 'Agendar Consulta'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
