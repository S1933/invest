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

export type Ath = { price: number; date: string; fetchedAt: number }

// Fetch the full historical series (range=max, daily) to compute the true all-time high.
// We don't store the full series — only the resulting { price, date } so the cache stays tiny.
export async function fetchAth(symbol: string): Promise<Ath> {
  const url = `/api/yahoo/v8/finance/chart/${symbol}?range=max&interval=1d`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Yahoo ${symbol}: ${res.status}`)

  const json: YahooResponse = await res.json()
  const result = json.chart.result?.[0]
  if (!result || json.chart.error) throw new Error(`Yahoo ${symbol}: no data`)

  const timestamps = result.timestamp
  const closes = result.indicators.quote[0].close

  let bestPrice = -Infinity
  let bestIdx = -1
  for (let i = 0; i < closes.length; i++) {
    const c = closes[i]
    if (c !== null && c > bestPrice) {
      bestPrice = c
      bestIdx = i
    }
  }
  if (bestIdx < 0) throw new Error(`Yahoo ${symbol}: no valid closes`)

  return {
    price: bestPrice,
    date: new Date(timestamps[bestIdx] * 1000).toISOString().slice(0, 10),
    fetchedAt: Date.now(),
  }
}