// NO "use client"
import { notFound } from 'next/navigation'
import { getClient, getClients } from '@/lib/data/clients'
import { getClientProjects } from '@/lib/data/projects'
import { getClientDocs } from '@/lib/data/documents'
import { ClientPageShell } from '@/components/ClientPageShell'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  if (!UUID_RE.test(clientId)) notFound()
  const [client, projects, globalDocs, clients, prospects, archived] = await Promise.all([
    getClient(clientId),
    getClientProjects(clientId),
    getClientDocs(clientId),
    getClients('client'),
    getClients('prospect'),
    getClients('archived'),
  ])
  if (!client) notFound()

  return (
    <ClientPageShell
      client={client}
      projects={projects}
      globalDocs={globalDocs}
      clientId={clientId}
      clients={clients}
      prospects={prospects}
      archived={archived}
    />
  )
}
