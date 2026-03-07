import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatInterface } from "@/components/chat-interface"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ workflow?: string }>
}

export default async function ChatPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { workflow: workflowSlug } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Load project to validate it exists and get the name for the header
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single()

  if (!project) {
    notFound()
  }

  // Check if the current workflow is already completed (hide "Marquer comme terminé" when resuming)
  let workflowCompleted = false
  if (workflowSlug) {
    const { data: wfState } = await supabase
      .from("workflow_states")
      .select("status")
      .eq("project_id", id)
      .eq("workflow_slug", workflowSlug)
      .single()
    workflowCompleted = wfState?.status === "completed"
  }

  return (
    <div className="h-screen flex flex-col">
      <ChatInterface
        projectId={project.id}
        projectName={project.name}
        workflowSlug={workflowSlug}
        workflowCompleted={workflowCompleted}
      />
    </div>
  )
}
