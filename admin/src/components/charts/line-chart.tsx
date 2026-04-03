'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'

const NAVY_900 = '#0A192F'
const GOLD_500 = '#C6A868'

interface LineChartProps {
  data: { date: string; count: number }[]
  title?: string
  height?: number
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${day}/${month}`
  } catch {
    return dateStr
  }
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

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
        {formatDate(label ?? '')}
      </p>
      <p style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, margin: 0 }}>
        {payload[0].value?.toLocaleString('pt-BR')}
      </p>
    </div>
  )
}

export function LineChart({ data, title, height = 300 }: LineChartProps) {
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

  return (
    <div style={{ fontFamily: 'Lato, sans-serif' }}>
      {title && (
        <h4 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke={NAVY_900}
            strokeWidth={2}
            dot={{ fill: GOLD_500, stroke: GOLD_500, r: 4 }}
            activeDot={{ fill: GOLD_500, stroke: NAVY_900, strokeWidth: 2, r: 6 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
