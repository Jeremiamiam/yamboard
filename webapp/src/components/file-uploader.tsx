"use client"

import { useState, useRef } from "react"

interface FileUploaderProps {
  projectId: string
  onUploadComplete: () => void
}

export function FileUploader({ projectId, onUploadComplete }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      for (const file of Array.from(files)) {
        // 1. Get signed upload URL from our API
        const res = await fetch(`/api/projects/${projectId}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name }),
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Erreur lors de la création de l'URL signée : ${text}`)
        }

        const { signedUrl } = await res.json()

        // 2. Upload directly to Supabase Storage via signed URL (PUT with raw file body)
        // Use file.type so CORS content-type matches (e.g. application/pdf, not octet-stream)
        const contentType = file.type || "application/octet-stream"
        let uploadRes: Response
        try {
          uploadRes = await fetch(signedUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: file,
          })
        } catch {
          throw new Error(`Impossible de joindre le serveur de stockage pour "${file.name}". Vérifiez votre connexion.`)
        }

        if (!uploadRes.ok) {
          const text = await uploadRes.text()
          throw new Error(`Erreur lors de l'upload du fichier "${file.name}" (${uploadRes.status}) : ${text}`)
        }
      }

      // Reset input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = ""
      onUploadComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur inattendue s'est produite")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label
        className={`
          flex flex-col items-center justify-center w-full h-24
          border-2 border-dashed rounded-lg cursor-pointer
          transition-colors
          ${uploading
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
          }
        `}
      >
        <div className="flex flex-col items-center justify-center text-sm text-gray-500">
          {uploading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <span className="inline-block w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
              <span className="text-sm font-medium">Envoi en cours...</span>
            </div>
          ) : (
            <>
              <span className="text-2xl mb-1">↑</span>
              <span className="text-sm font-medium text-gray-600">Cliquez pour ajouter des fichiers</span>
              <span className="text-xs text-gray-400 mt-0.5">PDF, TXT, MD, DOCX · Max 32MB</span>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,.docx"
          multiple
          disabled={uploading}
          onChange={handleChange}
          className="hidden"
        />
      </label>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
