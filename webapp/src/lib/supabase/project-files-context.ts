import { SupabaseClient } from "@supabase/supabase-js"

const MAX_FILE_CHARS = 20_000 // ~5k tokens per file, hard cap
const MAX_TOTAL_CHARS = 60_000 // ~15k tokens total across all files

const TEXT_EXTENSIONS = [".txt", ".md", ".csv"]
const PDF_EXTENSION = ".pdf"

/**
 * Fetches all project files from Supabase Storage and extracts their text content.
 * Returns a formatted context block to inject into the system prompt, or null if no files.
 */
export async function buildFileContextBlock(
  projectId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<string | null> {
  // List files for this project
  const { data: files, error } = await supabase.storage
    .from("project-files")
    .list(`${userId}/${projectId}`, { sortBy: { column: "created_at", order: "asc" } })

  if (error || !files || files.length === 0) return null

  const blocks: string[] = []
  let totalChars = 0

  for (const file of files) {
    if (totalChars >= MAX_TOTAL_CHARS) break

    const filePath = `${userId}/${projectId}/${file.name}`
    const ext = extname(file.name).toLowerCase()

    // Skip unsupported formats
    if (!TEXT_EXTENSIONS.includes(ext) && ext !== PDF_EXTENSION) continue

    try {
      // Download file bytes
      const { data: blob, error: dlError } = await supabase.storage
        .from("project-files")
        .download(filePath)

      if (dlError || !blob) continue

      let text: string

      if (ext === PDF_EXTENSION) {
        text = await extractPdfText(blob)
      } else {
        text = await blob.text()
      }

      if (!text.trim()) continue

      // Truncate if too long
      if (text.length > MAX_FILE_CHARS) {
        text = text.slice(0, MAX_FILE_CHARS) + "\n[... tronqué]"
      }

      totalChars += text.length
      blocks.push(`[${file.name}]\n${text.trim()}`)
    } catch {
      // Non-fatal: skip file on error
      console.error(`[project-files-context] failed to process ${file.name}`)
    }
  }

  if (blocks.length === 0) return null

  return `--- Fichiers clients du projet ---\n\n${blocks.join("\n\n---\n\n")}\n\n--- Fin des fichiers ---`
}

function extname(filename: string): string {
  const idx = filename.lastIndexOf(".")
  return idx >= 0 ? filename.slice(idx) : ""
}

async function extractPdfText(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  // pdf-parse excluded from Turbopack bundling via serverExternalPackages in next.config.ts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (buf: Buffer, options?: any) => Promise<{ numpages: number }>

  const pageTexts: string[] = []
  let pageNum = 0

  // pagerender is called once per page — we insert [Page N] markers for citation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await pdfParse(buffer, {
    pagerender: async (pageData: any) => {
      pageNum++
      const textContent = await pageData.getTextContent()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = textContent.items.map((item: any) => ("str" in item ? item.str : "")).join(" ")
      const trimmed = text.trim()
      if (trimmed) pageTexts.push(`[Page ${pageNum}]\n${trimmed}`)
      return trimmed
    },
  })

  return pageTexts.join("\n\n")
}
