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

export async function getBudgetProducts(projectId: string): Promise<BudgetProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('budget_products')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id as string,
    projectId: row.project_id as string,
    name: row.name as string,
    totalAmount: Number(row.total_amount),
    devis: row.devis as PaymentStage | undefined,
    acompte: row.acompte as PaymentStage | undefined,
    avancement: row.avancement as PaymentStage | undefined,
    solde: row.solde as PaymentStage | undefined,
  }))
}

export async function getAllBudgetProducts(): Promise<BudgetProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('budget_products')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id as string,
    projectId: row.project_id as string,
    name: row.name as string,
    totalAmount: Number(row.total_amount),
    devis: row.devis as PaymentStage | undefined,
    acompte: row.acompte as PaymentStage | undefined,
    avancement: row.avancement as PaymentStage | undefined,
    solde: row.solde as PaymentStage | undefined,
  }))
}
