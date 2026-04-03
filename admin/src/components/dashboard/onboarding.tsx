'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OnboardingProfile {
  name: string
  email: string
  whatsapp: string | null
  profissao: string | null
  cidade: string | null
  slug: string | null
}

interface OnboardingProps {
  onComplete: () => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4

const STEP_TITLES = [
  'Bem-vindo ao iBreathwork!',
  'Configure seu Perfil',
  'Seu Link Personalizado',
  'Compartilhe com seu Primeiro Paciente',
]

// ── Component ─────────────────────────────────────────────────────────────────

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<OnboardingProfile | null>(null)
  const [quizBaseUrl, setQuizBaseUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const copyTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Form fields
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [profissao, setProfissao] = useState('')
  const [cidade, setCidade] = useState('')

  // Fetch profile data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/onboarding')
        if (res.ok) {
          const data = await res.json()
          setProfile(data.profile)
          setQuizBaseUrl(data.quizBaseUrl || '')
          // Pre-fill form
          setName(data.profile.name || '')
          setWhatsapp(data.profile.whatsapp || '')
          setProfissao(data.profile.profissao || '')
          setCidade(data.profile.cidade || '')
        }
      } catch {
        // Fail silently — user can still proceed
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const quizLink = profile?.slug
    ? `${quizBaseUrl}?ref=${profile.slug}`
    : `${quizBaseUrl}`

  const goNext = useCallback(() => {
    setDirection('forward')
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }, [])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(quizLink)
    setCopied(true)
    if (copyTimeout.current) clearTimeout(copyTimeout.current)
    copyTimeout.current = setTimeout(() => setCopied(false), 2000)
  }, [quizLink])

  const handleSaveProfile = useCallback(async () => {
    setSaving(true)
    try {
      await fetch('/api/auth/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, whatsapp, profissao, cidade }),
      })
      goNext()
    } catch {
      // Allow user to continue even if save fails
      goNext()
    } finally {
      setSaving(false)
    }
  }, [name, whatsapp, profissao, cidade, goNext])

  const handleComplete = useCallback(async () => {
    setSaving(true)
    try {
      await fetch('/api/auth/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complete: true }),
      })
    } catch {
      // Complete onboarding locally even if API fails
    } finally {
      setSaving(false)
      onComplete()
    }
  }, [onComplete])

  const handleShareWhatsApp = useCallback(() => {
    const message = encodeURIComponent(
      `Olá! Fiz uma avaliação sobre meu padrão respiratório e achei muito interessante. Quer descobrir como está o seu? Faça o quiz aqui: ${quizLink}`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }, [quizLink])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm">
        <div className="animate-pulse rounded-2xl bg-white p-12 shadow-2xl">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="mt-4 h-4 w-64 rounded bg-gray-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ── Gold accent bar ──────────────────────────────────────────── */}
        <div className="h-1.5 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600" />

        {/* ── Step indicator ───────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === step
                  ? 'w-8 bg-gold-500'
                  : i < step
                    ? 'w-2 bg-gold-300'
                    : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* ── Step label ───────────────────────────────────────────────── */}
        <p className="text-center text-caption text-gray-400 tracking-wider uppercase">
          Passo {step + 1} de {TOTAL_STEPS}
        </p>

        {/* ── Content area ─────────────────────────────────────────────── */}
        <div className="px-8 pb-8 pt-4">
          <div
            key={step}
            className={`${
              direction === 'forward' ? 'animate-fade-in' : 'animate-fade-in'
            }`}
          >
            {/* ── Step 0: Welcome ──────────────────────────────────────── */}
            {step === 0 && (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-navy-50">
                  <svg
                    className="h-10 w-10 text-navy-900"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                    />
                  </svg>
                </div>
                <h2 className="font-display text-h2 text-navy-900">
                  {STEP_TITLES[0]}
                </h2>
                <p className="mt-4 text-body-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
                  Estamos felizes em ter você no{' '}
                  <span className="font-semibold text-navy-900">
                    Instituto Brasileiro de Neurociencia Respiratoria
                  </span>
                  . Vamos configurar tudo para que voce possa comecar a avaliar seus pacientes em poucos minutos.
                </p>
                <Button
                  size="lg"
                  className="mt-8 w-full bg-navy-900 hover:bg-navy-800"
                  onClick={goNext}
                >
                  Comecar
                </Button>
              </div>
            )}

            {/* ── Step 1: Profile ───────────────────────────────────────── */}
            {step === 1 && (
              <div>
                <h2 className="font-display text-h3 text-navy-900 text-center">
                  {STEP_TITLES[1]}
                </h2>
                <p className="mt-2 mb-6 text-center text-body-sm text-gray-500">
                  Estes dados ajudam a personalizar sua experiencia na plataforma.
                </p>
                <div className="space-y-4">
                  <Input
                    id="onb-name"
                    label="Nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                  />
                  <Input
                    id="onb-whatsapp"
                    label="WhatsApp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    type="tel"
                  />
                  <Input
                    id="onb-profissao"
                    label="Profissao"
                    value={profissao}
                    onChange={(e) => setProfissao(e.target.value)}
                    placeholder="Ex: Fisioterapeuta, Psicologo..."
                  />
                  <Input
                    id="onb-cidade"
                    label="Cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Ex: Sao Paulo, SP"
                  />
                </div>
                <Button
                  size="lg"
                  className="mt-6 w-full bg-navy-900 hover:bg-navy-800"
                  onClick={handleSaveProfile}
                  loading={saving}
                >
                  Salvar e Continuar
                </Button>
              </div>
            )}

            {/* ── Step 2: Personalized Link ────────────────────────────── */}
            {step === 2 && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-50">
                  <svg
                    className="h-8 w-8 text-gold-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                    />
                  </svg>
                </div>
                <h2 className="font-display text-h3 text-navy-900">
                  {STEP_TITLES[2]}
                </h2>
                <p className="mt-3 text-body-sm text-gray-600 leading-relaxed">
                  Quando alguem acessar o quiz por este link, as respostas aparecerao no seu dashboard automaticamente.
                </p>
                <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="font-mono text-sm text-navy-900 break-all select-all">
                    {quizLink}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      Link Copiado!
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                      </svg>
                      Copiar Link
                    </span>
                  )}
                </Button>
                <Button
                  size="lg"
                  className="mt-3 w-full bg-navy-900 hover:bg-navy-800"
                  onClick={goNext}
                >
                  Continuar
                </Button>
              </div>
            )}

            {/* ── Step 3: Share ─────────────────────────────────────────── */}
            {step === 3 && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                    />
                  </svg>
                </div>
                <h2 className="font-display text-h3 text-navy-900">
                  {STEP_TITLES[3]}
                </h2>
                <p className="mt-3 text-body-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
                  Envie o quiz para seu primeiro paciente e acompanhe as respostas em tempo real no seu dashboard.
                </p>
                <div className="mt-6 space-y-3">
                  <Button
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleShareWhatsApp}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                      </svg>
                      Enviar pelo WhatsApp
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCopy}
                  >
                    {copied ? 'Link Copiado!' : 'Copiar Link'}
                  </Button>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <Button
                    size="lg"
                    className="w-full bg-navy-900 hover:bg-navy-800"
                    onClick={handleComplete}
                    loading={saving}
                  >
                    Entendi, vamos la!
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
