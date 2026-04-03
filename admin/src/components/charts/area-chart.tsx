'use client'

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TooltipContentProps } from 'recharts/types/component/Tooltip'

const NAVY_900 = '#0A192F'
const GOLD_500 = '#C6A868'

interface DataKeyConfig {
  key: string
  color: string
  name: string
}

interface AreaChartProps {
  data: Record<string, unknown>[]
  dataKeys: DataKeyConfig[]
  xAxisKey: string
  title?: string
  height?: number
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipContentProps) {
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
      <p style={{ color: GOLD_500, fontSize: 12, margin: 0, marginBottom: 6 }}>
        {String(label ?? '')}
      </p>
      {payload.map((entry, index) => (
        <div
          key={`tooltip-${index}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: index < payload.length - 1 ? 4 : 0,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: '#D1D5DB', fontSize: 12 }}>{entry.name}</span>
          <span style={{ color: '#ffffff', fontSize: 13, fontWeight: 700, marginLeft: 'auto' }}>
            {Number(entry.value ?? 0).toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}

function colorToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function AreaChart({ data, dataKeys, xAxisKey, title, height = 300 }: AreaChartProps) {
  if (!data || data.length === 0 || !dataKeys || dataKeys.length === 0) {
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
        <RechartsAreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {dataKeys.map((dk) => (
              <linearGradient key={`gradient-${dk.key}`} id={`gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={dk.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={dk.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey={xAxisKey}
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
          <Tooltip content={CustomTooltip} />
          {dataKeys.map((dk) => (
            <Area
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.name}
              stroke={dk.color}
              strokeWidth={2}
              fill={`url(#gradient-${dk.key})`}
              fillOpacity={1}
              stackId="1"
              activeDot={{
                fill: dk.color,
                stroke: colorToRgba(dk.color, 0.3),
                strokeWidth: 4,
                r: 5,
              }}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
