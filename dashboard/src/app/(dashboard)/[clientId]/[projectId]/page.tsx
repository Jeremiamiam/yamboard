// NO "use client"
import { notFound } from 'next/navigation'
import { getClient, getClients } from '@/lib/data/clients'
import { getProject } from '@/lib/data/projects'
import { getProjectDocs, getClientDocs, getBudgetProducts } from '@/lib/data/documents'
import { ProjectPageShell } from '@/components/ProjectPageShell'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>
}) {
  const { clientId, projectId } = await params
  if (!UUID_RE.test(clientId) || !UUID_RE.test(projectId)) notFound()

  const [client, project, projectDocs, clientDocs, budgetProducts, clients, prospects, archived] =
    await Promise.all([
      getClient(clientId),
      getProject(projectId),
      getProjectDocs(projectId),
      getClientDocs(clientId),
      getBudgetProducts(projectId),
      getClients('client'),
      getClients('prospect'),
      getClients('archived'),
    ])

  if (!client || !project || project.clientId !== clientId) notFound()

  return (
    <ProjectPageShell
      client={client}
      project={project}
      projectDocs={projectDocs}
      clientDocs={clientDocs}
      budgetProducts={budgetProducts}
      clientId={clientId}
      projectId={projectId}
      clients={clients}
      prospects={prospects}
      archived={archived}
    />
  )
}
