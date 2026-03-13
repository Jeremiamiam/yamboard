import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Client, ClientCategory, ClientStatus } from '@/lib/types'

function toClient(row: Record<string, unknown>): Client {
  // contacts is a joined array from select('*, contacts(*)')
  const contacts = (row.contacts as Record<string, unknown>[] | null) ?? []
  const primaryContact = contacts.find((c) => c.is_primary) ?? contacts[0]
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as ClientCategory,
    status: (row.status as ClientStatus) ?? 'active',
    contact: primaryContact
      ? {
          name: (primaryContact.name as string) ?? '—',
          email: (primaryContact.email as string) ?? '—',
          phone: (primaryContact.phone as string | undefined) ?? undefined,
        }
      : { name: '—', email: '—' },
    color: (row.color as string) ?? '#71717a',
    since: (row.since as string | undefined) ?? undefined,
    logoPath: (row.logo_path as string | null) ?? undefined,
  }
}

export async function getClients(category: ClientCategory = 'client'): Promise<Client[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, contacts(*)')
    .eq('category', category)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toClient)
}

/** Sidebar: 1 RPC (pas de N+1 contacts), dédupliqué par React.cache dans la même requête serveur. */
export const getClientsAll = cache(async (): Promise<{
  clients: Client[]
  archived: Client[]
}> => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_clients_sidebar')
  if (error) throw new Error(error.message)
  const all: Client[] = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    category: row.category as ClientCategory,
    status: 'active' as ClientStatus,
    contact: {
      name: (row.primary_contact_name as string) ?? '—',
      email: '—',
    },
    color: (row.color as string) ?? '#71717a',
    logoPath: (row.logo_path as string | null) ?? undefined,
  }))
  return {
    clients: all.filter((c) => c.category === 'client'),
    archived: all.filter((c) => c.category === 'archived'),
  }
})

/** Contacts pour le contexte agency. Retourne Map clientId → { name, email }[] */
export async function getContactsForClients(
  clientIds: string[]
): Promise<Record<string, { name: string; email: string | null }[]>> {
  if (clientIds.length === 0) return {}
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('client_id, name, email')
    .in('client_id', clientIds)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  const byClient: Record<string, { name: string; email: string | null }[]> = {}
  for (const cid of clientIds) byClient[cid] = []
  for (const row of data ?? []) {
    const cid = row.client_id as string
    if (byClient[cid]) {
      byClient[cid].push({
        name: row.name as string,
        email: (row.email as string | null) ?? null,
      })
    }
  }
  return byClient
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, contacts(*)')
    .eq('id', id)
    .single()
  if (error) return null
  return toClient(data as Record<string, unknown>)
}
