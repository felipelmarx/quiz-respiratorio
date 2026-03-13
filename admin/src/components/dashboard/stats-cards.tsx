'use client'

import { Card } from '@/components/ui/card'
import type { QuizProfile } from '@/lib/types/database'
import { getProfileLabel, getProfileColor } from '@/lib/utils'

interface StatsCardsProps {
  totalLeads: number
  totalResponses: number
  averageScore: number
  profileDistribution: Record<QuizProfile, number>
}

export function StatsCards({ totalLeads, totalResponses, averageScore, profileDistribution }: StatsCardsProps) {
  const stats = [
    { label: 'Total de Leads', value: totalLeads, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Respostas do Quiz', value: totalResponses, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Score Médio', value: averageScore.toFixed(1), icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <svg className="h-6 w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Profile distribution */}
      <Card>
        <h3 className="text-sm font-medium text-gray-500 mb-4">Distribuição de Perfis</h3>
        <div className="space-y-3">
          {(Object.keys(profileDistribution) as QuizProfile[]).map((profile) => {
            const count = profileDistribution[profile]
            const total = totalResponses || 1
            const pct = Math.round((count / total) * 100)
            return (
              <div key={profile}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={getProfileColor(profile) + ' px-2 py-0.5 rounded-full text-xs font-medium'}>
                    {getProfileLabel(profile)}
                  </span>
                  <span className="text-gray-600">{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
