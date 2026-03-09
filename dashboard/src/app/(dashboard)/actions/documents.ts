'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { Document } from '@/lib/types'

// ─── createNote ────────────────────────────────────────────────
// INSERT document de type texte libre.
// storage_path = null, content = le texte saisi.
// revalidatePath: '/[clientId]' toujours + '/[clientId]/[projectId]' si fourni.
export async function createNote(params: {
  clientId: string
  projectId?: string
  name: string
  type: Document['type']
  content: string
}): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.from('documents').insert({
    client_id: params.clientId,
    project_id: params.projectId ?? null,
    name: params.name,
    type: params.type,
    storage_path: null,
    content: params.content,
    owner_id: user.id,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${params.clientId}`, 'page')
  if (params.projectId) {
    revalidatePath(`/${params.clientId}/${params.projectId}`, 'page')
  }

  return { error: null }
}

// ─── createLink ────────────────────────────────────────────────
// INSERT document de type lien externe.
// storage_path = null, content = l'URL du lien.
// revalidatePath: '/[clientId]' toujours + '/[clientId]/[projectId]' si fourni.
export async function createLink(params: {
  clientId: string
  projectId?: string
  name: string
  url: string
}): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.from('documents').insert({
    client_id: params.clientId,
    project_id: params.projectId ?? null,
    name: params.name,
    type: 'other' satisfies Document['type'],
    storage_path: null,
    content: params.url,
    owner_id: user.id,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${params.clientId}`, 'page')
  if (params.projectId) {
    revalidatePath(`/${params.clientId}/${params.projectId}`, 'page')
  }

  return { error: null }
}

// ─── createSignedUploadUrl ─────────────────────────────────────
// Génère une signed URL d'upload (usage unique).
// Path convention: `${user.id}/${clientId}/${Date.now()}-${filename}`
// NE crée PAS de ligne en base — étape 1 du 2-step upload.
// Retourne { signedUrl, path } au succès.
export async function createSignedUploadUrl(
  clientId: string,
  filename: string
): Promise<{ signedUrl: string; path: string; token: string } | { error: string }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const safeFilename = filename
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/\s+/g, '-')                              // spaces → hyphens
    .replace(/[^a-zA-Z0-9.\-_]/g, '')                 // remove remaining special chars

  const path = `${user.id}/${clientId}/${Date.now()}-${safeFilename}`

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUploadUrl(path)

  if (error || !data) {
    return { error: error?.message ?? 'Failed to create signed upload URL' }
  }

  return { signedUrl: data.signedUrl, path: data.path, token: data.token }
}

// ─── saveDocumentRecord ────────────────────────────────────────
// Étape 2 du 2-step upload: INSERT la row avec storage_path.
// revalidatePath: '/[clientId]' toujours + '/[clientId]/[projectId]' si fourni.
export async function saveDocumentRecord(params: {
  clientId: string
  projectId?: string
  name: string
  type: Document['type']
  storagePath: string
}): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.from('documents').insert({
    client_id: params.clientId,
    project_id: params.projectId ?? null,
    name: params.name,
    type: params.type,
    storage_path: params.storagePath,
    content: null,
    owner_id: user.id,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${params.clientId}`, 'page')
  if (params.projectId) {
    revalidatePath(`/${params.clientId}/${params.projectId}`, 'page')
  }

  return { error: null }
}

// ─── getDocumentSignedUrl ──────────────────────────────────────
// Génère une signed URL de lecture (TTL 1h = 3600s).
// Utilisé par DocumentViewer pour afficher un PDF.
// Pas de revalidatePath — lecture seule.
export async function getDocumentSignedUrl(
  storagePath: string
): Promise<{ signedUrl: string } | { error: string }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600)

  if (error || !data) {
    return { error: error?.message ?? 'Failed to create signed URL' }
  }

  return { signedUrl: data.signedUrl }
}

// ─── deleteDocument ────────────────────────────────────────────
// DELETE row + supprime Storage si storage_path est défini.
// Ordre: fetch → supprimer Storage → supprimer row DB → revalidatePath.
// Defense-in-depth: .eq('owner_id', user.id) en plus du RLS.
export async function deleteDocument(
  documentId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // 1. Fetch the row to get storage_path, client_id, project_id
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('storage_path, client_id, project_id')
    .eq('id', documentId)
    .eq('owner_id', user.id)
    .single()

  if (fetchError || !doc) {
    return { error: fetchError?.message ?? 'Document not found' }
  }

  // 2. Delete from Storage first (prevent orphaned files)
  if (doc.storage_path) {
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.storage_path])

    if (storageError) {
      return { error: storageError.message }
    }
  }

  // 3. Delete the DB row
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('owner_id', user.id)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // 4. Revalidate cache
  revalidatePath(`/${doc.client_id}`, 'page')
  if (doc.project_id) {
    revalidatePath(`/${doc.client_id}/${doc.project_id}`, 'page')
  }

  return { error: null }
}

// ─── pinDocument ───────────────────────────────────────────────
// UPDATE is_pinned=true + pinned_from_project=fromProjectId.
// Defense-in-depth: .eq('owner_id', user.id) en plus du RLS.
// revalidatePath: '/[clientId]' pour rendre le doc visible au niveau client.
export async function pinDocument(
  documentId: string,
  fromProjectId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Fetch client_id for revalidatePath
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('client_id')
    .eq('id', documentId)
    .eq('owner_id', user.id)
    .single()

  if (fetchError || !doc) {
    return { error: fetchError?.message ?? 'Document not found' }
  }

  const { error } = await supabase
    .from('documents')
    .update({
      is_pinned: true,
      pinned_from_project: fromProjectId,
    })
    .eq('id', documentId)
    .eq('owner_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${doc.client_id}`, 'page')

  return { error: null }
}
