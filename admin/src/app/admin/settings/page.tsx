'use client'

import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AdminSettingsPage() {
  const [testResult, setTestResult] = useState<{ success?: boolean; status?: number; error?: string } | null>(null)
  const [testing, setTesting] = useState(false)

  async function testConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/integration', { method: 'POST' })
      const json = await res.json()
      setTestResult(json)
    } catch {
      setTestResult({ success: false, error: 'Erro de conexão' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações Globais</h1>
        <p className="text-gray-500 mt-1">Configurações da plataforma iBreathwork</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Integration Card */}
        <Card className="lg:col-span-2">
          <CardTitle>Integração com Plataforma de Membros</CardTitle>
          <p className="mt-2 text-sm text-gray-500">
            Conecte sua plataforma de membros para sincronizar a base de alunos automaticamente.
          </p>

          <div className="mt-4 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p className="text-gray-600 mb-2">
                Configure as variáveis de ambiente no Vercel (ou <code className="bg-gray-200 px-1 rounded">.env.local</code>):
              </p>
              <div className="font-mono text-xs space-y-1 text-gray-500">
                <p><code>MEMBERS_API_URL</code> — URL base da API de membros</p>
                <p><code>MEMBERS_API_KEY</code> — Chave secreta da API</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={testConnection} loading={testing} variant="outline">
                Testar Conexão
              </Button>

              {testResult && (
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <Badge variant="success">
                      Conectado (HTTP {testResult.status})
                    </Badge>
                  ) : (
                    <Badge variant="danger">
                      {testResult.error || `Erro HTTP ${testResult.status}`}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="text-xs text-gray-400">
              A sincronização completa de alunos será implementada em uma próxima versão.
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Informações da Plataforma</CardTitle>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Plataforma</span>
              <span className="font-medium">iBreathwork Quiz</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Versão</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Stack</span>
              <span className="font-medium">Next.js 14 + Supabase</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Database</span>
              <span className="font-medium">PostgreSQL (Supabase)</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>SQL Migration</CardTitle>
          <p className="mt-2 text-sm text-gray-500">
            Execute a migration SQL no Supabase SQL Editor para criar as tabelas necessárias.
          </p>
          <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600">
            <p>Arquivo: supabase/migrations/001_initial_schema.sql</p>
            <p className="mt-1">Tabelas: users, quiz_leads, quiz_responses, audit_logs</p>
            <p className="mt-1">RLS: Ativo com policies por role</p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>Seed Admin Master</CardTitle>
          <p className="mt-2 text-sm text-gray-500">
            Para criar o primeiro Admin Master, execute no Supabase SQL Editor:
          </p>
          <pre className="mt-4 bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto">
{`-- 1. Crie o usuário no Supabase Auth (Dashboard > Authentication > Users > Add User)
-- 2. Depois insira na tabela users:
INSERT INTO public.users (id, email, name, role, slug, is_active)
VALUES (
  'COLE_O_AUTH_USER_ID_AQUI',
  'seu@email.com',
  'Felipe Marx',
  'master',
  'admin',
  true
);`}
          </pre>
        </Card>
      </div>
    </div>
  )
}
