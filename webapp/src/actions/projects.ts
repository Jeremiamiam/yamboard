"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const INITIAL_WORKFLOW_STATES = [
  { slug: "start",           status: "available" },
  { slug: "platform",        status: "locked" },
  { slug: "campaign",        status: "locked" },
  { slug: "site-standalone", status: "available" }, // independent chain
  { slug: "site",            status: "locked" },
  { slug: "wireframe",       status: "locked" },
]

export async function createProject(name: string) {
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name: name.trim() })
    .select()
    .single()

  if (error || !project) throw new Error(error?.message ?? "Failed to create project")

  // Initialize workflow states for the new project
  const workflowRows = INITIAL_WORKFLOW_STATES.map((w) => ({
    project_id: project.id,
    workflow_slug: w.slug,
    status: w.status,
  }))

  await supabase.from("workflow_states").insert(workflowRows)

  revalidatePath("/dashboard")
  redirect(`/projects/${project.id}`)
}

export async function deleteProject(id: string) {
  const supabase = await createClient()

  await supabase.from("projects").delete().eq("id", id)
  // workflow_states cascade-delete via FK ON DELETE CASCADE

  revalidatePath("/dashboard")
  redirect("/dashboard")
}
