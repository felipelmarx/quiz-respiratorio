'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DonutChart } from '@/components/charts/donut-chart'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ── Types ──────────────────────────────────────────────────────────────────────

type LicensePlan = 'free' | 'monthly' | 'annual' | 'lifetime'

interface LicenseSummary {
  total_active: number
  total_revenue: number
  expiring_30_days: number
  total_expired: number
  plan_distribution: { plan: LicensePlan; count: number }[]
}

interface InstructorLicense {
  id: string
  name: string
  email: string
  license_plan: LicensePlan | null
  license_price: number | null
  license_expires_at: string | null
  is_active: boolean
  created_at: string
}

interface LicenseData {
  summary: LicenseSummary | null
  instructors: InstructorLicense[]
}

type LicenseStatus = 'active' | 'expiring' | 'expired' | 'none'

// ── Constants ──────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<LicensePlan, string> = {
  free: 'Gratuito',
  monthly: 'Mensal',
  annual: 'Anual',
  lifetime: 'Vitalicio',
}

const PLAN_COLORS: Record<LicensePlan, string> = {
  free: '#94a3b8',
  monthly: '#3b82f6',
  annual: '#C6A868',
  lifetime: '#0A192F',
}

const PLAN_BADGE_VARIANT: Record<LicensePlan, 'default' | 'info' | 'gold' | 'navy'> = {
  free: 'default',
  monthly: 'info',
  annual: 'gold',
  lifetime: 'navy',
}

const STATUS_CONFIG: Record<LicenseStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  active: { label: 'Ativa', variant: 'success' },
  expiring: { label: 'Expirando', variant: 'warning' },
  expired: { label: 'Expirada', variant: 'danger' },
  none: { label: 'Sem licenca', variant: 'default' },
}

const PLAN_OPTIONS: LicensePlan[] = ['free', 'monthly', 'annual', 'lifetime']

// ── Helpers ────────────────────────────────────────────────────────────────────

function getLicenseStatus(expiresAt: string | null, plan: LicensePlan | null): LicenseStatus {
  if (!plan || plan === 'free') return 'none'
  if (plan === 'lifetime') return 'active'
  if (!expiresAt) return 'none'

  const now = new Date()
  const expiry = new Date(expiresAt)
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) return 'expired'
  if (daysLeft <= 30) return 'expiring'
  return 'active'
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '\u2014'
  try {
    return format(new Date(dateString), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
  } catch {
    return '\u2014'
  }
}

// ── Skeleton helpers ───────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-7 w-16 rounded bg-gray-200" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

interface EditModalProps {
  instructor: InstructorLicense
  onClose: () => void
  onSave: (data: { instructor_id: string; license_plan: LicensePlan; license_price: number; license_expires_at: string | null }) => Promise<void>
}

function EditLicenseModal({ instructor, onClose, onSave }: EditModalProps) {
  const [plan, setPlan] = useState<LicensePlan>(instructor.license_plan || 'free')
  const [price, setPrice] = useState(String(instructor.license_price ?? 0))
  const [expiresAt, setExpiresAt] = useState(
    instructor.license_expires_at ? instructor.license_expires_at.slice(0, 10) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const priceNum = parseFloat(price.replace(',', '.'))
      if (isNaN(priceNum) || priceNum < 0) {
        setError('Preco invalido')
        setSaving(false)
        return
      }

      const expiresValue = plan === 'lifetime' || !expiresAt
        ? null
        : new Date(expiresAt + 'T23:59:59Z').toISOString()

      await onSave({
        instructor_id: instructor.id,
        license_plan: plan,
        license_price: priceNum,
        license_expires_at: expiresValue,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold text-navy-900 mb-1">
          Editar Licenca
        </h3>
        <p className="text-sm text-gray-500 mb-6">{instructor.name || instructor.email}</p>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Plano</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as LicensePlan)}
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            >
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p}>{PLAN_LABELS[p]}</option>
              ))}
            </select>
          </div>

          <Input
            label="Preco (R$)"
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0,00"
          />

          {plan !== 'lifetime' && (
            <Input
              label="Data de Expiracao"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function LicensesPage() {
  const [data, setData] = useState<LicenseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('')
  const [planFilter, setPlanFilter] = useState<LicensePlan | 'all'>('all')

  // Edit modal
  const [editingInstructor, setEditingInstructor] = useState<InstructorLicense | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/licenses')
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const json: LicenseData = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Compute KPIs from instructor data when summary is not available
  const kpis = useMemo(() => {
    if (data?.summary) {
      return {
        totalActive: data.summary.total_active,
        monthlyRevenue: data.summary.total_revenue,
        expiring30: data.summary.expiring_30_days,
        totalExpired: data.summary.total_expired,
      }
    }

    if (!data?.instructors) {
      return { totalActive: 0, monthlyRevenue: 0, expiring30: 0, totalExpired: 0 }
    }

    const instructors = data.instructors
    let totalActive = 0
    let monthlyRevenue = 0
    let expiring30 = 0
    let totalExpired = 0

    for (const inst of instructors) {
      const status = getLicenseStatus(inst.license_expires_at, inst.license_plan)
      if (status === 'active' || status === 'expiring') {
        totalActive++
        monthlyRevenue += inst.license_price ?? 0
      }
      if (status === 'expiring') expiring30++
      if (status === 'expired') totalExpired++
    }

    return { totalActive, monthlyRevenue, expiring30, totalExpired }
  }, [data])

  // Donut chart data
  const donutData = useMemo(() => {
    if (data?.summary?.plan_distribution) {
      return data.summary.plan_distribution.map((d) => ({
        name: PLAN_LABELS[d.plan] ?? d.plan,
        value: d.count,
        color: PLAN_COLORS[d.plan] ?? '#94a3b8',
      }))
    }

    if (!data?.instructors) return []

    const counts: Record<string, number> = {}
    for (const inst of data.instructors) {
      const plan = inst.license_plan || 'free'
      counts[plan] = (counts[plan] || 0) + 1
    }

    return Object.entries(counts).map(([plan, count]) => ({
      name: PLAN_LABELS[plan as LicensePlan] ?? plan,
      value: count,
      color: PLAN_COLORS[plan as LicensePlan] ?? '#94a3b8',
    }))
  }, [data])

  // Filtered instructors
  const filteredInstructors = useMemo(() => {
    if (!data?.instructors) return []

    const query = searchQuery.toLowerCase().trim()
    return data.instructors.filter((inst) => {
      // Plan filter
      if (planFilter !== 'all') {
        const instPlan = inst.license_plan || 'free'
        if (instPlan !== planFilter) return false
      }

      // Search filter
      if (query) {
        const matchName = inst.name?.toLowerCase().includes(query)
        const matchEmail = inst.email?.toLowerCase().includes(query)
        if (!matchName && !matchEmail) return false
      }

      return true
    })
  }, [data, searchQuery, planFilter])

  // Save license edit
  const handleSaveLicense = async (payload: {
    instructor_id: string
    license_plan: LicensePlan
    license_price: number
    license_expires_at: string | null
  }) => {
    const res = await fetch('/api/admin/licenses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Erro ${res.status}`)
    }

    // Refresh data
    await fetchData()
  }

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-display text-h2 text-navy-900">Gestao de Licencas</h1>
        <p className="mt-1 text-body-sm text-gray-500">
          Gerencie planos e licencas dos instrutores
        </p>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="py-5">
                <p className="text-body-sm text-gray-500">Total de Licencas Ativas</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">
                  {kpis.totalActive.toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-5">
                <p className="text-body-sm text-gray-500">Receita Mensal Estimada</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">
                  {formatCurrency(kpis.monthlyRevenue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-5">
                <p className="text-body-sm text-gray-500">Expirando em 30 dias</p>
                <p className="mt-1 text-2xl font-bold text-yellow-600">
                  {kpis.expiring30.toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-5">
                <p className="text-body-sm text-gray-500">Licencas Expiradas</p>
                <p className="mt-1 text-2xl font-bold text-red-600">
                  {kpis.totalExpired.toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Donut Chart ────────────────────────────────────────────────────── */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuicao por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={donutData} height={280} />
          </CardContent>
        </Card>
      )}

      {/* ── Instructor License Table ───────────────────────────────────────── */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>Licencas dos Instrutores</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and filter controls */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as LicensePlan | 'all')}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              >
                <option value="all">Todos os planos</option>
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>{PLAN_LABELS[p]}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            {filteredInstructors.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-gray-400">
                {data?.instructors?.length === 0
                  ? 'Nenhum instrutor cadastrado'
                  : 'Nenhum instrutor encontrado com os filtros aplicados'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2.5 pr-4 text-left font-medium text-gray-500">Nome</th>
                      <th className="py-2.5 pr-4 text-left font-medium text-gray-500">Email</th>
                      <th className="py-2.5 pr-4 text-left font-medium text-gray-500">Plano</th>
                      <th className="py-2.5 pr-4 text-right font-medium text-gray-500">Preco</th>
                      <th className="py-2.5 pr-4 text-left font-medium text-gray-500">Expira em</th>
                      <th className="py-2.5 pr-4 text-left font-medium text-gray-500">Status</th>
                      <th className="py-2.5 text-right font-medium text-gray-500">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInstructors.map((inst) => {
                      const plan = inst.license_plan || 'free'
                      const status = getLicenseStatus(inst.license_expires_at, inst.license_plan)
                      const statusConf = STATUS_CONFIG[status]

                      return (
                        <tr
                          key={inst.id}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-2.5 pr-4 font-medium text-gray-900 truncate max-w-[160px]">
                            {inst.name || '\u2014'}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-600 truncate max-w-[200px]">
                            {inst.email}
                          </td>
                          <td className="py-2.5 pr-4">
                            <Badge variant={PLAN_BADGE_VARIANT[plan]}>
                              {PLAN_LABELS[plan]}
                            </Badge>
                          </td>
                          <td className="py-2.5 pr-4 text-right text-gray-700 tabular-nums">
                            {inst.license_price != null
                              ? formatCurrency(inst.license_price)
                              : '\u2014'}
                          </td>
                          <td className="py-2.5 pr-4 text-gray-600">
                            {plan === 'lifetime'
                              ? 'Vitalicio'
                              : formatDate(inst.license_expires_at)}
                          </td>
                          <td className="py-2.5 pr-4">
                            <Badge variant={statusConf.variant}>
                              {statusConf.label}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingInstructor(inst)}
                            >
                              Editar
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {editingInstructor && (
        <EditLicenseModal
          instructor={editingInstructor}
          onClose={() => setEditingInstructor(null)}
          onSave={handleSaveLicense}
        />
      )}
    </div>
  )
}
