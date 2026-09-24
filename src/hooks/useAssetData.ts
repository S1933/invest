import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import type { Range, DataPoint } from '../types'
import { assets } from '../assets'
import { fetchYahoo } from '../api'
import { loadCache, saveCache, type CacheShape } from '../storage'

export type AssetData = {
  id: string
  label: string
  currency: string
  data: DataPoint[]
  error: string | null
  fetchedAt: number | null
}

export type UseAssetDataResult = {
  assets: AssetData[]
  loading: boolean
  refresh: () => Promise<void>
}

const yahooDelay = 600 // ms between Yahoo calls to avoid 429
const ttlMs = 60_000 // auto-refresh when the cached range data is older than this
const checkMs = 15_000 // how often the staleness check runs

export function useAssetData(range: Range): UseAssetDataResult {
  const [cache, setCache] = useState<CacheShape>(() => loadCache())
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch the displayed range for every asset. Returns the new cache slice.
  const fetchRange = useCallback(async (current: CacheShape) => {
    const results = await Promise.allSettled(
      assets.map((asset, i) => async () => {
        if (i > 0) await new Promise(r => setTimeout(r, yahooDelay * i))
        return fetchYahoo(asset.symbol, range)
      }).map(fn => fn())
    )

    const fetchedAt = Date.now()
    const newByAsset: CacheShape['byAsset'] = { ...current.byAsset }
    const newErrors: Record<string, string> = {}

    results.forEach((r, i) => {
      const asset = assets[i]
      if (r.status === 'fulfilled') {
        const existing = newByAsset[asset.id] ?? {}
        newByAsset[asset.id] = { ...existing, [range]: { fetchedAt, data: r.value } }
      } else {
        newErrors[asset.id] = String(r.reason)
      }
    })

    setErrors(newErrors)
    return { byAsset: newByAsset } as Pick<CacheShape, 'byAsset'>
  }, [range])

  // Fetch ATH is removed: the card now shows the selected-period variation
  // instead of the all-time high, so we no longer need the range=max request.

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const rangeSlice = await fetchRange(cache)
      const newCache: CacheShape = { version: 3, byAsset: rangeSlice.byAsset }
      saveCache(newCache)
      setCache(newCache)
    } finally {
      setLoading(false)
    }
  }, [cache, fetchRange])

  // Keep the latest cache/refresh reachable from the staleness timer without
  // resetting the interval on every state change (refresh is re-created each
  // time the cache updates).
  const cacheRef = useRef(cache)
  useEffect(() => { cacheRef.current = cache }, [cache])
  const refreshRef = useRef(refresh)
  useEffect(() => { refreshRef.current = refresh }, [refresh])

  // Auto-refresh: while the tab is open, refetch the selected range when the
  // cached data gets older than ttlMs. All assets share one fetchedAt per
  // refresh, so checking the first asset is enough. lastAttemptRef caps retry
  // rate so a Yahoo failure doesn't hammer the proxy every checkMs.
  const lastAttemptRef = useRef(0)
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      if (now - lastAttemptRef.current < ttlMs) return
      const entry = cacheRef.current.byAsset?.[assets[0]?.id]?.[range]
      const stale = !entry || now - entry.fetchedAt > ttlMs
      if (stale) {
        lastAttemptRef.current = now
        refreshRef.current()
      }
    }, checkMs)
    return () => clearInterval(id)
  }, [range])

  const displayed = useMemo<AssetData[]>(() => {
    return assets.map(a => {
      const cached = cache.byAsset[a.id]?.[range]
      return {
        id: a.id,
        label: a.label,
        currency: a.currency,
        data: cached?.data ?? [],
        fetchedAt: cached?.fetchedAt ?? null,
        error: errors[a.id] ?? null,
      }
    })
  }, [cache, range, errors])

  return { assets: displayed, loading, refresh }
}
