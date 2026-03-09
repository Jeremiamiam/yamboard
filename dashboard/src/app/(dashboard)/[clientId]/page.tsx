// NO "use client"
import { notFound } from 'next/navigation'
import { getClient, getClientsAll } from '@/lib/data/clients'
import { getClientProjects } from '@/lib/data/projects'
import { getClientDocs, getBudgetProductsForProjects } from '@/lib/data/documents'
import { ClientPageShell } from '@/components/ClientPageShell'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  if (!UUID_RE.test(clientId)) notFound()
  const [client, projects, globalDocs, sidebar] = await Promise.all([
    getClient(clientId),
    getClientProjects(clientId),
    getClientDocs(clientId),
    getClientsAll(),
  ])
  if (!client) notFound()

  const budgetByProject = await getBudgetProductsForProjects(projects.map((p) => p.id))

  return (
    <ClientPageShell
      client={client}
      projects={projects}
      budgetByProject={budgetByProject}
      globalDocs={globalDocs}
      clientId={clientId}
      clients={sidebar.clients}
      prospects={sidebar.prospects}
      archived={sidebar.archived}
    />
  )
}
