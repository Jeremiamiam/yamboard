/**
 * Injecte des données test (erreur + suggestion) pour vérifier notifs/toasts.
 * Requiert un utilisateur authentifié.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()
    const { data: clients } = await admin.from('clients').select('id').limit(1)
    const clientId = (clients?.[0] as { id: string } | undefined)?.id
    if (!clientId) {
      return NextResponse.json({ error: 'Aucun client en base' }, { status: 400 })
    }

    const { data: errRow, error: errErr } = await (admin as any)
      .from('webhook_errors')
      .insert({
        source: 'inbound_email',
        error_message: '[TEST] Erreur Resend simulée',
        details: { test: true },
      })
      .select('id')
      .single()
    if (errErr) {
      return NextResponse.json({ error: 'webhook_errors: ' + errErr.message }, { status: 500 })
    }

    const { data: sugRow, error: sugErr } = await (admin as any)
      .from('pending_email_suggestions')
      .insert({
        client_id: clientId,
        type: 'contact',
        data: { name: 'Contact Test', email: 'test@example.com' },
        from_email: 'test@example.com',
        subject: '[TEST] Suggestion simulée',
        sender_name: 'Debug',
      })
      .select('id')
      .single()
    if (sugErr) {
      return NextResponse.json({ error: 'pending_email_suggestions: ' + sugErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: 'Données test injectées — toasts Realtime ou rafraîchis',
      webhook_error_id: errRow?.id,
      pending_suggestion_id: sugRow?.id,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
