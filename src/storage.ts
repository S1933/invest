import type { Range, DataPoint } from './types'

const STORAGE_KEY = 'invest:cache:v2'

export type CachedSeries = {
  fetchedAt: number
  data: DataPoint[]
}

export type CachedAth = {
  fetchedAt: number
  price: number
  date: string
}

export type CacheShape = {
  version: 2
  byAsset: Record<string, Partial<Record<Range, CachedSeries>>>
  ath: Record<string, CachedAth>
}

const empty: CacheShape = { version: 2, byAsset: {}, ath: {} }

export function loadCache(): CacheShape {
  if (typeof localStorage === 'undefined') return empty
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // one-time migration from v1 (per-range only) to v2 (per-range + ath)
      const oldRaw = localStorage.getItem('invest:cache:v1')
      if (oldRaw) {
        try {
          const old = JSON.parse(oldRaw)
          if (old?.version === 1 && old.byAsset) {
            const migrated: CacheShape = { version: 2, byAsset: old.byAsset, ath: {} }
            saveCache(migrated)
            localStorage.removeItem('invest:cache:v1')
            return migrated
          }
        } catch {
          // fall through to empty
        }
        localStorage.removeItem('invest:cache:v1')
      }
      return empty
    }
    const parsed = JSON.parse(raw)
    if (parsed?.version !== 2) return empty
    return {
      version: 2,
      byAsset: parsed.byAsset ?? {},
      ath: parsed.ath ?? {},
    } as CacheShape
  } catch {
    return empty
  }
}

export function saveCache(c: CacheShape): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
  } catch {
    // quota exceeded or storage unavailable — silently ignore
  }
}

export function clearCache(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
