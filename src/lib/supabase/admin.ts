/**
 * Client Supabase Admin (service role).
 * Usage: webhooks, jobs, lookup user by email — jamais côté client.
 */
import 'server-only'
import { createClient } from '@supabase/supabase-js'

let _adminClient: ReturnType<typeof createClient> | null = null

export function createAdminClient() {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant')
    _adminClient = createClient(url, key, { auth: { persistSession: false } })
  }
  return _adminClient
}
