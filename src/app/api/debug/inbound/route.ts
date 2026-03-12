/**
 * Diagnostic webhook inbound : vérifie que l'admin peut écrire dans Supabase.
 * GET /api/debug/inbound?secret=XXX (INBOUND_TEST_SECRET)
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  const secret = req.nextUrl.searchParams.get('secret')
  const expected = process.env.INBOUND_TEST_SECRET
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Secret manquant ou invalide' }, { status: 401 })
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

    const { data: inserted, error } = await admin
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
