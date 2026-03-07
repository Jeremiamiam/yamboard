import { createClient } from "@/lib/supabase/server"

// REQUIRED: Edge runtime is incompatible with Supabase SSR cookie handling — use Node.js
export const runtime = "nodejs"

/**
 * GET /api/projects/[id]/files
 * Lists files for a project from Supabase Storage.
 *
 * Response: { files: Array<{ name: string; path: string; metadata?: { size?: number } }> }
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { id: projectId } = await params

  const { data, error } = await supabase.storage
    .from("project-files")
    .list(`${user.id}/${projectId}`, {
      sortBy: { column: "created_at", order: "desc" },
    })

  if (error) return new Response(error.message, { status: 500 })

  // Map to include full path for delete operations
  const files = (data ?? []).map((f) => ({
    name: f.name,
    path: `${user.id}/${projectId}/${f.name}`,
    metadata: f.metadata,
  }))

  return Response.json({ files })
}

/**
 * POST /api/projects/[id]/files
 * Returns a signed upload URL for client-direct-to-Storage upload.
 * The client uses this URL to PUT the file directly to Supabase Storage,
 * bypassing the API route (avoids Vercel's 4MB body limit).
 *
 * Body: { filename: string }
 * Response: { signedUrl: string, path: string, token: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { id: projectId } = await params
  const body = await request.json()
  const { filename } = body // e.g. "brief.pdf"

  if (!filename) return new Response("Missing filename", { status: 400 })

  // Sanitize filename: replace spaces and accented chars to produce a valid Storage key
  const safeFilename = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/\s+/g, "_")            // spaces → underscores
    .replace(/[^a-zA-Z0-9._\-]/g, "_") // any remaining invalid char → underscore

  // Path: {user_id}/{project_id}/{filename}
  // First segment (user_id) is enforced by the RLS policy on storage.objects
  const filePath = `${user.id}/${projectId}/${safeFilename}`

  const { data, error } = await supabase.storage
    .from("project-files")
    .createSignedUploadUrl(filePath)

  if (error) return new Response(error.message, { status: 500 })

  return Response.json({
    signedUrl: data.signedUrl,
    path: filePath,
    token: data.token,
  })
}

/**
 * DELETE /api/projects/[id]/files
 * Removes a file from Supabase Storage.
 * Verifies path ownership before calling Storage (defense-in-depth; RLS also enforces this).
 *
 * Body: { path: string } — full path: {user_id}/{project_id}/{filename}
 * Response: 204 No Content on success
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  // params is awaited for consistency; projectId available if needed for future validation
  const { id: _projectId } = await params
  const body = await request.json()
  const { path } = body // full path: {user_id}/{project_id}/{filename}

  if (!path) return new Response("Missing path", { status: 400 })

  // Security: verify the path starts with user's own user_id segment
  // This is defense-in-depth — the RLS policy on storage.objects enforces the same rule
  if (!path.startsWith(`${user.id}/`)) {
    return new Response("Forbidden", { status: 403 })
  }

  const { error } = await supabase.storage.from("project-files").remove([path])

  if (error) return new Response(error.message, { status: 500 })

  return new Response(null, { status: 204 })
}
