import { createClient } from "@/lib/supabase/server"
import { WikiNav } from "@/components/wiki-nav"
import { WikiSection } from "@/components/wiki-section"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

const WIKI_SECTIONS: Array<{ slug: string; label: string }> = [
  { slug: "start", label: "Contre-brief" },
  { slug: "platform", label: "Plateforme" },
  { slug: "campaign", label: "Campagne" },
  { slug: "site", label: "Site" },
  { slug: "site-standalone", label: "Site" },
]

interface WikiPageProps {
  params: Promise<{ id: string }>
}

type WorkflowOutput = {
  id: string
  workflow_slug: string
  output_json: Record<string, unknown>
  created_at: string
}

export default async function WikiPage({ params }: WikiPageProps) {
  const { id } = await params

  const supabase = await createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single()

  if (!project) notFound()

  const { data: outputs } = await supabase
    .from("workflow_outputs")
    .select("id, workflow_slug, output_json, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false })

  const allOutputs: WorkflowOutput[] = outputs ?? []

  // Build sections in WIKI_SECTIONS order, deduplicate by slug (first match wins = most recent)
  const seenSlugs = new Set<string>()
  const sections: Array<{
    slug: string
    label: string
    output: WorkflowOutput
  }> = []

  for (const { slug, label } of WIKI_SECTIONS) {
    if (seenSlugs.has(slug)) continue
    const output = allOutputs.find((o) => o.workflow_slug === slug)
    if (output) {
      sections.push({ slug, label, output })
      seenSlugs.add(slug)
    }
  }

  const sidebarSections = sections.map((s) => ({ slug: s.slug, label: s.label }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          ← Projets
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
        <Link
          href={`/projects/${id}`}
          className="ml-auto text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Agent →
        </Link>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        <aside className="hidden lg:block">
          <WikiNav sections={sidebarSections} />
        </aside>
        <main className="flex-1 min-w-0">
          {sections.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Aucun workflow complété — revenez après avoir terminé au moins un workflow.
            </p>
          ) : (
            sections.map((s) => (
              <WikiSection
                key={s.slug}
                id={`wiki-${s.slug}`}
                slug={s.slug}
                label={s.label}
                outputJson={s.output.output_json}
                createdAt={s.output.created_at}
              />
            ))
          )}
        </main>
      </div>
    </div>
  )
}
