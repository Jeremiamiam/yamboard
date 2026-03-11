import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Project, ProjectType } from '@/lib/types'

function toProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    name: row.name as string,
    type: ((row.type as string) ?? 'other') as ProjectType,
    description: (row.description as string) ?? '',
    lastActivity: (row.last_activity as string) ?? '—',
    startDate: (row.start_date as string) ?? '—',
    potentialAmount: row.potential_amount != null ? Number(row.potential_amount) : undefined,
  }
}

export async function getClientProjects(clientId: string): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toProject)
}

export async function getProject(projectId: string): Promise<Project | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  if (error) return null
  return toProject(data as Record<string, unknown>)
}

export async function getAllProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(toProject)
}

/** 1 requête pour N clients — évite getAllProjects quand on ne veut que client+prospect */
export async function getProjectsForClients(clientIds: string[]): Promise<Project[]> {
  if (clientIds.length === 0) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .in('client_id', clientIds)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => toProject(row as Record<string, unknown>))
}
