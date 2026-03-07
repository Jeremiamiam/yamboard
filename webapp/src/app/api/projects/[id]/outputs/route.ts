import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { id: projectId } = await params

  const { data, error } = await supabase
    .from("workflow_outputs")
    .select("id, workflow_slug, output_json, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (error) return new Response(error.message, { status: 500 })

  return Response.json({ outputs: data ?? [] })
}
