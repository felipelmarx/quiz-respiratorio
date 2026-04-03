'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'

const NAVY_900 = '#0A192F'
const GOLD_500 = '#C6A868'

interface DonutChartData {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutChartData[]
  title?: string
  height?: number
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  const total = (entry.payload as { total?: number }).total ?? 0
  const percentage = total > 0 ? ((entry.value ?? 0) / total * 100).toFixed(1) : '0.0'

  return (
    <div
      style={{
        backgroundColor: NAVY_900,
        border: `1px solid ${GOLD_500}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontFamily: 'Lato, sans-serif',
      }}
    >
      <p style={{ color: GOLD_500, fontSize: 12, margin: 0, marginBottom: 4 }}>
        {entry.name}
      </p>
      <p style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, margin: 0 }}>
        {(entry.value ?? 0).toLocaleString('pt-BR')} ({percentage}%)
      </p>
    </div>
  )
}

interface LegendEntryValue {
  color?: string
}

function CustomLegend({ payload }: { payload?: { value: string; color?: string; payload?: LegendEntryValue }[] }) {
  if (!payload) return null

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px 20px',
        paddingTop: 8,
        fontFamily: 'Lato, sans-serif',
      }}
    >
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: entry.color ?? entry.payload?.color,
            }}
          />
          <span style={{ fontSize: 12, color: '#4B5563' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

interface CenterLabelProps {
  viewBox?: { cx?: number; cy?: number }
  total: number
}

function CenterLabel({ viewBox, total }: CenterLabelProps) {
  const cx = viewBox?.cx ?? 0
  const cy = viewBox?.cy ?? 0

  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontFamily="Lato, sans-serif">
      <tspan x={cx} dy="-0.4em" fontSize={24} fontWeight={700} fill="#111827">
        {total.toLocaleString('pt-BR')}
      </tspan>
      <tspan x={cx} dy="1.6em" fontSize={12} fill="#6B7280">
        total
      </tspan>
    </text>
  )
}

export function DonutChart({ data, title, height = 300 }: DonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, fontFamily: 'Lato, sans-serif' }}>
        {title && (
          <h4 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            {title}
          </h4>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: height - 40,
            color: '#9CA3AF',
            fontSize: 14,
          }}
        >
          Sem dados
        </div>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const enrichedData = data.map((item) => ({ ...item, total }))

  return (
    <div style={{ fontFamily: 'Lato, sans-serif' }}>
      {title && (
        <h4 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={enrichedData}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            stroke="none"
          >
            {enrichedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <CenterLabel total={total} />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
