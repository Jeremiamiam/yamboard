"use client"

import { deleteProject } from "@/actions/projects"

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const handleSubmit = (e: React.FormEvent) => {
    if (!confirm("Supprimer ce projet ? Cette action est irréversible.")) {
      e.preventDefault()
    }
  }

  return (
    <form action={deleteProject.bind(null, projectId)} onSubmit={handleSubmit}>
      <button
        type="submit"
        className="text-gray-300 hover:text-red-500 transition-colors px-1"
        aria-label="Supprimer le projet"
      >
        ×
      </button>
    </form>
  )
}
