import type { Range, DataPoint } from './types'

const STORAGE_KEY = 'invest:cache:v3'

export type CachedSeries = {
  fetchedAt: number
  data: DataPoint[]
}

export type CacheShape = {
  version: 3
  byAsset: Record<string, Partial<Record<Range, CachedSeries>>>
}

const empty: CacheShape = { version: 3, byAsset: {} }

export function loadCache(): CacheShape {
  if (typeof localStorage === 'undefined') return empty
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw)
    if (parsed?.version !== 3) return empty
    return {
      version: 3,
      byAsset: parsed.byAsset ?? {},
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