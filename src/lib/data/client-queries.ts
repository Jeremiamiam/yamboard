// ─── Client-side data fetching (browser Supabase) ───────────────
// Same queries as server files, but with createClient() from browser.
// Used for SPA loadData at mount — 4 parallel requests.

import { createClient } from '@/lib/supabase/client'
import type {
  Client,
  ClientCategory,
  ClientStatus,
  Project,
  ProjectType,
  Document,
  BudgetProduct,
  PaymentStage,
  Subcontract,
  Todo,
} from '@/lib/types'

function toClient(row: Record<string, unknown>): Client {
  const contacts = (row.contacts as Record<string, unknown>[] | null) ?? []
  const primaryContact = contacts.find((c) => c.is_primary) ?? contacts[0]
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as ClientCategory,
    status: (row.status as ClientStatus) ?? 'active',
    contact: primaryContact
      ? {
          name: (primaryContact.name as string) ?? '—',
          email: (primaryContact.email as string) ?? '—',
          phone: (primaryContact.phone as string | undefined) ?? undefined,
        }
      : { name: '—', email: '—' },
    color: (row.color as string) ?? '#71717a',
    since: (row.since as string | undefined) ?? undefined,
    logoPath: (row.logo_path as string | null) ?? undefined,
  }
}

function toProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    name: row.name as string,
    type: ((row.type as string) ?? 'other') as ProjectType,
    description: (row.description as string) ?? '',
    lastActivity: (row.last_activity as string) ?? '—',
    startDate: (row.start_date as string) ?? '—',
    potentialAmount: row.potential_amount != null ? Number(row.potential_amount) : undefined,
  }
}

function toDocument(row: Record<string, unknown>): Document {
  const size = row.content
    ? `~${(row.content as string).split(/\s+/).filter(Boolean).length} mots`
    : '—'
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    projectId: (row.project_id as string | null) ?? undefined,
    name: row.name as string,
    type: row.type as Document['type'],
    updatedAt: new Date(row.updated_at as string).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    size,
    storagePath: (row.storage_path as string | null) ?? undefined,
    extractionStatus: (row.extraction_status as Document['extractionStatus']) ?? undefined,
    isPinned: (row.is_pinned as boolean) ?? false,
  }
}

function toAvancements(raw: unknown): PaymentStage[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) return raw as PaymentStage[];
  // Backward compat: old format stored a single PaymentStage object
  return [raw as PaymentStage];
}

function toBudgetProduct(row: Record<string, unknown>): BudgetProduct {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    name: row.name as string,
    totalAmount: Number(row.total_amount),
    devis: row.devis as PaymentStage | undefined,
    acompte: row.acompte as PaymentStage | undefined,
    avancements: toAvancements(row.avancement),
    solde: row.solde as PaymentStage | undefined,
    subcontracts: (row.subcontracts as Subcontract[] | null) ?? undefined,
  }
}

export async function fetchAllClients(): Promise<{
  clients: Client[]
  archived: Client[]
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, contacts(*)')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  const all: Client[] = (data ?? []).map((row) => toClient(row as Record<string, unknown>))
  return {
    clients: all.filter((c) => c.category === 'client'),
    archived: all.filter((c) => c.category === 'archived'),
  }
}

export async function fetchClient(clientId: string): Promise<Client | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, contacts(*)')
    .eq('id', clientId)
    .single()
  if (error) return null
  return toClient(data as Record<string, unknown>)
}

export async function fetchAllProjects(): Promise<Project[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => toProject(row as Record<string, unknown>))
}

export async function fetchAllDocuments(): Promise<Document[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('id, client_id, project_id, name, type, updated_at, storage_path, is_pinned, extraction_status')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => toDocument(row as Record<string, unknown>))
}

export async function fetchAllBudgetProducts(): Promise<BudgetProduct[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budget_products')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => toBudgetProduct(row as Record<string, unknown>))
}

// ─── Contacts (CRUD top bar) ────────────────────────────────────
export type ContactRow = {
  id: string
  clientId: string
  name: string
  email: string | null
  phone: string | null
  isPrimary: boolean
}

export async function fetchContactsForClient(clientId: string): Promise<ContactRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('id, client_id, name, email, phone, is_primary')
    .eq('client_id', clientId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    name: row.name ?? '',
    email: row.email ?? null,
    phone: row.phone ?? null,
    isPrimary: row.is_primary ?? false,
  }))
}

// ─── Liens externes (Figma, Dropbox, etc.) ───────────────────────
export type ClientLinkRow = {
  id: string
  clientId: string
  label: string
  url: string
}

export async function fetchClientLinks(clientId: string): Promise<ClientLinkRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_links')
    .select('id, client_id, label, url')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    label: row.label ?? '',
    url: row.url ?? '',
  }))
}

// ─── Journal d'activité (logs récents par client) ─────────────────
export type ClientActivityRow = {
  id: string
  clientId: string
  projectId: string | null
  actionType: string
  source: string
  summary: string
  metadata: Record<string, unknown> | null
  createdAt: string
  ownerId: string | null
  ownerName: string | null
}


export async function fetchClientActivityLogs(clientId: string, limit = 20): Promise<ClientActivityRow[]> {
  const supabase = createClient()
  const [logsResult, profilesResult] = await Promise.all([
    supabase
      .from('client_activity_logs')
      .select('id, client_id, project_id, action_type, source, summary, metadata, created_at, owner_id')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase.from('profiles').select('id, full_name'),
  ])
  if (logsResult.error) throw new Error(logsResult.error.message)
  const rows = logsResult.data ?? []
  const names: Record<string, string> = Object.fromEntries(
    (profilesResult.data ?? []).map((p) => [p.id, p.full_name])
  )
  return rows.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    projectId: row.project_id ?? null,
    actionType: row.action_type ?? '',
    source: row.source ?? 'manual',
    summary: row.summary ?? '',
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    createdAt: row.created_at ?? '',
    ownerId: row.owner_id ?? null,
    ownerName: row.owner_id ? (names[row.owner_id] ?? null) : null,
  }))
}

/** Activité récente pour la cloche (RLS filtre par owner_id = auth.uid()) */
export async function fetchRecentActivityForNotifications(limit = 20): Promise<ClientActivityRow[]> {
  const supabase = createClient()
  const [logsResult, profilesResult] = await Promise.all([
    supabase
      .from('client_activity_logs')
      .select('id, client_id, project_id, action_type, source, summary, metadata, created_at, owner_id')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase.from('profiles').select('id, full_name'),
  ])
  if (logsResult.error) throw new Error(logsResult.error.message)
  const rows = logsResult.data ?? []
  const names: Record<string, string> = Object.fromEntries(
    (profilesResult.data ?? []).map((p) => [p.id, p.full_name])
  )
  return rows.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    projectId: row.project_id ?? null,
    actionType: row.action_type ?? '',
    source: row.source ?? 'manual',
    summary: row.summary ?? '',
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    createdAt: row.created_at ?? '',
    ownerId: row.owner_id ?? null,
    ownerName: row.owner_id ? (names[row.owner_id] ?? null) : null,
  }))
}

// ─── Pending email suggestions ────────────────────────────────────

export type PendingSuggestionRow = {
  id: string
  clientId: string
  projectId: string | null
  type: 'contact' | 'note'
  data: { name?: string; email?: string; content?: string }
  fromEmail: string | null
  subject: string | null
  senderName: string | null
  createdAt: string
}

export async function fetchPendingSuggestions(limit = 20): Promise<PendingSuggestionRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pending_email_suggestions')
    .select('id, client_id, project_id, type, data, from_email, subject, sender_name, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []).map((row) => ({
    id: row.id as string,
    clientId: row.client_id as string,
    projectId: row.project_id as string | null,
    type: row.type as 'contact' | 'note',
    data: (row.data as { name?: string; email?: string; content?: string }) ?? {},
    fromEmail: row.from_email as string | null,
    subject: row.subject as string | null,
    senderName: row.sender_name as string | null,
    createdAt: (row.created_at as string) ?? '',
  }))
}

// ─── Todos ────────────────────────────────────────────────────

export async function fetchAllTodos(): Promise<Todo[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('todos')
    .select('id, text, done, created_at')
    .order('created_at', { ascending: true })
  return (data ?? []).map((row) => ({
    id: row.id as string,
    text: row.text as string,
    done: row.done as boolean,
    createdAt: row.created_at as string,
  }))
}

// ─── Webhook errors ────────────────────────────────────────────

export type WebhookErrorRow = {
  id: string
  source: string
  errorMessage: string
  details: Record<string, unknown> | null
  createdAt: string
}

export async function fetchWebhookErrors(limit = 20): Promise<WebhookErrorRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('webhook_errors')
    .select('id, source, error_message, details, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []).map((row) => ({
    id: row.id as string,
    source: row.source as string,
    errorMessage: row.error_message as string,
    details: (row.details as Record<string, unknown>) ?? null,
    createdAt: (row.created_at as string) ?? '',
  }))
}
