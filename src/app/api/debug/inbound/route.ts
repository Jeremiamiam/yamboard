/**
 * Diagnostic webhook inbound.
 * GET /api/debug/inbound?secret=XXX — vérifie que l'admin peut écrire dans Supabase.
 * POST /api/debug/inbound — rejoue le flux avec un email_id Resend (body: { email_id, from, subject }).
 * Header: X-Test-Secret: <INBOUND_TEST_SECRET>
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function checkSecret(req: NextRequest): boolean {
  const secret = req.headers.get('x-test-secret') ?? req.nextUrl.searchParams.get('secret')
  const expected = process.env.INBOUND_TEST_SECRET
  return !!expected && secret === expected
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'Secret manquant ou invalide' }, { status: 401 })
  }

  let body: { email_id?: string; from?: string; subject?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const emailId = body.email_id
  const from = body.from ?? 'jeremy@agence-yam.fr'
  const subject = body.subject ?? '(sans sujet)'

  if (!emailId) {
    return NextResponse.json({ error: 'email_id requis' }, { status: 400 })
  }

  const webhookUrl = new URL('/api/webhooks/inbound-email', req.url).toString()
  const payload = {
    __test: true,
    type: 'email.received',
    data: { email_id: emailId, from, subject },
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Secret': process.env.INBOUND_TEST_SECRET!,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      body: data,
    })
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : String(e),
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'Secret manquant ou invalide' }, { status: 401 })
  }

  // ?action=inject — injecte une erreur + une suggestion test pour vérifier notifs/toasts
  const action = req.nextUrl.searchParams.get('action')
  if (action === 'inject') {
    try {
      const admin = createAdminClient()
      const { data: clients } = await admin.from('clients').select('id').limit(1)
      const clientId = (clients?.[0] as { id: string } | undefined)?.id
      if (!clientId) {
        return NextResponse.json({ error: 'Aucun client en base' }, { status: 400 })
      }
      const { data: errRow, error: errErr } = await (admin as any)
        .from('webhook_errors')
        .insert({ source: 'inbound_email', error_message: '[TEST] Erreur Resend simulée', details: { test: true } })
        .select('id')
        .single()
      if (errErr) {
        return NextResponse.json({ error: 'webhook_errors insert failed: ' + errErr.message }, { status: 500 })
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
        return NextResponse.json({ error: 'pending_email_suggestions insert failed: ' + sugErr.message }, { status: 500 })
      }
      return NextResponse.json({
        ok: true,
        message: 'Données test injectées — rafraîchis la page ou attends le Realtime',
        webhook_error_id: errRow?.id,
        pending_suggestion_id: sugRow?.id,
      })
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
    }
  }

  const result: Record<string, unknown> = {
    env: {
      RESEND_WEBHOOK_SECRET: !!process.env.RESEND_WEBHOOK_SECRET,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    supabaseWrite: null as string | { ok: boolean; error?: string } | null,
  }

  try {
    const admin = createAdminClient()
    // Récupérer un client existant pour le test
    const { data: clients } = await admin.from('clients').select('id, owner_id').limit(1)
    const client = clients?.[0] as { id: string; owner_id: string } | undefined
    if (!client) {
      result.supabaseWrite = { ok: false, error: 'Aucun client en base' }
      return NextResponse.json(result, { status: 200 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error } = await (admin as any)
      .from('client_activity_logs')
      .insert({
        client_id: client.id,
        action_type: 'note_added',
        source: 'manual',
        summary: '[DEBUG] Test write inbound',
        metadata: { test: true },
        owner_id: client.owner_id,
      })
      .select('id')
      .single()

    if (error) {
      result.supabaseWrite = { ok: false, error: error.message }
      return NextResponse.json(result, { status: 200 })
    }

    await admin.from('client_activity_logs').delete().eq('id', inserted.id)
    result.supabaseWrite = { ok: true }
  } catch (e) {
    result.supabaseWrite = { ok: false, error: e instanceof Error ? e.message : String(e) }
  }

  return NextResponse.json(result, { status: 200 })
}
