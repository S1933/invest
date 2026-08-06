import { ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts'
import type { DataPoint } from '../types'

type Props = {
  data: DataPoint[]
  color?: string
}

export function Chart({ data, color = '#3b82f6' }: Props) {
  if (data.length === 0) return null

  const firstPrice = data[0].price
  const chartData = data.map(d => ({
    date: d.date,
    change: firstPrice !== 0 ? ((d.price - firstPrice) / firstPrice) * 100 : 0,
  }))

  // Force LineChart remount when the underlying data identity changes,
  // otherwise Recharts caches the XAxis scale and tick labels stay stale
  // when switching ranges (curve updates but X-axis dates don't).
  const chartKey = `${chartData[0].date}_${chartData[chartData.length - 1].date}_${chartData.length}`

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart key={chartKey} data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={fmtDate} minTickGap={40} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} width={55} tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`} />
          <Line type="monotone" dataKey="change" stroke={color} dot={false} activeDot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function fmtDate(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
}