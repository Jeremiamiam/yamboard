// ─── Zustand store for SPA data ────────────────────────────────
// Single source of truth: clients, projects, documents, budgetProducts.
// loadData: cache first (stale) → fetch → update store + cache.

import { create } from 'zustand'
import type { Client, Project, Document, BudgetProduct } from '@/lib/types'
import type { CachedData } from '@/lib/cache'
import { loadFromCache, saveToCache } from '@/lib/cache'
import {
  fetchAllClients,
  fetchAllProjects,
  fetchAllDocuments,
  fetchAllBudgetProducts,
} from '@/lib/data/client-queries'

export type StoreState = {
  clients: Client[]
  prospects: Client[]
  archived: Client[]
  projects: Project[]
  documents: Document[]
  budgetProducts: BudgetProduct[]
  loading: boolean
  loaded: boolean
  error: string | null
  viewerDocId: string | null
}

type StoreActions = {
  loadData: () => Promise<void>
  setClients: (clients: Client[], prospects: Client[], archived: Client[]) => void
  setProjects: (projects: Project[]) => void
  setDocuments: (documents: Document[]) => void
  setBudgetProducts: (budgetProducts: BudgetProduct[]) => void
  updateDocument: (docId: string, updates: Partial<Document>) => void
  setViewerDocId: (id: string | null) => void
}

function toCachedData(state: StoreState): CachedData {
  return {
    clients: state.clients.concat(state.prospects).concat(state.archived),
    projects: state.projects,
    documents: state.documents,
    budgetProducts: state.budgetProducts,
  }
}

function fromCachedData(data: CachedData): Partial<StoreState> {
  return {
    clients: data.clients.filter((c) => c.category === 'client'),
    prospects: data.clients.filter((c) => c.category === 'prospect'),
    archived: data.clients.filter((c) => c.category === 'archived'),
    projects: data.projects,
    documents: data.documents,
    budgetProducts: data.budgetProducts,
  }
}

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  clients: [],
  prospects: [],
  archived: [],
  projects: [],
  documents: [],
  budgetProducts: [],
  loading: false,
  loaded: false,
  error: null,
  viewerDocId: null,

  loadData: async () => {
    if (get().loading) return
    set({ loading: true, error: null })
    const cached = loadFromCache()
    if (cached) {
      set({ ...fromCachedData(cached), loaded: true })
    }

    try {
      const [clientsRes, projects, documents, budgetProducts] = await Promise.all([
        fetchAllClients(),
        fetchAllProjects(),
        fetchAllDocuments(),
        fetchAllBudgetProducts(),
      ])
      const state: StoreState = {
        clients: clientsRes.clients,
        prospects: clientsRes.prospects,
        archived: clientsRes.archived,
        projects,
        documents,
        budgetProducts,
        loading: false,
        loaded: true,
        error: null,
        viewerDocId: get().viewerDocId,
      }
      set(state)
      saveToCache(toCachedData(state))
    } catch (err) {
      console.error('[store] loadData failed:', err)
      set({ loading: false, error: err instanceof Error ? err.message : 'Erreur de chargement' })
    }
  },

  setClients: (clients, prospects, archived) => set({ clients, prospects, archived }),
  setProjects: (projects) => set({ projects }),
  setDocuments: (documents) => set({ documents }),
  setBudgetProducts: (budgetProducts) => set({ budgetProducts }),
  updateDocument: (docId, updates) =>
    set((s) => ({
      documents: s.documents.map((d) => (d.id === docId ? { ...d, ...updates } : d)),
    })),
  setViewerDocId: (id) => set({ viewerDocId: id }),
}))

// ─── Getters ───────────────────────────────────────────────────
// Each getter accepts only the slices it needs so hooks can select
// minimal state without passing the full StoreState.

export function getClient(
  store: Pick<StoreState, 'clients' | 'prospects' | 'archived'>,
  id: string
): Client | undefined {
  return [...store.clients, ...store.prospects, ...store.archived].find((c) => c.id === id)
}

export function getClientProjects(
  store: Pick<StoreState, 'projects'>,
  clientId: string
): Project[] {
  return store.projects.filter((p) => p.clientId === clientId)
}

/** Docs de marque client : project_id null OU épinglés depuis un projet */
export function getClientDocs(
  store: Pick<StoreState, 'documents'>,
  clientId: string
): Document[] {
  return store.documents.filter(
    (d) => d.clientId === clientId && (!d.projectId || d.isPinned)
  )
}

export function getProjectDocs(
  store: Pick<StoreState, 'documents'>,
  projectId: string
): Document[] {
  return store.documents.filter((d) => d.projectId === projectId)
}

export function getBudgetProducts(
  store: Pick<StoreState, 'budgetProducts'>,
  projectId: string
): BudgetProduct[] {
  return store.budgetProducts.filter((bp) => bp.projectId === projectId)
}

export function getBudgetProductsForClient(
  store: Pick<StoreState, 'projects' | 'budgetProducts'>,
  clientId: string
): Record<string, BudgetProduct[]> {
  const byProject: Record<string, BudgetProduct[]> = {}
  const projectIds = store.projects.filter((p) => p.clientId === clientId).map((p) => p.id)
  for (const pid of projectIds) byProject[pid] = []
  for (const bp of store.budgetProducts) {
    if (bp.projectId && projectIds.includes(bp.projectId)) {
      if (!byProject[bp.projectId]) byProject[bp.projectId] = []
      byProject[bp.projectId].push(bp)
    }
  }
  return byProject
}

export const sidebarClients = (s: StoreState) => s.clients
export const sidebarProspects = (s: StoreState) => s.prospects
export const sidebarArchived = (s: StoreState) => s.archived
