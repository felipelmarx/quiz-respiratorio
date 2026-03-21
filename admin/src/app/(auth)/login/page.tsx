'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect') || '/dashboard'
  // Prevent open redirect: only allow relative paths, block protocol-relative URLs
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/dashboard'
  const errorParam = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    inactive: 'Sua conta está desativada. Contate o administrador.',
    no_permissions: 'Sua conta não possui permissões. Contate o administrador.',
    license_expired: 'Sua licença expirou. Entre em contato com o administrador para renovar.',
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(errorParam ? errorMessages[errorParam] || '' : '')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const supabase = createClient()

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Email ou senha inválidos.')
        setLoading(false)
        return
      }

      // Get user role to redirect appropriately
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .single()

      const role = (userData as { role: string } | null)?.role
      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push(redirect)
      }

      router.refresh()
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setResetLoading(true)

    if (!email) {
      setError('Digite seu email acima.')
      setResetLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError('Erro ao enviar email de recuperação. Tente novamente.')
      } else {
        setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.')
      }
    } catch {
      setError('Erro ao enviar email de recuperação.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
            <svg className="w-8 h-8 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">iBreathwork</h1>
          <p className="text-sm text-gray-500 mt-1">Painel de Administração</p>
        </div>

        {resetMode ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              id="reset-email"
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={resetLoading}>
              Enviar email de recuperação
            </Button>

            <button
              type="button"
              onClick={() => { setResetMode(false); setError(''); setSuccess('') }}
              className="w-full text-sm text-emerald-700 hover:text-emerald-800 mt-2"
            >
              Voltar ao login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              id="password"
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Entrar
            </Button>

            <button
              type="button"
              onClick={() => { setResetMode(true); setError(''); setSuccess('') }}
              className="w-full text-sm text-gray-500 hover:text-emerald-700 mt-2"
            >
              Esqueceu sua senha?
            </button>
          </form>
        )}
      </Card>
    </div>
  )
}
