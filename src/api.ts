import type { DataPoint, Range } from './types'

type YahooResponse = {
  chart: {
    result?: {
      timestamp: number[]
      indicators: {
        quote: { close: (number | null)[] }[]
      }
    }[]
    error?: unknown
  }
}

export async function fetchYahoo(symbol: string, range: Range): Promise<DataPoint[]> {
  const interval = range === '3y' || range === '5y' ? '1wk' : '1d'
  const url = `/api/yahoo/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Yahoo ${symbol}: ${res.status}`)

  const json: YahooResponse = await res.json()
  const result = json.chart.result?.[0]
  if (!result || json.chart.error) throw new Error(`Yahoo ${symbol}: no data`)

  const timestamps = result.timestamp
  const closes = result.indicators.quote[0].close

  return timestamps
    .map((t, i) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      price: closes[i],
    }))
    .filter((d): d is DataPoint => d.price !== null)
}