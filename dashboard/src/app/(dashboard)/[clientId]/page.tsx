// NO "use client"
import { notFound } from 'next/navigation'
import { getClient, getClients } from '@/lib/data/clients'
import { getClientProjects } from '@/lib/data/projects'
import { getClientDocs } from '@/lib/data/documents'
import { ClientPageShell } from '@/components/ClientPageShell'

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
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
