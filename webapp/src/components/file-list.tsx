"use client"

import { useState } from "react"

interface FileItem {
  name: string
  path: string
  metadata?: { size?: number }
}

interface FileListProps {
  projectId: string
  files: FileItem[]
  onDeleteComplete: () => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 o"
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function FileList({ projectId, files, onDeleteComplete }: FileListProps) {
  const [deletingPaths, setDeletingPaths] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(file: FileItem) {
    const confirmed = window.confirm("Supprimer ce fichier ?")
    if (!confirmed) return

    setDeletingPaths((prev) => new Set(prev).add(file.path))
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: file.path }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Erreur lors de la suppression : ${text}`)
      }

      onDeleteComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur inattendue s'est produite")
    } finally {
      setDeletingPaths((prev) => {
        const next = new Set(prev)
        next.delete(file.path)
        return next
      })
    }
  }

  if (files.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-2 text-center">Aucun fichier ajouté</p>
    )
  }

  return (
    <div className="space-y-0">
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-2">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}
      <ul className="divide-y divide-gray-100">
        {files.map((file) => {
          const isDeleting = deletingPaths.has(file.path)
          const size = file.metadata?.size

          return (
            <li key={file.path} className="flex items-center justify-between py-2.5 px-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-400 shrink-0">📄</span>
                <span className="text-sm text-gray-800 truncate">{file.name}</span>
                {size !== undefined && (
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatBytes(size)}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(file)}
                disabled={isDeleting}
                className="shrink-0 ml-3 text-xs text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? (
                  <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                ) : "Supprimer"}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
