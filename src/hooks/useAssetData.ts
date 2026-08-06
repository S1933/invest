import { useState, useCallback, useMemo } from 'react'
import type { Range, DataPoint } from '../types'
import { assets } from '../assets'
import { fetchYahoo, fetchAth, type Ath } from '../api'
import { loadCache, saveCache, type CacheShape, type CachedAth } from '../storage'

export type AssetData = {
  id: string
  label: string
  currency: string
  data: DataPoint[]
  error: string | null
  fetchedAt: number | null
  ath: CachedAth | null
  athError: string | null
}

export type UseAssetDataResult = {
  assets: AssetData[]
  loading: boolean
  athLoading: boolean
  refresh: () => Promise<void>
}

const yahooDelay = 600 // ms between Yahoo calls to avoid 429

export function useAssetData(range: Range): UseAssetDataResult {
  const [cache, setCache] = useState<CacheShape>(() => loadCache())
  const [loading, setLoading] = useState(false)
  const [athLoading, setAthLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [athErrors, setAthErrors] = useState<Record<string, string>>({})

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

  // Fetch ATH (range=max) only for assets that don't have one cached yet.
  // ATH only goes up, so cached values stay valid for a long time.
  const fetchMissingAth = useCallback(async (current: CacheShape) => {
    const missing = assets.filter(a => !current.ath[a.id])
    if (missing.length === 0) return { ath: current.ath } as Pick<CacheShape, 'ath'>

    const results = await Promise.allSettled(
      missing.map((asset, i) => async () => {
        // offset stagger to avoid colliding with the range fetches above
        if (i > 0) await new Promise(r => setTimeout(r, yahooDelay * (i + 1)))
        return fetchAth(asset.symbol)
      }).map(fn => fn())
    )

    const fetchedAt = Date.now()
    const newAth: Record<string, CachedAth> = { ...current.ath }
    const newAthErrors: Record<string, string> = {}

    results.forEach((r, i) => {
      const asset = missing[i]
      if (r.status === 'fulfilled') {
        newAth[asset.id] = { ...r.value, fetchedAt }
      } else {
        newAthErrors[asset.id] = String(r.reason)
      }
    })

    setAthErrors(newAthErrors)
    return { ath: newAth } as Pick<CacheShape, 'ath'>
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setAthLoading(true)
    try {
      const rangeSlice = await fetchRange(cache)
      const newCache: CacheShape = { version: 2, byAsset: rangeSlice.byAsset, ath: cache.ath }
      const athSlice = await fetchMissingAth(newCache)
      const finalCache: CacheShape = { version: 2, byAsset: newCache.byAsset, ath: athSlice.ath }
      saveCache(finalCache)
      setCache(finalCache)
    } finally {
      setLoading(false)
      setAthLoading(false)
    }
  }, [cache, fetchRange, fetchMissingAth])

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
        ath: cache.ath[a.id] ?? null,
        athError: athErrors[a.id] ?? null,
      }
    })
  }, [cache, range, errors, athErrors])

  return { assets: displayed, loading, athLoading, refresh }
}

export type { Ath }
