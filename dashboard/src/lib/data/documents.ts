import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Document, BudgetProduct, PaymentStage } from '@/lib/types'

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
    content: (row.content as string | null) ?? undefined,
    storagePath: (row.storage_path as string | null) ?? undefined,
  }
}

export async function getClientDocs(clientId: string): Promise<Document[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('client_id', clientId)
    .is('project_id', null)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toDocument)
}

// Client context (AI-2): docs where project_id IS NULL OR is_pinned = true
// This matches what the UI shows at client level — brand docs + pinned project docs
export async function getClientDocsWithPinned(clientId: string): Promise<Document[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('client_id', clientId)
    .or('project_id.is.null,is_pinned.eq.true')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toDocument)
}

export async function getProjectDocs(projectId: string): Promise<Document[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toDocument)
}

/** 1 requête pour N projets — évite N round-trips. Retourne Map projectId → Document[] */
export async function getProjectDocsForProjects(
  projectIds: string[]
): Promise<Record<string, Document[]>> {
  if (projectIds.length === 0) return {}
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .in('project_id', projectIds)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  const byProject: Record<string, Document[]> = {}
  for (const pid of projectIds) byProject[pid] = []
  for (const row of data ?? []) {
    const pid = row.project_id as string
    if (pid && byProject[pid]) byProject[pid].push(toDocument(row as Record<string, unknown>))
  }
  return byProject
}

export async function getBudgetProducts(projectId: string): Promise<BudgetProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('budget_products')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => toBudgetProduct(row as Record<string, unknown>))
}

export async function getAllBudgetProducts(): Promise<BudgetProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('budget_products')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => toBudgetProduct(row as Record<string, unknown>))
}

/** 1 requête pour N projets — évite N round-trips. Retourne Map projectId → BudgetProduct[] */
export async function getBudgetProductsForProjects(
  projectIds: string[]
): Promise<Record<string, BudgetProduct[]>> {
  if (projectIds.length === 0) return {}
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('budget_products')
    .select('*')
    .in('project_id', projectIds)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  const rows = (data ?? []).map((row) => toBudgetProduct(row as Record<string, unknown>))
  const byProject: Record<string, BudgetProduct[]> = {}
  for (const pid of projectIds) byProject[pid] = []
  for (const row of rows) {
    byProject[row.projectId].push(row)
  }
  return byProject
}

function toBudgetProduct(row: Record<string, unknown>): BudgetProduct {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    name: row.name as string,
    totalAmount: Number(row.total_amount),
    devis: row.devis as PaymentStage | undefined,
    acompte: row.acompte as PaymentStage | undefined,
    avancement: row.avancement as PaymentStage | undefined,
    solde: row.solde as PaymentStage | undefined,
  }
}
