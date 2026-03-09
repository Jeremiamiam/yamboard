'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { ClientCategory, ClientStatus } from '@/lib/types'

// ─── createClient ──────────────────────────────────────────────
// INSERT a new client row owned by the authenticated user.
// revalidatePath('/') to refresh the sidebar.
export async function createClient(params: {
  name: string
  industry?: string
  category?: ClientCategory
  status?: ClientStatus
  color?: string
}): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.from('clients').insert({
    name: params.name,
    industry: params.industry ?? null,
    category: params.category ?? 'client',
    status: params.status ?? 'active',
    color: params.color ?? null,
    owner_id: user.id,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

// ─── updateClient ──────────────────────────────────────────────
// UPDATE mutable fields (name, industry, status, color).
// defense-in-depth: .eq('owner_id') in addition to RLS.
// revalidatePath('/') and the client's own page.
export async function updateClient(
  clientId: string,
  updates: {
    name?: string
    industry?: string
    status?: ClientStatus
    color?: string
  }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .eq('owner_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/${clientId}`)
  return { error: null }
}

// ─── archiveClient ─────────────────────────────────────────────
// UPDATE category = 'archived'.
// revalidatePath('/') to remove from active sidebar lists.
export async function archiveClient(
  clientId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('clients')
    .update({ category: 'archived' satisfies ClientCategory })
    .eq('id', clientId)
    .eq('owner_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

// ─── deleteClient ──────────────────────────────────────────────
// DELETE the client row permanently.
// revalidatePath('/') to refresh sidebar.
export async function deleteClient(
  clientId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('owner_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

// ─── convertProspect ──────────────────────────────────────────
// UPDATE category = 'client' (prospect → client conversion).
// revalidatePath('/') to move from Prospects to Clients in sidebar.
export async function convertProspect(
  clientId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('clients')
    .update({ category: 'client' satisfies ClientCategory })
    .eq('id', clientId)
    .eq('owner_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}
