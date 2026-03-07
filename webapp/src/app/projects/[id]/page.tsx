import { createClient } from "@/lib/supabase/server"
import { WorkflowLauncher } from "@/components/workflow-launcher"
import { WorkflowOutputs } from "@/components/workflow-outputs"
import { ProjectFilesSection } from "@/components/project-files-section"
import Link from "next/link"
import { notFound } from "next/navigation"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  // In Next.js 16, params is a Promise — must await
  const { id } = await params

  const supabase = await createClient()

  const { data: project } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      created_at,
      updated_at,
      workflow_states(workflow_slug, status)
    `)
    .eq("id", id)
    .single()

  if (!project) notFound()

  const { data: outputs } = await supabase
    .from("workflow_outputs")
    .select("id, workflow_slug, output_json, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false })

  const initialOutputs = outputs ?? []

  const completedCount = project.workflow_states.filter(
    (w: { status: string }) => w.status === "completed"
  ).length

  // Load existing files from Supabase Storage (server-side for initial render)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: storageFiles } = user
    ? await supabase.storage
        .from("project-files")
        .list(`${user.id}/${id}`, {
          sortBy: { column: "created_at", order: "desc" },
        })
    : { data: null }

  const initialFiles = (storageFiles ?? []).map((f) => ({
    name: f.name,
    path: `${user!.id}/${id}/${f.name}`,
    metadata: f.metadata,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center gap-4">
        <Link
          href={`/projects/${id}/wiki`}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← {project.name}
        </Link>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{completedCount}/6</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Workflows
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-4">
            <WorkflowLauncher projectId={project.id} workflowStates={project.workflow_states} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Outputs
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-3">
            <WorkflowOutputs projectId={project.id} initialOutputs={initialOutputs} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Fichiers
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <ProjectFilesSection projectId={project.id} initialFiles={initialFiles} />
          </div>
        </section>
      </main>
    </div>
  )
}
