'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { ProjectType, ProjectStatus } from '@/lib/mock'

// ─── createProject ─────────────────────────────────────────────
// INSERT a new project row owned by the authenticated user.
// Returns projectId on success so callers can navigate to the new project.
// revalidatePath('/[clientId]') to refresh the client's project list.
export async function createProject(params: {
  clientId: string
  name: string
  type?: ProjectType      // default: 'other'
  status?: ProjectStatus  // default: 'draft'
  description?: string
  potentialAmount?: number
}): Promise<{ error: string | null; projectId?: string }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase.from('projects').insert({
    client_id: params.clientId,
    name: params.name,
    type: params.type ?? 'other',
    status: params.status ?? 'draft',
    description: params.description ?? null,
    potential_amount: params.potentialAmount ?? null,
    owner_id: user.id,
  }).select('id').single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${params.clientId}`)
  return { error: null, projectId: data.id }
}

// ─── updateProject ─────────────────────────────────────────────
// UPDATE mutable fields on a project (includes potential_amount mapping).
// defense-in-depth: .eq('owner_id') in addition to RLS.
// revalidatePath both client page and project page.
export async function updateProject(
  projectId: string,
  updates: {
    name?: string
    type?: ProjectType
    status?: ProjectStatus
    description?: string
    potentialAmount?: number  // → potential_amount in DB
    progress?: number
  }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Fetch client_id to build correct revalidatePath
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('client_id')
    .eq('id', projectId)
    .eq('owner_id', user.id)
    .single()

  if (fetchError || !project) {
    return { error: fetchError?.message ?? 'Project not found' }
  }

  // Map camelCase params to snake_case DB columns
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
    .eq('owner_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${project.client_id}`)
  revalidatePath(`/${project.client_id}/${projectId}`)
  return { error: null }
}

// ─── deleteProject ─────────────────────────────────────────────
// DELETE the project row. Cascade in DB removes budget_products and documents.
// Fetches client_id BEFORE deletion to build correct revalidatePath.
// revalidatePath('/') and '/[clientId]' page.
export async function deleteProject(
  projectId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Fetch client_id before deletion so revalidatePath is correct
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('client_id')
    .eq('id', projectId)
    .eq('owner_id', user.id)
    .single()

  if (fetchError || !project) {
    return { error: fetchError?.message ?? 'Project not found' }
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('owner_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/${project.client_id}`)
  return { error: null }
}

// ─── createBudgetProduct ───────────────────────────────────────
// INSERT a new budget_products row.
// Fetches project → client_id for correct revalidatePath.
// revalidatePath: '/[clientId]/[projectId]' + '/compta'.
export async function createBudgetProduct(params: {
  projectId: string
  name: string
  totalAmount?: number  // default: 0
}): Promise<{ error: string | null; productId?: string }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Fetch client_id via project for revalidatePath
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('client_id')
    .eq('id', params.projectId)
    .eq('owner_id', user.id)
    .single()

  if (fetchError || !project) {
    return { error: fetchError?.message ?? 'Project not found' }
  }

  const { data, error } = await supabase.from('budget_products').insert({
    project_id: params.projectId,
    name: params.name,
    total_amount: params.totalAmount ?? 0,
    owner_id: user.id,
  }).select('id').single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${project.client_id}/${params.projectId}`)
  revalidatePath('/compta', 'page')
  return { error: null, productId: data.id }
}

// ─── updateBudgetProduct ───────────────────────────────────────
// UPDATE name and/or total_amount on a budget_products row.
// defense-in-depth: .eq('owner_id') in addition to RLS.
// revalidatePath: '/[clientId]/[projectId]' + '/compta'.
export async function updateBudgetProduct(
  productId: string,
  updates: {
    name?: string
    totalAmount?: number  // → total_amount in DB
  }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Fetch project_id → client_id for revalidatePath
  const { data: product, error: fetchError } = await supabase
    .from('budget_products')
    .select('project_id, projects(client_id)')
    .eq('id', productId)
    .eq('owner_id', user.id)
    .single()

  if (fetchError || !product) {
    return { error: fetchError?.message ?? 'Product not found' }
  }

  // Map camelCase to snake_case
  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount

  const { error } = await supabase
    .from('budget_products')
    .update(dbUpdates)
    .eq('id', productId)
    .eq('owner_id', user.id)

  if (error) {
    return { error: error.message }
  }

  const clientId = (product.projects as unknown as { client_id: string } | null)?.client_id
  revalidatePath(`/${clientId}/${product.project_id}`)
  revalidatePath('/compta', 'page')
  return { error: null }
}

// ─── deleteBudgetProduct ───────────────────────────────────────
// DELETE a budget_products row.
// Fetches project → client_id BEFORE deletion for correct revalidatePath.
// revalidatePath: '/[clientId]/[projectId]' + '/compta'.
export async function deleteBudgetProduct(
  productId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Fetch project_id → client_id before deletion for revalidatePath
  const { data: product, error: fetchError } = await supabase
    .from('budget_products')
    .select('project_id, projects(client_id)')
    .eq('id', productId)
    .eq('owner_id', user.id)
    .single()

  if (fetchError || !product) {
    return { error: fetchError?.message ?? 'Product not found' }
  }

  const { error } = await supabase
    .from('budget_products')
    .delete()
    .eq('id', productId)
    .eq('owner_id', user.id)

  if (error) {
    return { error: error.message }
  }

  const clientId = (product.projects as unknown as { client_id: string } | null)?.client_id
  revalidatePath(`/${clientId}/${product.project_id}`)
  revalidatePath('/compta', 'page')
  return { error: null }
}

// ─── updatePaymentStage ────────────────────────────────────────
// UPDATE a single JSONB column (devis/acompte/avancement/solde) on a budget_products row.
// Uses dynamic key to target the correct column.
// defense-in-depth: .eq('owner_id') in addition to RLS.
// revalidatePath: '/[clientId]/[projectId]' + '/compta'.
export async function updatePaymentStage(
  productId: string,
  stage: 'devis' | 'acompte' | 'avancement' | 'solde',
  value: { amount?: number; date?: string; status: 'pending' | 'sent' | 'paid' }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Fetch project_id → client_id for revalidatePath
  const { data: product, error: fetchError } = await supabase
    .from('budget_products')
    .select('project_id, projects(client_id)')
    .eq('id', productId)
    .eq('owner_id', user.id)
    .single()

  if (fetchError || !product) {
    return { error: fetchError?.message ?? 'Product not found' }
  }

  const { error } = await supabase
    .from('budget_products')
    .update({ [stage]: value })
    .eq('id', productId)
    .eq('owner_id', user.id)

  if (error) {
    return { error: error.message }
  }

  const clientId = (product.projects as unknown as { client_id: string } | null)?.client_id
  revalidatePath(`/${clientId}/${product.project_id}`)
  revalidatePath('/compta', 'page')
  return { error: null }
}
