/**
 * Replay le webhook inbound avec un email_id.
 * Requiert auth. Passe X-Test-Secret si INBOUND_TEST_SECRET est défini.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body: { email_id?: string; from?: string; subject?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const emailId = body.email_id
  const from = body.from ?? user.email ?? 'jeremy@agence-yam.fr'
  const subject = body.subject ?? '(sans sujet)'

  if (!emailId) {
    return NextResponse.json({ error: 'email_id requis' }, { status: 400 })
  }

  const baseUrl = req.nextUrl.origin
  const webhookUrl = `${baseUrl}/api/webhooks/inbound-email`
  const payload = {
    __test: true,
    type: 'email.received',
    data: { email_id: emailId, from, subject },
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const secret = process.env.INBOUND_TEST_SECRET
  if (secret) headers['X-Test-Secret'] = secret

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      body: data,
      _debug: data._debug,
    })
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : String(e),
    }, { status: 500 })
  }
}
