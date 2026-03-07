import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Extracts the first ```json ... ``` code block from assistant text.
 * Returns the raw JSON string, or null if no block found.
 */
export function extractJsonOutput(text: string): string | null {
  const match = text.match(/```json\s*\n([\s\S]*?)\n```/)
  if (!match) return null
  return match[1].trim()
}

/**
 * Persist a workflow JSON output to the workflow_outputs table.
 * Called server-side after stream completes.
 */
export async function persistOutput(
  projectId: string,
  workflowSlug: string,
  jsonString: string,
  supabase: SupabaseClient
): Promise<void> {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    console.error("[persistOutput] invalid JSON, skipping persist")
    return
  }

  const { error } = await supabase
    .from("workflow_outputs")
    .insert({
      project_id: projectId,
      workflow_slug: workflowSlug,
      output_json: parsed,
    })

  if (error) {
    console.error("[persistOutput] error:", error)
    throw error
  }
}
