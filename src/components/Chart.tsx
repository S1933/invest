import { ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts'
import type { DataPoint } from '../types'

type Props = {
  data: DataPoint[]
  color?: string
}

export function Chart({ data, color = '#3b82f6' }: Props) {
  if (data.length === 0) return null

  const firstPrice = data[0].price
  const dates = data.map(d => d.date)
  // Use a numeric index for X positioning so Recharts aligns the curve and the
  // X-axis ticks reliably. The tick label is looked up from `dates` by index.
  const chartData = data.map((d, i) => ({
    i,
    date: d.date,
    change: firstPrice !== 0 ? ((d.price - firstPrice) / firstPrice) * 100 : 0,
  }))

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="i"
            type="number"
            domain={[0, chartData.length - 1]}
            tick={{ fontSize: 10 }}
            tickFormatter={(i: number) => {
              const date = dates[Math.round(i)]
              return date ? fmtDate(date) : ''
            }}
            minTickGap={40}
            allowDecimals={false}
          />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} width={55} tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`} />
          <Line type="monotone" dataKey="change" stroke={color} dot={false} activeDot={false} strokeWidth={2} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function fmtDate(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
}