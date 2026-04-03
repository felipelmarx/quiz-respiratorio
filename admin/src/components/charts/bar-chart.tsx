'use client'

import { useState } from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipProps,
} from 'recharts'

const NAVY_900 = '#0A192F'
const NAVY_700 = '#243B55'
const GOLD_500 = '#C6A868'

interface BarChartProps {
  data: { label: string; value: number }[]
  title?: string
  height?: number
  color?: string
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
        {label}
      </p>
      <p style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, margin: 0 }}>
        {payload[0].value?.toLocaleString('pt-BR')}
      </p>
    </div>
  )
}

export function BarChart({ data, title, height = 300, color = NAVY_700 }: BarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

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
        <RechartsBarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="label"
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(198, 168, 104, 0.08)' }} />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            onMouseEnter={(_, index) => setActiveIndex(index)}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={activeIndex === index ? GOLD_500 : color}
                style={{ transition: 'fill 150ms ease' }}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
