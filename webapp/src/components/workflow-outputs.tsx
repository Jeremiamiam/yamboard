"use client"

import { WORKFLOW_LABELS } from "@/lib/workflows/system-prompts"

type WorkflowOutput = {
  id: string
  workflow_slug: string
  output_json: Record<string, unknown>
  created_at: string
}

interface WorkflowOutputsProps {
  projectId: string
  initialOutputs: WorkflowOutput[]
}

export function WorkflowOutputs({ initialOutputs }: WorkflowOutputsProps) {
  const handleDownload = (output: WorkflowOutput) => {
    const jsonStr = JSON.stringify(output.output_json, null, 2)
    const blob = new Blob([jsonStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${output.workflow_slug}-output.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (initialOutputs.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-gray-400">Aucun output — complétez un workflow pour voir les résultats ici.</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-100">
      {initialOutputs.map((output) => {
        const label = WORKFLOW_LABELS[output.workflow_slug] ?? output.workflow_slug
        const date = new Date(output.created_at).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        return (
          <li key={output.id} className="flex items-center justify-between py-3">
            <div>
              <span className="text-sm font-medium text-gray-900">{label}</span>
              <span className="ml-2 text-xs text-gray-400">{date}</span>
            </div>
            <button
              onClick={() => handleDownload(output)}
              className="shrink-0 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
            >
              ↓ Télécharger
            </button>
          </li>
        )
      })}
    </ul>
  )
}
