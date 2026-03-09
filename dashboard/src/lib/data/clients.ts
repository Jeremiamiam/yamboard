import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Client, ClientCategory, ClientStatus } from '@/lib/types'

function toClient(row: Record<string, unknown>): Client {
  // contacts is a joined array from select('*, contacts(*)')
  const contacts = (row.contacts as Record<string, unknown>[] | null) ?? []
  const primaryContact = contacts.find((c) => c.is_primary) ?? contacts[0]
  return {
    id: row.id as string,
    name: row.name as string,
    industry: (row.industry as string) ?? '',
    category: row.category as ClientCategory,
    status: (row.status as ClientStatus) ?? 'active',
    contact: primaryContact
      ? {
          name: (primaryContact.name as string) ?? '—',
          role: (primaryContact.role as string) ?? '—',
          email: (primaryContact.email as string) ?? '—',
          phone: (primaryContact.phone as string | undefined) ?? undefined,
        }
      : { name: '—', role: '—', email: '—' },
    color: (row.color as string) ?? '#71717a',
    since: (row.since as string | undefined) ?? undefined,
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

/** 1 requête pour client + prospect + archived (sidebar) — évite 3 round-trips */
export async function getClientsAll(): Promise<{
  clients: Client[]
  prospects: Client[]
  archived: Client[]
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, contacts(*)')
    .in('category', ['client', 'prospect', 'archived'])
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  const all = (data ?? []).map(toClient)
  return {
    clients: all.filter((c) => c.category === 'client'),
    prospects: all.filter((c) => c.category === 'prospect'),
    archived: all.filter((c) => c.category === 'archived'),
  }
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
