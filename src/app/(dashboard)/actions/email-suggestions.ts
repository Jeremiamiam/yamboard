'use server'

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { executeCreateContact } from '@/lib/chat-tools'
import { insertClientActivity } from '@/lib/activity-log'

/** Approuve une suggestion contact → crée le contact et supprime la suggestion. */
export async function approveContactSuggestion(suggestionId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { data: row, error: fetchErr } = await admin
    .from('pending_email_suggestions')
    .select('id, client_id, type, data, sender_name, from_email')
    .eq('id', suggestionId)
    .single()

  if (fetchErr || !row) return { error: 'Suggestion introuvable' }
  if ((row as { type?: string }).type !== 'contact') return { error: 'Type invalide' }

  const data = (row as { data?: { name?: string; email?: string; isPrimary?: boolean } }).data ?? {}
  const clientId = (row as { client_id: string }).client_id
  const senderName = (row as { sender_name?: string }).sender_name ?? 'Email'
  const fromEmail = (row as { from_email?: string }).from_email ?? ''

  const { data: clientRow } = await admin.from('clients').select('owner_id').eq('id', clientId).single()
  const ownerId = (clientRow as { owner_id?: string } | null)?.owner_id ?? user.id

  const r = await executeCreateContact(admin, user.id, {
    clientId,
    name: String(data.name ?? ''),
    email: data.email,
    isPrimary: data.isPrimary ?? false,
    ownerId,
  })

  if (!r.ok) return { error: r.error }
  if (r.type === 'create_contact') {
    await insertClientActivity(admin, {
      clientId,
      actionType: 'contact_added',
      source: 'email',
      summary: `Contact ajouté par ${senderName} : ${r.name}`,
      metadata: { name: r.name, sender: fromEmail },
      ownerId,
    })
  }

  await admin.from('pending_email_suggestions').delete().eq('id', suggestionId)
  return {}
}

/** Approuve une suggestion note → crée l'entrée journal et supprime la suggestion. */
export async function approveNoteSuggestion(suggestionId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { data: row, error: fetchErr } = await admin
    .from('pending_email_suggestions')
    .select('id, client_id, project_id, type, data, sender_name, from_email')
    .eq('id', suggestionId)
    .single()

  if (fetchErr || !row) return { error: 'Suggestion introuvable' }
  const typed = row as { type?: string; client_id: string; project_id?: string; data?: { name?: string; content?: string }; sender_name?: string; from_email?: string }
  if (typed.type !== 'note') return { error: 'Type invalide' }

  const data = typed.data ?? {}
  const clientId = typed.client_id
  const projectId = typed.project_id ?? undefined
  const senderName = typed.sender_name ?? 'Email'
  const fromEmail = typed.from_email ?? ''

  const { data: clientRow } = await admin.from('clients').select('owner_id').eq('id', clientId).single()
  const ownerId = (clientRow as { owner_id?: string } | null)?.owner_id ?? user.id

  await insertClientActivity(admin, {
    clientId,
    projectId,
    actionType: 'note_added',
    source: 'email',
    summary: `Résumé par ${senderName} : ${data.name ?? 'Résumé échange'}`,
    metadata: { name: data.name ?? 'Résumé échange', content: data.content ?? '', sender: fromEmail },
    ownerId,
  })

  await admin.from('pending_email_suggestions').delete().eq('id', suggestionId)
  return {}
}

/** Rejette une suggestion (contact ou note) — supprime la ligne. */
export async function rejectSuggestion(suggestionId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { error } = await admin.from('pending_email_suggestions').delete().eq('id', suggestionId)
  if (error) return { error: error.message }
  return {}
}
