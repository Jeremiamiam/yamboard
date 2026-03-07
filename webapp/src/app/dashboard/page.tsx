import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/actions/auth"
import { CreateProjectModal } from "@/components/create-project-modal"
import { DeleteProjectButton } from "@/components/delete-project-button"
import Link from "next/link"

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      updated_at,
      workflow_states(status)
    `)
    .order("updated_at", { ascending: false })

  const projectsWithCount = (projects ?? []).map((p) => ({
    ...p,
    completedCount: p.workflow_states.filter((w: { status: string }) => w.status === "completed").length,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">GET BRANDON</h1>
          <Link href="/clients" className="text-sm text-gray-500 hover:text-gray-700">
            Clients (CLI)
          </Link>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            Deconnexion
          </button>
        </form>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Projets</h2>
          <CreateProjectModal />
        </div>

        {projectsWithCount.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-gray-500 text-sm mb-6">Aucun projet pour l&apos;instant.</p>
            <CreateProjectModal />
          </div>
        ) : (
          <ul className="space-y-2">
            {projectsWithCount.map((project) => (
              <li key={project.id}>
                <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all flex items-center justify-between">
                  <Link href={`/projects/${project.id}/wiki`} className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 truncate block">{project.name}</span>
                    <span className="text-sm text-gray-400 mt-0.5 block">
                      {formatDate(project.updated_at)} · {project.completedCount}/6 workflows
                    </span>
                  </Link>
                  {/* Progress bar */}
                  <div className="mx-4 hidden sm:flex flex-col items-end gap-1">
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${(project.completedCount / 6) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{project.completedCount}/6</span>
                  </div>
                  <DeleteProjectButton projectId={project.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
