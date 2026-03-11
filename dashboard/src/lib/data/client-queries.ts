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
  ProjectStatus,
  Document,
  BudgetProduct,
  PaymentStage,
  Subcontract,
} from '@/lib/types'

function toClient(row: Record<string, unknown>): Client {
  const contacts = (row.contacts as Record<string, unknown>[] | null) ?? []
  const primaryContact = contacts.find((c) => c.is_primary) ?? contacts[0]
  return {
    id: row.id as string,
    name: row.name as string,
    industry: (row.industry as string) ?? '',
    category: row.category as ClientCategory,
    status: (row.status as ClientStatus) ?? 'active',
    contact: primaryContact
      ? {
          name: (primaryContact.name as string) ?? '—',
          role: (primaryContact.role as string) ?? '—',
          email: (primaryContact.email as string) ?? '—',
          phone: (primaryContact.phone as string | undefined) ?? undefined,
        }
      : { name: '—', role: '—', email: '—' },
    color: (row.color as string) ?? '#71717a',
    since: (row.since as string | undefined) ?? undefined,
  }
}

function toProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    name: row.name as string,
    type: ((row.type as string) ?? 'other') as ProjectType,
    status: ((row.status as string) ?? 'draft') as ProjectStatus,
    description: (row.description as string) ?? '',
    progress: (row.progress as number) ?? 0,
    totalPhases: (row.total_phases as number) ?? 1,
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
  prospects: Client[]
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
    prospects: all.filter((c) => c.category === 'prospect'),
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
