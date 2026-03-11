// ─── Store mutations (optimistic update → persist → rollback on error) ─
// Replaces server actions for clients, projects, contacts, budget.
// Document upload/extract stays server-side.

import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { invalidateCache } from '@/lib/cache'
import type {
  Client,
  ClientCategory,
  ClientStatus,
  Project,
  ProjectType,
  ProjectStatus,
  BudgetProduct,
  PaymentStage,
  Subcontract,
} from '@/lib/types'

// ─── Auth helper ────────────────────────────────────────────────
// Single Supabase client per call — avoids double instantiation.
async function getAuth() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, userId: user.id }
}

// ─── Clients ────────────────────────────────────────────────────

export async function createClientAction(params: {
  name: string
  industry?: string
  category?: ClientCategory
  status?: ClientStatus
  color?: string
}): Promise<{ error: string | null; clientId?: string }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: params.name,
      industry: params.industry ?? null,
      category: params.category ?? 'client',
      status: params.status ?? 'active',
      color: params.color ?? null,
      owner_id: userId,
    })
    .select('id')
    .single()

  if (error) { toast.error(error.message); return { error: error.message } }

  const optimistic: Client = {
    id: data.id,
    name: params.name,
    industry: params.industry ?? '',
    category: params.category ?? 'client',
    status: params.status ?? 'active',
    color: params.color ?? '#71717a',
    contact: { name: '—', role: '—', email: '—' },
  }
  addClient(optimistic)
  toast.success(params.category === 'prospect' ? 'Prospect créé' : 'Client créé')
  invalidateCache()
  return { error: null, clientId: data.id }
}

export async function updateClientAction(
  clientId: string,
  updates: { name?: string; industry?: string; status?: ClientStatus; color?: string; logoPath?: string | null }
): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const client = getClientFromState(useStore.getState(), clientId)
  if (!client) return { error: 'Client not found' }

  const merged: Client = {
    ...client,
    ...updates,
    logoPath: updates.logoPath === null ? undefined : (updates.logoPath ?? client.logoPath),
  }
  applyClientUpdate(merged)

  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.industry !== undefined) dbUpdates.industry = updates.industry
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.color !== undefined) dbUpdates.color = updates.color
  if (updates.logoPath !== undefined) dbUpdates.logo_path = updates.logoPath

  const { error } = await supabase
    .from('clients')
    .update(dbUpdates)
    .eq('id', clientId)
    .eq('owner_id', userId)

  if (error) {
    applyClientUpdate(client)
    toast.error(error.message)
    return { error: error.message }
  }
  invalidateCache()
  return { error: null }
}

export async function archiveClientAction(clientId: string): Promise<{ error: string | null }> {
  const result = await setClientCategory(clientId, 'archived')
  if (result.error) toast.error(result.error)
  else toast.success('Client archivé')
  return result
}

export async function unarchiveClientAction(clientId: string): Promise<{ error: string | null }> {
  const result = await setClientCategory(clientId, 'client')
  if (result.error) toast.error(result.error)
  else toast.success('Client restauré')
  return result
}

export async function convertProspectAction(clientId: string): Promise<{ error: string | null }> {
  const result = await setClientCategory(clientId, 'client')
  if (result.error) toast.error(result.error)
  else toast.success('Prospect converti en client')
  return result
}

export async function deleteClientAction(clientId: string): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const client = getClientFromState(useStore.getState(), clientId)
  if (!client) return { error: 'Client not found' }

  removeClient(client)

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('owner_id', userId)

  if (error) {
    addClient(client)
    toast.error(error.message)
    return { error: error.message }
  }
  toast.success('Client supprimé')
  invalidateCache()
  return { error: null }
}

// ─── Client helpers ─────────────────────────────────────────────

async function setClientCategory(
  clientId: string,
  category: ClientCategory
): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const client = getClientFromState(useStore.getState(), clientId)
  if (!client) return { error: 'Client not found' }

  const moved = { ...client, category }
  moveClientBetweenLists(client, moved)

  const { error } = await supabase
    .from('clients')
    .update({ category })
    .eq('id', clientId)
    .eq('owner_id', userId)

  if (error) {
    moveClientBetweenLists(moved, client)
    return { error: error.message }
  }
  invalidateCache()
  return { error: null }
}

function getClientFromState(
  state: { clients: Client[]; prospects: Client[]; archived: Client[] },
  id: string
): Client | undefined {
  return [...state.clients, ...state.prospects, ...state.archived].find((c) => c.id === id)
}

function applyClientUpdate(client: Client) {
  const replace = (arr: Client[], c: Client) => arr.map((x) => (x.id === c.id ? c : x))
  useStore.setState((s) => {
    if (s.clients.some((x) => x.id === client.id)) return { clients: replace(s.clients, client) }
    if (s.prospects.some((x) => x.id === client.id)) return { prospects: replace(s.prospects, client) }
    if (s.archived.some((x) => x.id === client.id)) return { archived: replace(s.archived, client) }
    return {}
  })
}

function moveClientBetweenLists(from: Client, to: Client) {
  useStore.setState((s) => {
    const remove = (arr: Client[]) => arr.filter((x) => x.id !== from.id)
    let { clients, prospects, archived } = s
    clients = remove(clients)
    prospects = remove(prospects)
    archived = remove(archived)
    if (to.category === 'client') clients = [...clients, to]
    else if (to.category === 'prospect') prospects = [...prospects, to]
    else archived = [...archived, to]
    return { clients, prospects, archived }
  })
}

function removeClient(client: Client) {
  useStore.setState((s) => ({
    clients: s.clients.filter((c) => c.id !== client.id),
    prospects: s.prospects.filter((c) => c.id !== client.id),
    archived: s.archived.filter((c) => c.id !== client.id),
  }))
}

function addClient(client: Client) {
  useStore.setState((s) => {
    if (client.category === 'client') return { clients: [...s.clients, client] }
    if (client.category === 'prospect') return { prospects: [...s.prospects, client] }
    return { archived: [...s.archived, client] }
  })
}

// ─── Projects ───────────────────────────────────────────────────

export async function createProjectAction(params: {
  clientId: string
  name: string
  type?: ProjectType
  status?: ProjectStatus
  description?: string
  potentialAmount?: number
}): Promise<{ error: string | null; projectId?: string }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const { data, error } = await supabase
    .from('projects')
    .insert({
      client_id: params.clientId,
      name: params.name,
      type: params.type ?? 'other',
      status: params.status ?? 'draft',
      description: params.description ?? null,
      potential_amount: params.potentialAmount ?? null,
      owner_id: userId,
    })
    .select('id')
    .single()

  if (error) { toast.error(error.message); return { error: error.message } }

  const optimistic: Project = {
    id: data.id,
    clientId: params.clientId,
    name: params.name,
    type: params.type ?? 'other',
    status: params.status ?? 'draft',
    description: params.description ?? '',
    progress: 0,
    totalPhases: 1,
    lastActivity: '—',
    startDate: '—',
    potentialAmount: params.potentialAmount,
  }
  useStore.setState((s) => ({ projects: [...s.projects, optimistic] }))
  toast.success('Projet créé')
  invalidateCache()
  return { error: null, projectId: data.id }
}

export async function updateProjectAction(
  projectId: string,
  updates: {
    name?: string
    type?: ProjectType
    status?: ProjectStatus
    description?: string
    potentialAmount?: number
    progress?: number
  }
): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const project = useStore.getState().projects.find((p) => p.id === projectId)
  if (!project) return { error: 'Project not found' }

  useStore.setState((s) => ({
    projects: s.projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p)),
  }))

  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.type !== undefined) dbUpdates.type = updates.type
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.potentialAmount !== undefined) dbUpdates.potential_amount = updates.potentialAmount
  if (updates.progress !== undefined) dbUpdates.progress = updates.progress

  const { error } = await supabase
    .from('projects')
    .update(dbUpdates)
    .eq('id', projectId)
    .eq('owner_id', userId)

  if (error) {
    useStore.setState((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? project : p)),
    }))
    toast.error(error.message)
    return { error: error.message }
  }
  invalidateCache()
  return { error: null }
}

export async function deleteProjectAction(projectId: string): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const project = useStore.getState().projects.find((p) => p.id === projectId)
  if (!project) return { error: 'Project not found' }

  const prevDocs = useStore.getState().documents.filter((d) => d.projectId === projectId)
  const prevBudget = useStore.getState().budgetProducts.filter((bp) => bp.projectId === projectId)

  useStore.setState((s) => ({
    projects: s.projects.filter((p) => p.id !== projectId),
    documents: s.documents.filter((d) => d.projectId !== projectId),
    budgetProducts: s.budgetProducts.filter((bp) => bp.projectId !== projectId),
  }))

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('owner_id', userId)

  if (error) {
    useStore.setState((s) => ({
      projects: [...s.projects, project],
      documents: [...s.documents, ...prevDocs],
      budgetProducts: [...s.budgetProducts, ...prevBudget],
    }))
    toast.error(error.message)
    return { error: error.message }
  }
  toast.success('Projet supprimé')
  invalidateCache()
  return { error: null }
}

// ─── Budget ────────────────────────────────────────────────────

export async function createBudgetProductAction(params: {
  projectId: string
  name: string
  totalAmount?: number
}): Promise<{ error: string | null; productId?: string }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const { data, error } = await supabase
    .from('budget_products')
    .insert({
      project_id: params.projectId,
      name: params.name,
      total_amount: params.totalAmount ?? 0,
      owner_id: userId,
    })
    .select('id')
    .single()

  if (error) { toast.error(error.message); return { error: error.message } }

  const optimistic: BudgetProduct = {
    id: data.id,
    projectId: params.projectId,
    name: params.name,
    totalAmount: params.totalAmount ?? 0,
  }
  useStore.setState((s) => ({ budgetProducts: [...s.budgetProducts, optimistic] }))
  toast.success('Produit ajouté')
  invalidateCache()
  return { error: null, productId: data.id }
}

export async function updateBudgetProductAction(
  productId: string,
  updates: { name?: string; totalAmount?: number }
): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const product = useStore.getState().budgetProducts.find((p) => p.id === productId)
  if (!product) return { error: 'Product not found' }

  useStore.setState((s) => ({
    budgetProducts: s.budgetProducts.map((p) =>
      p.id === productId ? { ...p, ...updates } : p
    ),
  }))

  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount

  const { error } = await supabase
    .from('budget_products')
    .update(dbUpdates)
    .eq('id', productId)
    .eq('owner_id', userId)

  if (error) {
    useStore.setState((s) => ({
      budgetProducts: s.budgetProducts.map((p) => (p.id === productId ? product : p)),
    }))
    toast.error(error.message)
    return { error: error.message }
  }
  invalidateCache()
  return { error: null }
}

export async function deleteBudgetProductAction(productId: string): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const product = useStore.getState().budgetProducts.find((p) => p.id === productId)
  if (!product) return { error: 'Product not found' }

  useStore.setState((s) => ({
    budgetProducts: s.budgetProducts.filter((p) => p.id !== productId),
  }))

  const { error } = await supabase
    .from('budget_products')
    .delete()
    .eq('id', productId)
    .eq('owner_id', userId)

  if (error) {
    useStore.setState((s) => ({
      budgetProducts: [...s.budgetProducts, product],
    }))
    toast.error(error.message)
    return { error: error.message }
  }
  toast.success('Produit supprimé')
  invalidateCache()
  return { error: null }
}

export async function updatePaymentStageAction(
  productId: string,
  stage: 'devis' | 'acompte' | 'solde',
  value: { amount?: number; date?: string; status: 'pending' | 'sent' | 'paid' }
): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const product = useStore.getState().budgetProducts.find((p) => p.id === productId)
  if (!product) return { error: 'Product not found' }

  useStore.setState((s) => ({
    budgetProducts: s.budgetProducts.map((p) =>
      p.id === productId ? { ...p, [stage]: value as PaymentStage } : p
    ),
  }))

  const { error } = await supabase
    .from('budget_products')
    .update({ [stage]: value })
    .eq('id', productId)
    .eq('owner_id', userId)

  if (error) {
    useStore.setState((s) => ({
      budgetProducts: s.budgetProducts.map((p) => (p.id === productId ? product : p)),
    }))
    toast.error(error.message)
    return { error: error.message }
  }
  invalidateCache()
  return { error: null }
}

/** Met à jour la liste complète des avancements (tableau stocké dans la colonne `avancement`). */
export async function setAvancementsAction(
  productId: string,
  avancements: PaymentStage[]
): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const product = useStore.getState().budgetProducts.find((p) => p.id === productId)
  if (!product) return { error: 'Product not found' }

  useStore.setState((s) => ({
    budgetProducts: s.budgetProducts.map((p) =>
      p.id === productId ? { ...p, avancements } : p
    ),
  }))

  const { error } = await supabase
    .from('budget_products')
    .update({ avancement: avancements })
    .eq('id', productId)
    .eq('owner_id', userId)

  if (error) {
    useStore.setState((s) => ({
      budgetProducts: s.budgetProducts.map((p) => (p.id === productId ? product : p)),
    }))
    toast.error(error.message)
    return { error: error.message }
  }
  invalidateCache()
  return { error: null }
}

/** Met à jour la liste complète des sous-traitances. */
export async function setSubcontractsAction(
  productId: string,
  subcontracts: Subcontract[]
): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const product = useStore.getState().budgetProducts.find((p) => p.id === productId)
  if (!product) return { error: 'Product not found' }

  useStore.setState((s) => ({
    budgetProducts: s.budgetProducts.map((p) =>
      p.id === productId ? { ...p, subcontracts } : p
    ),
  }))

  const { error } = await supabase
    .from('budget_products')
    .update({ subcontracts })
    .eq('id', productId)
    .eq('owner_id', userId)

  if (error) {
    useStore.setState((s) => ({
      budgetProducts: s.budgetProducts.map((p) => (p.id === productId ? product : p)),
    }))
    toast.error(error.message)
    return { error: error.message }
  }
  invalidateCache()
  return { error: null }
}

// ─── Contacts ───────────────────────────────────────────────────
// Client.contact reflects the primary contact only.
// Optimistic: patch client.contact directly when the primary changes.
// Non-primary mutations have no visible effect on the store.

export async function createContactAction(params: {
  clientId: string
  name: string
  role?: string
  email?: string
  phone?: string
  isPrimary?: boolean
}): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const prevClient = getClientFromState(useStore.getState(), params.clientId)

  if (params.isPrimary) {
    await supabase
      .from('contacts')
      .update({ is_primary: false })
      .eq('client_id', params.clientId)
      .eq('owner_id', userId)
    if (prevClient) {
      applyClientUpdate({
        ...prevClient,
        contact: {
          name: params.name,
          role: params.role ?? '—',
          email: params.email ?? '—',
          phone: params.phone,
        },
      })
    }
  }

  const { error } = await supabase.from('contacts').insert({
    client_id: params.clientId,
    name: params.name,
    role: params.role ?? null,
    email: params.email ?? null,
    phone: params.phone ?? null,
    is_primary: params.isPrimary ?? false,
    owner_id: userId,
  })

  if (error) {
    if (prevClient) applyClientUpdate(prevClient)
    toast.error(error.message)
    return { error: error.message }
  }
  toast.success('Contact ajouté')
  invalidateCache()
  return { error: null }
}

export async function updateContactAction(
  contactId: string,
  updates: { name?: string; role?: string; email?: string; phone?: string; isPrimary?: boolean }
): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const { data: contact } = await supabase
    .from('contacts')
    .select('client_id, is_primary, name, role, email, phone')
    .eq('id', contactId)
    .eq('owner_id', userId)
    .single()

  if (!contact) return { error: 'Contact not found' }

  const prevClient = getClientFromState(useStore.getState(), contact.client_id)
  const affectsPrimary = contact.is_primary || updates.isPrimary

  if (updates.isPrimary) {
    await supabase
      .from('contacts')
      .update({ is_primary: false })
      .eq('client_id', contact.client_id)
      .eq('owner_id', userId)
  }

  if (affectsPrimary && prevClient) {
    applyClientUpdate({
      ...prevClient,
      contact: {
        name: updates.name ?? contact.name ?? '—',
        role: updates.role ?? contact.role ?? '—',
        email: updates.email ?? contact.email ?? '—',
        phone: updates.phone ?? contact.phone ?? undefined,
      },
    })
  }

  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.role !== undefined) dbUpdates.role = updates.role
  if (updates.email !== undefined) dbUpdates.email = updates.email
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone
  if (updates.isPrimary !== undefined) dbUpdates.is_primary = updates.isPrimary

  const { error } = await supabase
    .from('contacts')
    .update(dbUpdates)
    .eq('id', contactId)
    .eq('owner_id', userId)

  if (error) {
    if (prevClient) applyClientUpdate(prevClient)
    toast.error(error.message)
    return { error: error.message }
  }
  invalidateCache()
  return { error: null }
}

export async function deleteContactAction(contactId: string): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const { data: contact } = await supabase
    .from('contacts')
    .select('client_id, is_primary')
    .eq('id', contactId)
    .eq('owner_id', userId)
    .single()

  const prevClient = contact
    ? getClientFromState(useStore.getState(), contact.client_id)
    : undefined

  // Optimistic: if deleting the primary, clear the embedded contact
  if (contact?.is_primary && prevClient) {
    applyClientUpdate({ ...prevClient, contact: { name: '—', role: '—', email: '—' } })
  }

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('owner_id', userId)

  if (error) {
    if (prevClient) applyClientUpdate(prevClient)
    toast.error(error.message)
    return { error: error.message }
  }
  toast.success('Contact supprimé')
  invalidateCache()
  return { error: null }
}

// ─── Liens externes (Figma, Dropbox, Drive, etc.) ─────────────────

export async function createClientLinkAction(params: {
  clientId: string
  label: string
  url: string
}): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const { error } = await supabase.from('client_links').insert({
    client_id: params.clientId,
    label: params.label.trim(),
    url: params.url.trim(),
    owner_id: userId,
  })

  if (error) {
    toast.error(error.message)
    return { error: error.message }
  }
  toast.success('Lien ajouté')
  invalidateCache()
  return { error: null }
}

export async function updateClientLinkAction(
  linkId: string,
  updates: { label?: string; url?: string }
): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const dbUpdates: Record<string, unknown> = {}
  if (updates.label !== undefined) dbUpdates.label = updates.label.trim()
  if (updates.url !== undefined) dbUpdates.url = updates.url.trim()

  const { error } = await supabase
    .from('client_links')
    .update(dbUpdates)
    .eq('id', linkId)
    .eq('owner_id', userId)

  if (error) {
    toast.error(error.message)
    return { error: error.message }
  }
  toast.success('Lien mis à jour')
  invalidateCache()
  return { error: null }
}

export async function deleteClientLinkAction(linkId: string): Promise<{ error: string | null }> {
  const auth = await getAuth()
  if (!auth) return { error: 'Not authenticated' }
  const { supabase, userId } = auth

  const { error } = await supabase
    .from('client_links')
    .delete()
    .eq('id', linkId)
    .eq('owner_id', userId)

  if (error) {
    toast.error(error.message)
    return { error: error.message }
  }
  toast.success('Lien supprimé')
  invalidateCache()
  return { error: null }
}
