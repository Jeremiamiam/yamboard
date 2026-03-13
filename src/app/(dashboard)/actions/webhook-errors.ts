'use server'

import 'server-only'
import { createClient } from '@/lib/supabase/server'

/** Supprime une erreur webhook (retirer de la cloche). */
export async function dismissWebhookError(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase.from('webhook_errors').delete().eq('id', id)
  if (error) return { error: error.message }
  return {}
}
