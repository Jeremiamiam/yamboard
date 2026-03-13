'use server'

import 'server-only'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Document } from '@/lib/types'

// ─── extractDocumentContent ────────────────────────────────────
// Private helper: extracts text from uploaded documents after successful insert.
// - .txt / .md: downloads bytes, reads as UTF-8
// - .pdf: downloads bytes, base64-encodes, sends to Claude Haiku vision
// - other types: skipped (content stays null)
// Failure is non-blocking — caller wraps in try/catch.
async function extractDocumentContent(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  storagePath: string,
  _documentId: string,
  userId: string
): Promise<void> {
  const ext = storagePath.split('.').pop()?.toLowerCase()
  let extractedText: string | null = null

  if (ext === 'txt' || ext === 'md') {
    // Plain text extraction — no Claude needed
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(storagePath)
    if (!downloadError && fileData) {
      extractedText = await fileData.text()
    }
  } else if (ext === 'pdf') {
    // PDF extraction via Claude Haiku vision (base64 approach — robust)
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(storagePath)
    if (!downloadError && fileData) {
      const arrayBuffer = await fileData.arrayBuffer()
      const pdfBase64 = Buffer.from(arrayBuffer).toString('base64')
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
            },
            {
              type: 'text',
              text: `Extrais et décris ce document en deux parties :

1. TEXTE : tout le contenu textuel (paragraphes, listes, titres, etc.).

2. ÉLÉMENTS VISUELS : décris les couleurs dominantes, logos ou éléments graphiques visibles, mise en page générale, typographies remarquables, et tout élément visuel pertinent (charte graphique, structure, hiérarchie visuelle).

Retourne les deux parties clairement séparées, sans commentaire introductif.`,
            },
          ],
        }],
      })
      extractedText = response.content[0]?.type === 'text' ? response.content[0].text : null
    }
  }
  // Other file types: skip extraction (content stays null)

  if (extractedText) {
    await supabase
      .from('documents')
      .update({ content: extractedText, extraction_status: 'done' })
      .eq('storage_path', storagePath)
      .eq('owner_id', userId)
  }
}

// ─── createDocFromConversation ──────────────────────────────────
// Résume une conversation chat via Claude, crée un doc et le range dans les docs client/projet.
export async function createDocFromConversation(params: {
  clientId: string
  projectId?: string
  messages: { role: string; content: string }[]
  contextLabel: string
}): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  if (!params.messages.length) {
    return { error: 'Conversation vide' }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: 'Configuration API manquante' }
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const convoText = params.messages
    .map((m) => `**${m.role === 'user' ? 'Utilisateur' : 'Brandon'}**\n${m.content}`)
    .join('\n\n')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Tu es un assistant qui synthétise des conversations en documents concis.

Voici une conversation de chat (contexte : ${params.contextLabel}) :

---
${convoText}
---

Rédige un document très succinct (synthèse) qui capture :
- Les points clés discutés
- Les décisions ou conclusions
- Les actions à retenir ou prochaines étapes

Format : texte brut uniquement. Pas de markdown (pas de #, -, *, **, etc.). Utilise des retours à la ligne et des paragraphes courts pour structurer. Pas d'intro ni de conclusion superflue. Maximum 1 page.`,
    }],
  })

  const summary = response.content[0]?.type === 'text' ? response.content[0].text : ''
  if (!summary.trim()) {
    return { error: 'Impossible de générer le résumé' }
  }

  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  const docName = `Synthèse chat — ${dateStr}`

  return createNote({
    clientId: params.clientId,
    projectId: params.projectId,
    name: docName,
    content: summary,
  })
}

// ─── createNote ────────────────────────────────────────────────
// INSERT document de type texte libre.
// storage_path = null, content = le texte saisi.
// revalidatePath: '/[clientId]' toujours + '/[clientId]/[projectId]' si fourni.
export async function createNote(params: {
  clientId: string
  projectId?: string
  name: string
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
    type: 'other',
    storage_path: null,
    content: params.content,
    owner_id: user.id,
  })

  if (error) {
    return { error: error.message }
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
  storagePath: string
}): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const isPdf = params.storagePath.toLowerCase().endsWith('.pdf')
  const extractionStatus = isPdf ? 'processing' : null

  const { error } = await supabase.from('documents').insert({
    client_id: params.clientId,
    project_id: params.projectId ?? null,
    name: params.name,
    type: 'other',
    storage_path: params.storagePath,
    content: null,
    extraction_status: extractionStatus,
    owner_id: user.id,
  })

  if (error) {
    return { error: error.message }
  }

  // Non-blocking content extraction — wrap in try/catch, never block upload
  try {
    await extractDocumentContent(supabase, params.storagePath, '', user.id)
  } catch (extractErr) {
    if (isPdf) {
      console.warn('[saveDocumentRecord] content extraction failed:', extractErr)
      await supabase
        .from('documents')
        .update({ extraction_status: 'failed' })
        .eq('storage_path', params.storagePath)
        .eq('owner_id', user.id)
    }
  }

  return { error: null }
}

// ─── getDocument ────────────────────────────────────────────────
// Charge un document complet (avec content) pour affichage.
// Utilisé par DocumentViewer pour les notes (sans storage_path).
export async function getDocument(
  documentId: string
): Promise<{ doc: { id: string; name: string; content?: string; storagePath?: string; updatedAt: string; size: string } } | { error: string }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: row, error } = await supabase
    .from('documents')
    .select('id, name, content, storage_path, updated_at')
    .eq('id', documentId)
    .single()

  if (error || !row) {
    return { error: error?.message ?? 'Document introuvable' }
  }

  const content = (row.content as string | null) ?? undefined
  const size = content
    ? `~${content.split(/\s+/).filter(Boolean).length} mots`
    : '—'

  return {
    doc: {
      id: row.id as string,
      name: row.name as string,
      content,
      storagePath: (row.storage_path as string | null) ?? undefined,
      updatedAt: new Date(row.updated_at as string).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      size,
    },
  }
}

// ─── getDocumentFileContent ─────────────────────────────────────
// Télécharge le fichier depuis Storage et retourne le contenu texte.
// Pour .html, .txt, .md — affichage direct sans signed URL.
export async function getDocumentFileContent(
  storagePath: string
): Promise<{ content: string } | { error: string }> {
  const supabase = await createSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: fileData, error } = await supabase.storage
    .from('documents')
    .download(storagePath)

  if (error || !fileData) return { error: error?.message ?? 'Fichier introuvable' }

  try {
    const content = await fileData.text()
    return { content }
  } catch {
    return { error: 'Impossible de lire le fichier (encodage)' }
  }
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

  return { error: null }
}

// ─── unpinDocument ─────────────────────────────────────────────
export async function unpinDocument(documentId: string): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('documents')
    .update({ is_pinned: false, pinned_from_project: null })
    .eq('id', documentId)
    .eq('owner_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}
