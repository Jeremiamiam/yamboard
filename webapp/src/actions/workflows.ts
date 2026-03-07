"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { WORKFLOW_UNLOCKS } from "@/lib/workflows/system-prompts"

/**
 * Resets a workflow: deletes its messages and output, resets its status to "available",
 * and locks the next workflow in the chain.
 */
export async function resetWorkflow(
  projectId: string,
  slug: string,
  _formData: FormData
) {
  const supabase = await createClient()

  // Delete all messages for this workflow
  await supabase
    .from("messages")
    .delete()
    .eq("project_id", projectId)
    .eq("workflow_slug", slug)

  // Delete workflow output (if any)
  await supabase
    .from("workflow_outputs")
    .delete()
    .eq("project_id", projectId)
    .eq("workflow_slug", slug)

  // Reset this workflow to "available"
  await supabase
    .from("workflow_states")
    .update({ status: "available" })
    .eq("project_id", projectId)
    .eq("workflow_slug", slug)

  // Lock the next workflow in the chain (cascade reset)
  const nextSlug = WORKFLOW_UNLOCKS[slug]
  if (nextSlug) {
    await supabase
      .from("workflow_states")
      .update({ status: "locked" })
      .eq("project_id", projectId)
      .eq("workflow_slug", nextSlug)
  }

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}/chat?workflow=${slug}`)
}

/**
 * Marks a workflow as completed and unlocks the next workflow in the dependency chain.
 * Called via form action in ChatInterface.
 * Signature: bound args (projectId, slug) come BEFORE the FormData Next.js injects.
 * Usage: markWorkflowComplete.bind(null, projectId, slug)
 */
export async function markWorkflowComplete(
  projectId: string,
  slug: string,
  _formData: FormData
) {
  const supabase = await createClient()

  // Mark current workflow as completed
  const { error: completeError } = await supabase
    .from("workflow_states")
    .update({ status: "completed" })
    .eq("project_id", projectId)
    .eq("workflow_slug", slug)

  if (completeError) {
    console.error("[markWorkflowComplete] failed to mark completed:", completeError)
    return
  }

  // Unlock next workflow in the chain (if any)
  const nextSlug = WORKFLOW_UNLOCKS[slug]
  if (nextSlug) {
    const { error: unlockError } = await supabase
      .from("workflow_states")
      .update({ status: "available" })
      .eq("project_id", projectId)
      .eq("workflow_slug", nextSlug)

    if (unlockError) {
      console.error("[markWorkflowComplete] failed to unlock next workflow:", unlockError)
    }
  }

  // Invalidate the project page cache so workflow states refresh on next visit
  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}
