/**
 * POST /api/email-processing/resume
 * Suite à une confirmation client (ask_client_confirmation).
 * Body: { confirmationId, choice: 'use_existing' | 'create_new' }
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { executeCreateClient } from '@/lib/chat-tools'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function extractEmailFromFromField(from: string): string | null {
  const match = from.match(/<([^>]+)>/)
  if (match) return match[1].trim().toLowerCase()
  if (from.includes('@')) return from.trim().toLowerCase()
  return null
}

function extractSenderName(from: string): string {
  const nameMatch = from.match(/^([^<]+)</)
  if (nameMatch) return nameMatch[1].trim().split(/\s+/)[0]
  const email = from.trim().split('@')[0]
  return email.charAt(0).toUpperCase() + email.slice(1)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: { confirmationId?: string; choice?: 'use_existing' | 'create_new' }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { confirmationId, choice } = body
  if (!confirmationId || !choice || !['use_existing', 'create_new'].includes(choice)) {
    return NextResponse.json({ error: 'confirmationId et choice (use_existing | create_new) requis' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: row, error: fetchErr } = await (admin as any)
    .from('pending_client_confirmations')
    .select('id, user_id, mentioned_name, possible_match_client_id, possible_match_name, from_email, subject, body')
    .eq('id', confirmationId)
    .single()

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Confirmation introuvable' }, { status: 404 })
  }

  const typed = row as {
    user_id: string
    mentioned_name: string
    possible_match_client_id: string | null
    possible_match_name: string | null
    from_email: string
    subject: string
    body: string
  }

  if (typed.user_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  let clientId: string
  let clientName: string

  if (choice === 'use_existing') {
    if (!typed.possible_match_client_id) {
      return NextResponse.json({ error: 'Aucun client à réutiliser' }, { status: 400 })
    }
    const { data: client } = await admin.from('clients').select('id, name').eq('id', typed.possible_match_client_id).single()
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    clientId = (client as { id: string }).id
    clientName = (client as { name: string }).name
  } else {
    const r = await executeCreateClient(admin, user.id, { name: typed.mentioned_name, category: 'client' })
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 })
    if (r.type !== 'create_client' && r.type !== 'client_exists') {
      return NextResponse.json({ error: 'Erreur création client' }, { status: 500 })
    }
    clientId = r.clientId
    clientName = r.name
  }

  const from = typed.from_email ?? ''
  const subject = typed.subject ?? '(sans sujet)'
  const bodyText = typed.body ?? ''
  const senderName = extractSenderName(from)
  const senderEmail = extractEmailFromFromField(from)

  // Créer suggest_contact et suggest_note (sans appeler l'agent)
  if (senderEmail && !senderEmail.endsWith('@agence-yam.fr')) {
    await (admin as any).from('pending_email_suggestions').insert({
      client_id: clientId,
      project_id: null,
      type: 'contact',
      data: { name: senderName, email: senderEmail, isPrimary: true },
      from_email: from,
      subject,
      sender_name: senderName,
    })
  }

  const noteContent = bodyText.length > 500
    ? `**Contexte** : Email de ${from}\n**Sujet** : ${subject}\n\n**Extrait** :\n${bodyText.slice(0, 500)}...`
    : `**Contexte** : Email de ${from}\n**Sujet** : ${subject}\n\n${bodyText || '(pas de corps)'}`
  await (admin as any).from('pending_email_suggestions').insert({
    client_id: clientId,
    project_id: null,
    type: 'note',
    data: {
      name: `Échange — ${subject.slice(0, 50)}`,
      content: noteContent,
    },
    from_email: from,
    subject,
    sender_name: senderName,
  })

  await (admin as any).from('pending_client_confirmations').delete().eq('id', confirmationId)

  return NextResponse.json({ ok: true, clientId, clientName })
}
