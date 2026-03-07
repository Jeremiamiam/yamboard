import { SupabaseClient } from "@supabase/supabase-js"

export type Message = {
  role: "user" | "assistant"
  content: string
}

/**
 * Load conversation history for a project, filtered by workflow.
 * Pass workflowSlug to scope to a specific workflow chat; omit for generic chat.
 * Returns empty array if no messages or on error.
 */
export async function loadMessages(
  projectId: string,
  supabase: SupabaseClient,
  workflowSlug?: string
): Promise<Message[]> {
  let query = supabase
    .from("messages")
    .select("role, content")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })

  if (workflowSlug) {
    query = query.eq("workflow_slug", workflowSlug)
  } else {
    query = query.is("workflow_slug", null)
  }

  const { data, error } = await query

  if (error) {
    console.error("[loadMessages] error:", error)
    return []
  }

  return (data ?? []) as Message[]
}

/**
 * Persist a single message to DB.
 * Called client-side for user messages (before stream starts),
 * called server-side for assistant messages (after stream completes).
 * Pass workflowSlug to associate message with a specific workflow chat.
 */
export async function persistMessage(
  projectId: string,
  role: "user" | "assistant",
  content: string,
  supabase: SupabaseClient,
  workflowSlug?: string
): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .insert({ project_id: projectId, role, content, workflow_slug: workflowSlug ?? null })

  if (error) {
    console.error("[persistMessage] error:", error)
    throw error
  }
}
