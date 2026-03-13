// ─── Zustand store for SPA data ────────────────────────────────
// Single source of truth: clients, projects, documents, budgetProducts.
// loadData: cache first (stale) → fetch → update store + cache.

import { create } from 'zustand'
import type { Client, Project, Document, BudgetProduct, Todo } from '@/lib/types'
import type { CachedData } from '@/lib/cache'
import { loadFromCache, saveToCache } from '@/lib/cache'
import {
  fetchAllClients,
  fetchAllProjects,
  fetchAllDocuments,
  fetchAllBudgetProducts,
  fetchAllTodos,
} from '@/lib/data/client-queries'

export type AppView = 'home' | 'client' | 'project' | 'compta'
export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export type StoreState = {
  clients: Client[]
  archived: Client[]
  projects: Project[]
  documents: Document[]
  budgetProducts: BudgetProduct[]
  todos: Todo[]
  loading: boolean
  loaded: boolean
  error: string | null
  viewerDocId: string | null
  // ── SPA navigation ──────────────────────────────────────────
  currentView: AppView
  selectedClientId: string | null
  selectedProjectId: string | null
  // ── UI state ────────────────────────────────────────────────
  sidebarOpen: boolean
  detailSidebarOpen: boolean
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  userName: string
}

type StoreActions = {
  loadData: () => Promise<void>
  setClients: (clients: Client[], archived: Client[]) => void
  setProjects: (projects: Project[]) => void
  setDocuments: (documents: Document[]) => void
  setBudgetProducts: (budgetProducts: BudgetProduct[]) => void
  setTodos: (todos: Todo[]) => void
  updateDocument: (docId: string, updates: Partial<Document>) => void
  setViewerDocId: (id: string | null) => void
  // ── SPA navigation ──────────────────────────────────────────
  navigateTo: (clientId: string, projectId?: string) => void
  navigateToCompta: () => void
  navigateHome: () => void
  // ── UI state ────────────────────────────────────────────────
  toggleSidebar: () => void
  closeSidebar: () => void
  toggleDetailSidebar: () => void
  closeDetailSidebar: () => void
  initTheme: () => void
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
  setUserName: (name: string) => void
}

function toCachedData(state: StoreState): CachedData {
  return {
    clients: state.clients.concat(state.archived),
    projects: state.projects,
    documents: state.documents,
    budgetProducts: state.budgetProducts,
  }
}

function fromCachedData(data: CachedData): Partial<StoreState> {
  return {
    clients: data.clients.filter((c) => c.category === 'client'),
    archived: data.clients.filter((c) => c.category === 'archived'),
    projects: data.projects,
    documents: data.documents,
    budgetProducts: data.budgetProducts,
  }
}

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  clients: [],
  archived: [],
  projects: [],
  documents: [],
  budgetProducts: [],
  todos: [],
  loading: false,
  loaded: false,
  error: null,
  viewerDocId: null,
  currentView: 'home',
  selectedClientId: null,
  selectedProjectId: null,
  sidebarOpen: false,
  detailSidebarOpen: false,
  theme: 'system',
  resolvedTheme: 'light',
  userName: '',

  loadData: async () => {
    if (get().loading) return
    set({ loading: true, error: null })
    const cached = loadFromCache()
    if (cached) {
      set({ ...fromCachedData(cached), loaded: true })
    }

    try {
      const [clientsRes, projects, documents, budgetProducts, todos] = await Promise.all([
        fetchAllClients(),
        fetchAllProjects(),
        fetchAllDocuments(),
        fetchAllBudgetProducts(),
        fetchAllTodos(),
      ])
      const state: StoreState = {
        clients: clientsRes.clients,
        archived: clientsRes.archived,
        projects,
        documents,
        budgetProducts,
        todos,
        loading: false,
        loaded: true,
        error: null,
        viewerDocId: get().viewerDocId,
        currentView: get().currentView,
        selectedClientId: get().selectedClientId,
        selectedProjectId: get().selectedProjectId,
        sidebarOpen: get().sidebarOpen,
        detailSidebarOpen: get().detailSidebarOpen,
        theme: get().theme,
        resolvedTheme: get().resolvedTheme,
        userName: get().userName,
      }
      set(state)
      saveToCache(toCachedData(state))
    } catch (err) {
      console.error('[store] loadData failed:', err)
      set({ loading: false, error: err instanceof Error ? err.message : 'Erreur de chargement' })
    }
  },

  setClients: (clients, archived) => set({ clients, archived }),
  setProjects: (projects) => set({ projects }),
  setDocuments: (documents) => set({ documents }),
  setBudgetProducts: (budgetProducts) => set({ budgetProducts }),
  setTodos: (todos) => set({ todos }),
  updateDocument: (docId, updates) =>
    set((s) => ({
      documents: s.documents.map((d) => (d.id === docId ? { ...d, ...updates } : d)),
    })),
  setViewerDocId: (id) => set({ viewerDocId: id }),

  navigateTo: (clientId, projectId) => {
    if (projectId) {
      set({ currentView: 'project', selectedClientId: clientId, selectedProjectId: projectId, detailSidebarOpen: false })
      if (typeof window !== 'undefined') window.history.pushState(null, '', `/${clientId}/${projectId}`)
    } else {
      set({ currentView: 'client', selectedClientId: clientId, selectedProjectId: null, detailSidebarOpen: false })
      if (typeof window !== 'undefined') window.history.pushState(null, '', `/${clientId}`)
    }
  },
  navigateToCompta: () => {
    set({ currentView: 'compta', selectedClientId: null, selectedProjectId: null, detailSidebarOpen: false })
    if (typeof window !== 'undefined') window.history.pushState(null, '', '/compta')
  },
  navigateHome: () => {
    set({ currentView: 'home', selectedClientId: null, selectedProjectId: null, detailSidebarOpen: false })
    if (typeof window !== 'undefined') window.history.pushState(null, '', '/')
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleDetailSidebar: () => set((s) => ({ detailSidebarOpen: !s.detailSidebarOpen })),
  closeDetailSidebar: () => set({ detailSidebarOpen: false }),

  initTheme: () => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('theme') as ThemePreference | null
    const valid: ThemePreference[] = ['light', 'dark', 'system']
    const pref: ThemePreference = stored && valid.includes(stored) ? stored : 'system'
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolved: ResolvedTheme = pref === 'system' ? (prefersDark ? 'dark' : 'light') : pref
    set({ theme: pref, resolvedTheme: resolved })
    // Listen for OS theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', (e) => {
      const current = get().theme
      if (current === 'system') {
        const r: ResolvedTheme = e.matches ? 'dark' : 'light'
        set({ resolvedTheme: r })
        applyThemeToDom(r)
      }
    })
  },
  setTheme: (theme) => {
    const prefersDark = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
    const resolved: ResolvedTheme = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
    set({ theme, resolvedTheme: resolved })
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
      applyThemeToDom(resolved)
    }
  },
  toggleTheme: () => {
    const resolved = get().resolvedTheme
    const next: ThemePreference = resolved === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
  setUserName: (name) => set({ userName: name }),
}))

function applyThemeToDom(resolved: ResolvedTheme) {
  const html = document.documentElement
  html.setAttribute('data-theme', resolved)
  html.classList.toggle('dark', resolved === 'dark')
}

// ─── Getters ───────────────────────────────────────────────────
// Each getter accepts only the slices it needs so hooks can select
// minimal state without passing the full StoreState.

export function getClient(
  store: Pick<StoreState, 'clients' | 'archived'>,
  id: string
): Client | undefined {
  return [...store.clients, ...store.archived].find((c) => c.id === id)
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
export const sidebarArchived = (s: StoreState) => s.archived
