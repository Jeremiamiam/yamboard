// ─── localStorage cache for SPA data ───────────────────────────
// Stale-while-revalidate: load from cache immediately, refresh in background.

import type { Client, Project, Document, BudgetProduct } from '@/lib/types'

const CACHE_KEY = 'brandon_cache'
const CACHE_TS_KEY = 'brandon_cache_ts'

export type CachedData = {
  clients: Client[]
  projects: Project[]
  documents: Document[]
  budgetProducts: BudgetProduct[]
}

export function loadFromCache(): CachedData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CachedData
  } catch {
    return null
  }
}

export function saveToCache(data: CachedData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(CACHE_TS_KEY, Date.now().toString())
  } catch {
    // ignore quota / private mode
  }
}

export function invalidateCache(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CACHE_TS_KEY)
  // Keep data for stale display; next loadData will fetch fresh
}
