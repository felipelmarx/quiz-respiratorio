import { Card, CardTitle } from '@/components/ui/card'

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações Globais</h1>
        <p className="text-gray-500 mt-1">Configurações da plataforma iBreathwork</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
