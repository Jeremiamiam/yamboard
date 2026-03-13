/**
 * Persiste les erreurs webhook pour notification dans l'app.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export async function insertWebhookError(
  supabase: SupabaseClient,
  params: {
    source?: string
    errorMessage: string
    details?: Record<string, unknown>
  }
): Promise<void> {
  try {
    await (supabase as any).from('webhook_errors').insert({
      source: params.source ?? 'inbound_email',
      error_message: params.errorMessage,
      details: params.details ?? null,
    })
  } catch (e) {
    console.error('[webhook-errors] Insert failed:', e)
  }
}
